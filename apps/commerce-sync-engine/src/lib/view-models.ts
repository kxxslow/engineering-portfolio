import { desc, eq } from "drizzle-orm";

import { withCommerceDb } from "@/db/client";
import {
  idempotencyKeys,
  operationLogs,
  sourceRecords,
  syncRunItems,
  syncRuns,
  targetRecords
} from "@/db/schema";

export function getCommerceSnapshot() {
  return withCommerceDb((db) => {
    const sources = db
      .select()
      .from(sourceRecords)
      .all()
      .sort((a, b) => a.rowNumber - b.rowNumber);
    const targets = db.select().from(targetRecords).all();
    const runs = db
      .select()
      .from(syncRuns)
      .orderBy(desc(syncRuns.createdAt))
      .all();
    const items = db.select().from(syncRunItems).all();
    const logs = db
      .select()
      .from(operationLogs)
      .orderBy(desc(operationLogs.createdAt))
      .all();
    const ledger = db.select().from(idempotencyKeys).all();

    const latestDryRun = runs.find((run) => run.kind === "dry_run") ?? null;
    const latestExecution =
      runs.find((run) => run.kind === "execute" || run.kind === "retry") ?? null;
    const latestDryRunItems = latestDryRun
      ? items.filter((item) => item.runId === latestDryRun.id)
      : [];

    return {
      sources,
      targets,
      runs,
      items,
      logs,
      ledger,
      latestDryRun,
      latestExecution,
      metrics: {
        sourceRows: sources.length,
        targetRows: targets.length,
        readyRows: latestDryRunItems.filter((item) => item.status === "pending")
          .length,
        failedRows: items.filter((item) => item.status === "failed").length,
        writeReferences: ledger.length
      }
    };
  });
}

export function getRunDetail(runId: string) {
  return withCommerceDb((db) => {
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
    const ledger = db.select().from(idempotencyKeys).all();
    const targets = db.select().from(targetRecords).all();

    return { run, items, logs, ledger, targets };
  });
}

export function getLatestDryRunItems() {
  const snapshot = getCommerceSnapshot();
  const runId = snapshot.latestDryRun?.id;

  return runId
    ? snapshot.items.filter((item) => item.runId === runId)
    : [];
}
