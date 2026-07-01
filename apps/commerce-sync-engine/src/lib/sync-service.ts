import { eq, inArray } from "drizzle-orm";

import type { CommerceDb } from "@/db/client";
import {
  idempotencyKeys,
  operationLogs,
  sourceRecords,
  syncRunItems,
  syncRuns,
  targetRecords,
  type SourceRecord,
  type SyncRunItem,
  type TargetRecord,
} from "@/db/schema";
import type {
  ClassifiedDiff,
  FieldChange,
  ProductPayload,
} from "@/lib/sync-types";
import {
  makeIdempotencyKey,
  stablePayloadHash,
  toPayload,
} from "@/lib/sync-utils";

const sourceBatch = "catalog-july-ops.csv";
const deterministicFailureSku = "TOTE-GREEN";

export function planDryRun(
  db: CommerceDb,
  options: { runId: string; createdAt: string },
) {
  db.delete(syncRuns).where(eq(syncRuns.id, options.runId)).run();

  const sources = db.select().from(sourceRecords).all();
  const targets = db.select().from(targetRecords).all();
  const targetBySku = new Map(targets.map((record) => [record.sku, record]));
  const diffs = sources.map((source) =>
    classifySourceRecord(source, targetBySku.get(source.sku.trim()) ?? null),
  );

  const summary = summarizeDiffs(diffs);

  db.insert(syncRuns)
    .values({
      id: options.runId,
      kind: "dry_run",
      status: "planned",
      sourceBatch,
      parentRunId: null,
      createdAt: options.createdAt,
      createCount: summary.create,
      updateCount: summary.update,
      skipCount: summary.skip,
      failCount: summary.fail,
    })
    .run();

  for (const diff of diffs) {
    db.insert(syncRunItems)
      .values({
        id: makeRunItemId(options.runId, diff.sku || diff.sourceRecordId),
        runId: options.runId,
        sourceRecordId: diff.sourceRecordId,
        targetRecordId: diff.targetRecordId,
        sku: diff.sku || diff.sourceRecordId.toUpperCase(),
        action: diff.action,
        status: diff.status,
        payloadHash: diff.payloadHash,
        idempotencyKey: diff.idempotencyKey,
        reason: diff.reason,
        errorMessage: diff.action === "fail" ? diff.reason : null,
        beforeJson: diff.before ? JSON.stringify(diff.before) : null,
        afterJson: diff.after ? JSON.stringify(diff.after) : null,
        attemptCount: 0,
      })
      .run();
  }

  logRun(
    db,
    options.runId,
    null,
    "info",
    "dry_run_persisted",
    "Dry-run diff recorded with row classifications.",
    options.createdAt,
  );

  return getRunWithItems(db, options.runId);
}

export function executePendingRows(
  db: CommerceDb,
  options: { sourceRunId: string; runId: string; createdAt: string },
) {
  db.delete(syncRuns).where(eq(syncRuns.id, options.runId)).run();

  const pendingItems = db
    .select()
    .from(syncRunItems)
    .where(eq(syncRunItems.runId, options.sourceRunId))
    .all()
    .filter((item) => item.status === "pending");

  db.insert(syncRuns)
    .values({
      id: options.runId,
      kind: "execute",
      status: "completed",
      sourceBatch,
      parentRunId: options.sourceRunId,
      createdAt: options.createdAt,
      createCount: pendingItems.filter((item) => item.action === "create")
        .length,
      updateCount: pendingItems.filter((item) => item.action === "update")
        .length,
      skipCount: 0,
      failCount: 0,
    })
    .run();

  let failCount = 0;
  let skipCount = 0;

  for (const item of pendingItems) {
    const executed = executeRunItem(db, item, {
      runId: options.runId,
      createdAt: options.createdAt,
      simulateFailure: item.sku === deterministicFailureSku,
    });

    if (executed.status === "failed") {
      failCount += 1;
    }
    if (executed.status === "duplicate") {
      skipCount += 1;
    }
  }

  db.update(syncRuns)
    .set({
      status: failCount > 0 ? "partially_failed" : "completed",
      failCount,
      skipCount,
    })
    .where(eq(syncRuns.id, options.runId))
    .run();

  logRun(
    db,
    options.runId,
    null,
    failCount > 0 ? "warn" : "info",
    "execution_completed",
    failCount > 0
      ? "Execution completed with one row held for retry."
      : "Execution completed without failed rows.",
    options.createdAt,
  );

  return getRunWithItems(db, options.runId);
}

