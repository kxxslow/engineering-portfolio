import type { CommerceDb } from "@/db/client";
import {
  idempotencyKeys,
  operationLogs,
  sourceRecords,
  syncRunItems,
  syncRuns,
  targetRecords
} from "@/db/schema";
import { planDryRun, executePendingRows, retryFailedRows } from "@/lib/sync-service";
import { stablePayloadHash } from "@/lib/sync-utils";

const importedAt = "2026-07-15T09:00:00-07:00";

export function seedCommerceData(db: CommerceDb, includeDemoRuns = true) {
  db.delete(operationLogs).run();
  db.delete(idempotencyKeys).run();
  db.delete(syncRunItems).run();
  db.delete(syncRuns).run();
  db.delete(sourceRecords).run();
  db.delete(targetRecords).run();

  db.insert(sourceRecords)
    .values([
      {
        id: "src-blue-mug",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 2,
        sku: "MUG-BLUE",
        title: "Blue stoneware mug",
        priceCents: 1800,
        inventory: 42,
        status: "active",
        category: "Drinkware",
        updatedAt: importedAt
      },
      {
        id: "src-lavender-candle",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 3,
        sku: "CANDLE-LAV",
        title: "Lavender soy candle",
        priceCents: 2400,
        inventory: 18,
        status: "active",
        category: "Home",
        updatedAt: importedAt
      },
      {
        id: "src-green-tote",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 4,
        sku: "TOTE-GREEN",
        title: "Green market tote",
        priceCents: 3200,
        inventory: 14,
        status: "active",
        category: "Accessories",
        updatedAt: importedAt
      },
      {
        id: "src-clear-bottle",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 5,
        sku: "BOTTLE-CLEAR",
        title: "Clear glass bottle",
        priceCents: 2800,
        inventory: 24,
        status: "active",
        category: "Drinkware",
        updatedAt: importedAt
      },
      {
        id: "src-sea-soap",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 6,
        sku: "SOAP-SEA",
        title: "Sea salt hand soap",
        priceCents: 900,
        inventory: 0,
        status: "draft",
        category: "Bath",
        updatedAt: importedAt
      },
      {
        id: "src-oak-lamp",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 7,
        sku: "LAMP-OAK",
        title: "Oak desk lamp",
        priceCents: 6400,
        inventory: 9,
        status: "active",
        category: "Home",
        updatedAt: importedAt
      },
      {
        id: "src-tea-tin",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 8,
        sku: "TEA-TIN",
        title: "Breakfast tea tin",
        priceCents: 1600,
        inventory: 30,
        status: "active",
        category: "Pantry",
        updatedAt: importedAt
      },
      {
        id: "src-ceramic-bowl",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 9,
        sku: "BOWL-CERAMIC",
        title: "Ceramic serving bowl",
        priceCents: 3600,
        inventory: 15,
        status: "active",
        category: "Kitchen",
        updatedAt: importedAt
      },
      {
        id: "src-linen-towel",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 10,
        sku: "TOWEL-LINEN",
        title: "Linen bath towel",
        priceCents: 4200,
        inventory: 22,
        status: "active",
        category: "Bath",
        updatedAt: importedAt
      },
      {
        id: "src-usb-c-cable",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 11,
        sku: "CABLE-USB-C",
        title: "USB-C travel cable",
        priceCents: -100,
        inventory: 16,
        status: "active",
        category: "Electronics",
        updatedAt: importedAt
      },
      {
        id: "src-kraft-notebook",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 12,
        sku: "NOTEBOOK-KRAFT",
        title: "Kraft pocket notebook",
        priceCents: 1200,
        inventory: 48,
        status: "active",
        category: "Stationery",
        updatedAt: importedAt
      },
      {
        id: "src-walnut-tray",
        sourceBatch: "catalog-july-ops.csv",
        rowNumber: 13,
        sku: "TRAY-WALNUT",
        title: "Walnut catchall tray",
        priceCents: 5200,
        inventory: 7,
        status: "active",
        category: "Home",
        updatedAt: importedAt
      }
    ])
    .run();

  db.insert(targetRecords)
    .values([
      {
        id: "dest-mug-blue",
        sku: "MUG-BLUE",
        title: "Blue stoneware mug",
        priceCents: 1800,
        inventory: 42,
        status: "active",
        category: "Drinkware",
        remoteVersion: 7,
        lastPayloadHash: stablePayloadHash({
          sku: "MUG-BLUE",
          title: "Blue stoneware mug",
          priceCents: 1800,
          inventory: 42,
          status: "active",
          category: "Drinkware"
        }),
        updatedAt: "2026-07-15T08:55:00-07:00"
      },
      {
        id: "dest-candle-lav",
        sku: "CANDLE-LAV",
        title: "Lavender soy candle",
        priceCents: 2200,
        inventory: 12,
        status: "active",
        category: "Home",
        remoteVersion: 3,
        lastPayloadHash: stablePayloadHash({
          sku: "CANDLE-LAV",
          title: "Lavender soy candle",
          priceCents: 2200,
          inventory: 12,
          status: "active",
          category: "Home"
        }),
        updatedAt: "2026-07-15T08:40:00-07:00"
      },
      {
        id: "dest-soap-sea",
        sku: "SOAP-SEA",
        title: "Sea salt hand soap",
        priceCents: 900,
        inventory: 4,
        status: "active",
        category: "Bath",
        remoteVersion: 5,
        lastPayloadHash: stablePayloadHash({
          sku: "SOAP-SEA",
          title: "Sea salt hand soap",
          priceCents: 900,
          inventory: 4,
          status: "active",
          category: "Bath"
        }),
        updatedAt: "2026-07-15T08:30:00-07:00"
      },
      {
        id: "dest-tea-tin",
        sku: "TEA-TIN",
        title: "Breakfast tea tin",
        priceCents: 1600,
        inventory: 30,
        status: "active",
        category: "Pantry",
        remoteVersion: 2,
        lastPayloadHash: stablePayloadHash({
          sku: "TEA-TIN",
          title: "Breakfast tea tin",
          priceCents: 1600,
          inventory: 30,
          status: "active",
          category: "Pantry"
        }),
        updatedAt: "2026-07-15T08:25:00-07:00"
      },
      {
        id: "dest-bowl-ceramic",
        sku: "BOWL-CERAMIC",
        title: "Ceramic serving bowl",
        priceCents: 3400,
        inventory: 12,
        status: "active",
        category: "Kitchen",
        remoteVersion: 4,
        lastPayloadHash: stablePayloadHash({
          sku: "BOWL-CERAMIC",
          title: "Ceramic serving bowl",
          priceCents: 3400,
          inventory: 12,
          status: "active",
          category: "Kitchen"
        }),
        updatedAt: "2026-07-15T08:20:00-07:00"
      },
      {
        id: "dest-kraft-notebook",
        sku: "NOTEBOOK-KRAFT",
        title: "Kraft pocket notebook",
        priceCents: 1200,
        inventory: 48,
        status: "active",
        category: "Stationery",
        remoteVersion: 5,
        lastPayloadHash: stablePayloadHash({
          sku: "NOTEBOOK-KRAFT",
          title: "Kraft pocket notebook",
          priceCents: 1200,
          inventory: 48,
          status: "active",
          category: "Stationery"
        }),
        updatedAt: "2026-07-15T08:18:00-07:00"
      },
      {
        id: "dest-tray-walnut",
        sku: "TRAY-WALNUT",
        title: "Walnut catchall tray",
        priceCents: 5200,
        inventory: 5,
        status: "held",
        category: "Home",
        remoteVersion: 6,
        lastPayloadHash: stablePayloadHash({
          sku: "TRAY-WALNUT",
          title: "Walnut catchall tray",
          priceCents: 5200,
          inventory: 5,
          status: "held",
          category: "Home"
        }),
        updatedAt: "2026-07-15T08:10:00-07:00"
      }
    ])
    .run();

  if (includeDemoRuns) {
    planDryRun(db, {
      runId: "sync-run-2026-07-15-dry-run",
      createdAt: "2026-07-15T09:05:00-07:00"
    });
    executePendingRows(db, {
      sourceRunId: "sync-run-2026-07-15-dry-run",
      runId: "sync-run-2026-07-15-exec",
      createdAt: "2026-07-15T09:10:00-07:00"
    });
    retryFailedRows(db, {
      parentRunId: "sync-run-2026-07-15-exec",
      runId: "sync-run-2026-07-15-exec-retry",
      createdAt: "2026-07-15T09:18:00-07:00"
    });
    seedHistoricalRuns(db);
  }
}

