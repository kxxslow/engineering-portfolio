import { NextRequest } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { openCommerceDb } from "@/db/client";
import { resetCommerceDatabase } from "@/db/reset";
import {
  idempotencyKeys,
  syncRunItems,
  syncRuns,
  targetRecords
} from "@/db/schema";
import {
  executePendingRows,
  planDryRun,
  retryFailedRows
} from "@/lib/sync-service";
import { POST as dryRunPost } from "../../app/api/sync/dry-run/route";

describe("commerce sync SQLite workflow", () => {
  let dbPath: string;
  let connection: ReturnType<typeof openCommerceDb>;

  beforeEach(() => {
    dbPath = path.join(
      os.tmpdir(),
      `commerce-sync-${process.pid}-${Date.now()}-${Math.random()}.sqlite`
    );
    process.env.COMMERCE_SYNC_DB_PATH = dbPath;
    resetCommerceDatabase(dbPath, false);
    connection = openCommerceDb(dbPath);
  });

  afterEach(() => {
    connection.sqlite.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    delete process.env.COMMERCE_SYNC_DB_PATH;
  });

  it("classifies unchanged rows as skipped", () => {
    const result = planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });

    const mug = result.items.find((item) => item.sku === "MUG-BLUE");
    expect(mug?.action).toBe("skip");
    expect(mug?.status).toBe("skipped");
  });

  it("updates changed rows during execution", () => {
    planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });

    const candle = connection.db
      .select()
      .from(targetRecords)
      .where(eq(targetRecords.sku, "CANDLE-LAV"))
      .get();

    expect(candle?.priceCents).toBe(2400);
    expect(candle?.inventory).toBe(18);
    expect(candle?.remoteVersion).toBe(4);
  });

  it("creates new rows that are not selected for deterministic failure", () => {
    planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });

    const bottle = connection.db
      .select()
      .from(targetRecords)
      .where(eq(targetRecords.sku, "BOTTLE-CLEAR"))
      .get();

    expect(bottle?.title).toBe("Clear glass bottle");
    expect(bottle?.remoteVersion).toBe(1);
  });

  it("records deterministic partial failure", () => {
    planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    const result = executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });

    const failed = result.items.find((item) => item.sku === "TOTE-GREEN");
    const run = connection.db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.id, "test-exec"))
      .get();

    expect(run?.status).toBe("partially_failed");
    expect(failed?.status).toBe("failed");
    expect(failed?.errorMessage).toContain("Simulated destination timeout");
  });

  it("retries only failed rows", () => {
    planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });
    const retry = retryFailedRows(connection.db, {
      parentRunId: "test-exec",
      runId: "test-retry",
      createdAt: "2026-07-15T09:18:00-07:00"
    });

    expect(retry.items).toHaveLength(1);
    expect(retry.items[0].sku).toBe("TOTE-GREEN");
    expect(retry.items[0].status).toBe("applied");
  });

  it("prevents duplicate writes through idempotency keys", () => {
    planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });
    retryFailedRows(connection.db, {
      parentRunId: "test-exec",
      runId: "test-retry",
      createdAt: "2026-07-15T09:18:00-07:00"
    });

    const before = connection.db
      .select()
      .from(targetRecords)
      .where(eq(targetRecords.sku, "CANDLE-LAV"))
      .get();

    const duplicate = executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-duplicate",
      createdAt: "2026-07-15T09:22:00-07:00"
    });

    const after = connection.db
      .select()
      .from(targetRecords)
      .where(eq(targetRecords.sku, "CANDLE-LAV"))
      .get();

    expect(duplicate.items.every((item) => item.status === "duplicate")).toBe(true);
    expect(after?.remoteVersion).toBe(before?.remoteVersion);
  });

  it("persists the run ledger", () => {
    planDryRun(connection.db, {
      runId: "test-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    executePendingRows(connection.db, {
      sourceRunId: "test-dry-run",
      runId: "test-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });
    retryFailedRows(connection.db, {
      parentRunId: "test-exec",
      runId: "test-retry",
      createdAt: "2026-07-15T09:18:00-07:00"
    });

    const ledger = connection.db.select().from(idempotencyKeys).all();
    const appliedItems = connection.db
      .select()
      .from(syncRunItems)
      .all()
      .filter((item) => item.status === "applied");

    expect(ledger).toHaveLength(8);
    expect(appliedItems).toHaveLength(8);
  });

  it("exposes dry-run behavior through the route handler", async () => {
    const response = await dryRunPost(
      new NextRequest("http://localhost/api/sync/dry-run", {
        method: "POST",
        body: JSON.stringify({
          runId: "test-api-dry-run",
          createdAt: "2026-07-15T09:30:00-07:00"
        })
      })
    );
    const body = (await response.json()) as { itemCount: number };

    expect(response.status).toBe(200);
    expect(body.itemCount).toBe(12);
    expect(
      connection.db
        .select()
        .from(syncRuns)
        .where(eq(syncRuns.id, "test-api-dry-run"))
        .get()?.kind
    ).toBe("dry_run");
  });
});