export function retryFailedRows(
  db: CommerceDb,
  options: { parentRunId: string; runId: string; createdAt: string },
) {
  db.delete(syncRuns).where(eq(syncRuns.id, options.runId)).run();

  const failedItems = db
    .select()
    .from(syncRunItems)
    .where(eq(syncRunItems.runId, options.parentRunId))
    .all()
    .filter((item) => item.status === "failed");

  db.insert(syncRuns)
    .values({
      id: options.runId,
      kind: "retry",
      status: "completed",
      sourceBatch,
      parentRunId: options.parentRunId,
      createdAt: options.createdAt,
      createCount: failedItems.filter((item) => item.action === "create")
        .length,
      updateCount: failedItems.filter((item) => item.action === "update")
        .length,
      skipCount: 0,
      failCount: 0,
    })
    .run();

  let failCount = 0;
  let skipCount = 0;

  for (const item of failedItems) {
    const executed = executeRunItem(db, item, {
      runId: options.runId,
      createdAt: options.createdAt,
      simulateFailure: false,
    });

    if (executed.status === "failed") {
      failCount += 1;
    }
    if (executed.status === "duplicate") {
      skipCount += 1;
    }
  }

  db.update(syncRuns)
    .set({
      status: failCount > 0 ? "partially_failed" : "completed",
      failCount,
      skipCount,
    })
    .where(eq(syncRuns.id, options.runId))
    .run();

  logRun(
    db,
    options.runId,
    null,
    "info",
    "retry_completed",
    `Retried ${failedItems.length} failed row${failedItems.length === 1 ? "" : "s"} from ${options.parentRunId}.`,
    options.createdAt,
  );

  return getRunWithItems(db, options.runId);
}

export function getRunWithItems(db: CommerceDb, runId: string) {
  const run = db.select().from(syncRuns).where(eq(syncRuns.id, runId)).get();
  const items = db
    .select()
    .from(syncRunItems)
    .where(eq(syncRunItems.runId, runId))
    .all();
  const logs = db
    .select()
    .from(operationLogs)
    .where(eq(operationLogs.runId, runId))
    .all();

  return { run, items, logs };
}

export function getLatestDryRun(db: CommerceDb) {
  const runs = db.select().from(syncRuns).all();
  const dryRuns = runs.filter((run) => run.kind === "dry_run");

  return dryRuns.at(-1) ?? null;
}

export function resetDemoRuns(db: CommerceDb) {
  const runs = db.select().from(syncRuns).all();
  if (runs.length > 0) {
    db.delete(syncRuns)
      .where(
        inArray(
          syncRuns.id,
          runs.map((run) => run.id),
        ),
      )
      .run();
  }
}