function seedHistoricalRuns(db: CommerceDb) {
  db.insert(syncRuns)
    .values([
      {
        id: "sync-run-2026-07-14-dry-run",
        kind: "dry_run",
        status: "planned",
        sourceBatch: "catalog-july-ops.csv",
        parentRunId: null,
        createdAt: "2026-07-14T16:05:00-07:00",
        createCount: 1,
        updateCount: 1,
        skipCount: 1,
        failCount: 1
      },
      {
        id: "sync-run-2026-07-14-exec",
        kind: "execute",
        status: "completed",
        sourceBatch: "catalog-july-ops.csv",
        parentRunId: "sync-run-2026-07-14-dry-run",
        createdAt: "2026-07-14T16:10:00-07:00",
        createCount: 1,
        updateCount: 1,
        skipCount: 0,
        failCount: 0
      },
      {
        id: "sync-run-2026-07-13-exec",
        kind: "execute",
        status: "partially_failed",
        sourceBatch: "catalog-july-ops.csv",
        parentRunId: "sync-run-2026-07-13-dry-run",
        createdAt: "2026-07-13T15:42:00-07:00",
        createCount: 1,
        updateCount: 2,
        skipCount: 0,
        failCount: 1
      },
      {
        id: "sync-run-2026-07-13-exec-retry",
        kind: "retry",
        status: "completed",
        sourceBatch: "catalog-july-ops.csv",
        parentRunId: "sync-run-2026-07-13-exec",
        createdAt: "2026-07-13T15:50:00-07:00",
        createCount: 1,
        updateCount: 0,
        skipCount: 0,
        failCount: 0
      }
    ])
    .run();

  db.insert(syncRunItems)
    .values([
      {
        id: "sync-run-2026-07-14-dry-run:item:soap-sea",
        runId: "sync-run-2026-07-14-dry-run",
        sourceRecordId: "src-sea-soap",
        targetRecordId: "dest-soap-sea",
        sku: "SOAP-SEA",
        action: "update",
        status: "pending",
        payloadHash: "historical-soap-sea",
        idempotencyKey: "catalog:update:SOAP-SEA:historical-soap-sea",
        reason: "1 field changed.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 0
      },
      {
        id: "sync-run-2026-07-14-dry-run:item:lamp-oak",
        runId: "sync-run-2026-07-14-dry-run",
        sourceRecordId: "src-oak-lamp",
        targetRecordId: null,
        sku: "LAMP-OAK",
        action: "create",
        status: "pending",
        payloadHash: "historical-lamp-oak",
        idempotencyKey: "catalog:create:LAMP-OAK:historical-lamp-oak",
        reason: "Destination record does not exist.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 0
      },
      {
        id: "sync-run-2026-07-14-dry-run:item:tea-tin",
        runId: "sync-run-2026-07-14-dry-run",
        sourceRecordId: "src-tea-tin",
        targetRecordId: "dest-tea-tin",
        sku: "TEA-TIN",
        action: "skip",
        status: "skipped",
        payloadHash: "historical-tea-tin",
        idempotencyKey: null,
        reason: "Source and target payloads match.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 0
      },
      {
        id: "sync-run-2026-07-14-dry-run:item:cable-usb-c",
        runId: "sync-run-2026-07-14-dry-run",
        sourceRecordId: "src-usb-c-cable",
        targetRecordId: null,
        sku: "CABLE-USB-C",
        action: "fail",
        status: "invalid",
        payloadHash: null,
        idempotencyKey: null,
        reason: "Invalid source price.",
        errorMessage: "Invalid source price.",
        beforeJson: null,
        afterJson: null,
        attemptCount: 0
      },
      {
        id: "sync-run-2026-07-14-exec:item:soap-sea",
        runId: "sync-run-2026-07-14-exec",
        sourceRecordId: "src-sea-soap",
        targetRecordId: "dest-soap-sea",
        sku: "SOAP-SEA",
        action: "update",
        status: "applied",
        payloadHash: "historical-soap-sea",
        idempotencyKey: "catalog:update:SOAP-SEA:historical-soap-sea",
        reason: "Applied to target record.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 1
      },
      {
        id: "sync-run-2026-07-14-exec:item:lamp-oak",
        runId: "sync-run-2026-07-14-exec",
        sourceRecordId: "src-oak-lamp",
        targetRecordId: "dest-lamp-oak",
        sku: "LAMP-OAK",
        action: "create",
        status: "applied",
        payloadHash: "historical-lamp-oak",
        idempotencyKey: "catalog:create:LAMP-OAK:historical-lamp-oak",
        reason: "Applied to target record.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 1
      },
      {
        id: "sync-run-2026-07-13-exec:item:bowl-ceramic",
        runId: "sync-run-2026-07-13-exec",
        sourceRecordId: "src-ceramic-bowl",
        targetRecordId: "dest-bowl-ceramic",
        sku: "BOWL-CERAMIC",
        action: "update",
        status: "applied",
        payloadHash: "historical-bowl-ceramic",
        idempotencyKey: "catalog:update:BOWL-CERAMIC:historical-bowl-ceramic",
        reason: "Applied to target record.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 1
      },
      {
        id: "sync-run-2026-07-13-exec:item:tote-green",
        runId: "sync-run-2026-07-13-exec",
        sourceRecordId: "src-green-tote",
        targetRecordId: null,
        sku: "TOTE-GREEN",
        action: "create",
        status: "failed",
        payloadHash: "historical-tote-green",
        idempotencyKey: "catalog:create:TOTE-GREEN:historical-tote-green",
        reason: "Destination record does not exist.",
        errorMessage: "Carrier hold returned before acknowledgement.",
        beforeJson: null,
        afterJson: null,
        attemptCount: 1
      },
      {
        id: "sync-run-2026-07-13-exec-retry:item:tote-green",
        runId: "sync-run-2026-07-13-exec-retry",
        sourceRecordId: "src-green-tote",
        targetRecordId: "dest-tote-green",
        sku: "TOTE-GREEN",
        action: "create",
        status: "applied",
        payloadHash: "historical-tote-green",
        idempotencyKey: "catalog:create:TOTE-GREEN:historical-tote-green",
        reason: "Applied to target record.",
        errorMessage: null,
        beforeJson: null,
        afterJson: null,
        attemptCount: 2
      }
    ])
    .run();

  db.insert(operationLogs)
    .values([
      {
        id: "log-sync-run-2026-07-14-dry-run-01-dry-run-persisted",
        runId: "sync-run-2026-07-14-dry-run",
        runItemId: null,
        level: "info",
        event: "dry_run_persisted",
        message: "Dry-run diff recorded with row classifications.",
        createdAt: "2026-07-14T16:05:00-07:00"
      },
      {
        id: "log-sync-run-2026-07-14-exec-01-execution-completed",
        runId: "sync-run-2026-07-14-exec",
        runItemId: null,
        level: "info",
        event: "execution_completed",
        message: "Execution completed without failed rows.",
        createdAt: "2026-07-14T16:10:00-07:00"
      },
      {
        id: "log-sync-run-2026-07-13-exec-01-row-failed",
        runId: "sync-run-2026-07-13-exec",
        runItemId: "sync-run-2026-07-13-exec:item:tote-green",
        level: "warn",
        event: "row_failed",
        message: "Partial failure recorded for TOTE-GREEN.",
        createdAt: "2026-07-13T15:42:00-07:00"
      },
      {
        id: "log-sync-run-2026-07-13-exec-retry-01-retry-completed",
        runId: "sync-run-2026-07-13-exec-retry",
        runItemId: null,
        level: "info",
        event: "retry_completed",
        message: "Retried 1 failed row from sync-run-2026-07-13-exec.",
        createdAt: "2026-07-13T15:50:00-07:00"
      }
    ])
    .run();
}