function classifySourceRecord(
  source: SourceRecord,
  target: TargetRecord | null,
): ClassifiedDiff {
  const validation = validateSource(source);
  if (validation.length > 0) {
    return {
      sourceRecordId: source.id,
      targetRecordId: null,
      sku: source.sku || source.id.toUpperCase(),
      action: "fail",
      status: "invalid",
      reason: validation.join(" "),
      payloadHash: null,
      idempotencyKey: null,
      before: null,
      after: null,
      changes: [],
    };
  }

  const after = toPayload(source);
  const payloadHash = stablePayloadHash(after);

  if (!target) {
    return {
      sourceRecordId: source.id,
      targetRecordId: null,
      sku: after.sku,
      action: "create",
      status: "pending",
      reason: "Destination record does not exist.",
      payloadHash,
      idempotencyKey: makeIdempotencyKey("create", after.sku, payloadHash),
      before: null,
      after,
      changes: Object.entries(after).map(([field, value]) => ({
        field: field as keyof ProductPayload,
        before: undefined,
        after: value,
      })),
    };
  }

  const before = toPayload(target);
  const changes: FieldChange[] = [];
  for (const field of [
    "title",
    "priceCents",
    "inventory",
    "status",
    "category",
  ] as const) {
    if (before[field] !== after[field]) {
      changes.push({ field, before: before[field], after: after[field] });
    }
  }

  if (changes.length === 0) {
    return {
      sourceRecordId: source.id,
      targetRecordId: target.id,
      sku: after.sku,
      action: "skip",
      status: "skipped",
      reason: "Source and target payloads match.",
      payloadHash,
      idempotencyKey: null,
      before,
      after,
      changes: [],
    };
  }

  return {
    sourceRecordId: source.id,
    targetRecordId: target.id,
    sku: after.sku,
    action: "update",
    status: "pending",
    reason: `${changes.length} field${changes.length === 1 ? "" : "s"} changed.`,
    payloadHash,
    idempotencyKey: makeIdempotencyKey("update", after.sku, payloadHash),
    before,
    after,
    changes,
  };
}

function executeRunItem(
  db: CommerceDb,
  sourceItem: SyncRunItem,
  options: { runId: string; createdAt: string; simulateFailure: boolean },
) {
  const executionItemId = makeRunItemId(options.runId, sourceItem.sku);
  const existingKey =
    sourceItem.idempotencyKey === null
      ? null
      : db
          .select()
          .from(idempotencyKeys)
          .where(eq(idempotencyKeys.key, sourceItem.idempotencyKey))
          .get();

  if (existingKey) {
    const duplicate = {
      id: executionItemId,
      runId: options.runId,
      sourceRecordId: sourceItem.sourceRecordId,
      targetRecordId: existingKey.targetRecordId,
      sku: sourceItem.sku,
      action: sourceItem.action,
      status: "duplicate",
      payloadHash: sourceItem.payloadHash,
      idempotencyKey: sourceItem.idempotencyKey,
      reason: "Skipped because this write was already recorded.",
      errorMessage: null,
      beforeJson: sourceItem.beforeJson,
      afterJson: sourceItem.afterJson,
      attemptCount: sourceItem.attemptCount + 1,
    };
    db.insert(syncRunItems).values(duplicate).run();
    logRun(
      db,
      options.runId,
      executionItemId,
      "info",
      "duplicate_prevented",
      `Write already recorded for ${sourceItem.sku}.`,
      options.createdAt,
    );

    return duplicate;
  }

  if (options.simulateFailure) {
    const failed = {
      id: executionItemId,
      runId: options.runId,
      sourceRecordId: sourceItem.sourceRecordId,
      targetRecordId: sourceItem.targetRecordId,
      sku: sourceItem.sku,
      action: sourceItem.action,
      status: "failed",
      payloadHash: sourceItem.payloadHash,
      idempotencyKey: sourceItem.idempotencyKey,
      reason: sourceItem.reason,
      errorMessage: "Simulated destination timeout before acknowledgement.",
      beforeJson: sourceItem.beforeJson,
      afterJson: sourceItem.afterJson,
      attemptCount: sourceItem.attemptCount + 1,
    };
    db.insert(syncRunItems).values(failed).run();
    logRun(
      db,
      options.runId,
      executionItemId,
      "warn",
      "row_failed",
      `Partial failure recorded for ${sourceItem.sku}.`,
      options.createdAt,
    );

    return failed;
  }

  if (
    !sourceItem.afterJson ||
    !sourceItem.payloadHash ||
    !sourceItem.idempotencyKey
  ) {
    throw new Error(
      `Cannot execute item ${sourceItem.id}: missing payload or idempotency key.`,
    );
  }

  const payload = JSON.parse(sourceItem.afterJson) as ProductPayload;
  const targetId = applyPayload(db, sourceItem, payload, options.createdAt);

  const applied = {
    id: executionItemId,
    runId: options.runId,
    sourceRecordId: sourceItem.sourceRecordId,
    targetRecordId: targetId,
    sku: sourceItem.sku,
    action: sourceItem.action,
    status: "applied",
    payloadHash: sourceItem.payloadHash,
    idempotencyKey: sourceItem.idempotencyKey,
    reason: "Applied to target record.",
    errorMessage: null,
    beforeJson: sourceItem.beforeJson,
    afterJson: sourceItem.afterJson,
    attemptCount: sourceItem.attemptCount + 1,
  };
  db.insert(syncRunItems).values(applied).run();
  db.insert(idempotencyKeys)
    .values({
      key: sourceItem.idempotencyKey,
      runItemId: executionItemId,
      targetRecordId: targetId,
      payloadHash: sourceItem.payloadHash,
      appliedAt: options.createdAt,
    })
    .run();
  logRun(
    db,
    options.runId,
    executionItemId,
    "info",
    "row_applied",
    `${sourceItem.action} applied for ${sourceItem.sku}.`,
    options.createdAt,
  );

  return applied;
}

function applyPayload(
  db: CommerceDb,
  item: SyncRunItem,
  payload: ProductPayload,
  appliedAt: string,
) {
  const existing = db
    .select()
    .from(targetRecords)
    .where(eq(targetRecords.sku, payload.sku))
    .get();

  const targetId = existing?.id ?? `dest-${payload.sku.toLowerCase()}`;

  if (existing) {
    db.update(targetRecords)
      .set({
        title: payload.title,
        priceCents: payload.priceCents,
        inventory: payload.inventory,
        status: payload.status,
        category: payload.category,
        remoteVersion: existing.remoteVersion + 1,
        lastPayloadHash: item.payloadHash ?? existing.lastPayloadHash,
        updatedAt: appliedAt,
      })
      .where(eq(targetRecords.id, existing.id))
      .run();

    return existing.id;
  }

  db.insert(targetRecords)
    .values({
      id: targetId,
      sku: payload.sku,
      title: payload.title,
      priceCents: payload.priceCents,
      inventory: payload.inventory,
      status: payload.status,
      category: payload.category,
      remoteVersion: 1,
      lastPayloadHash: item.payloadHash ?? stablePayloadHash(payload),
      updatedAt: appliedAt,
    })
    .run();

  return targetId;
}

function validateSource(source: SourceRecord) {
  const errors: string[] = [];

  if (!source.sku.trim()) {
    errors.push("Source SKU is required.");
  }
  if (!source.title.trim()) {
    errors.push("Missing title.");
  }
  if (source.priceCents < 0) {
    errors.push("Invalid source price.");
  }
  if (source.inventory < 0) {
    errors.push("Inventory cannot be negative.");
  }

  return errors;
}

function summarizeDiffs(diffs: ClassifiedDiff[]) {
  return {
    create: diffs.filter((diff) => diff.action === "create").length,
    update: diffs.filter((diff) => diff.action === "update").length,
    skip: diffs.filter((diff) => diff.action === "skip").length,
    fail: diffs.filter((diff) => diff.action === "fail").length,
  };
}

function logRun(
  db: CommerceDb,
  runId: string,
  runItemId: string | null,
  level: "info" | "warn",
  event: string,
  message: string,
  createdAt = new Date().toISOString(),
) {
  const existingCount = db
    .select()
    .from(operationLogs)
    .where(eq(operationLogs.runId, runId))
    .all().length;

  db.insert(operationLogs)
    .values({
      id: `log-${runId}-${String(existingCount + 1).padStart(2, "0")}-${event}`,
      runId,
      runItemId,
      level,
      event,
      message,
      createdAt,
    })
    .run();
}

function makeRunItemId(runId: string, suffix: string) {
  return `${runId}:item:${suffix.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()}`;
}
