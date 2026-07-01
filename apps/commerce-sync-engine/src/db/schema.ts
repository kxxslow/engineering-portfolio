import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sourceRecords = sqliteTable("source_records", {
  id: text("id").primaryKey(),
  sourceBatch: text("source_batch").notNull(),
  rowNumber: integer("row_number").notNull(),
  sku: text("sku").notNull(),
  title: text("title").notNull(),
  priceCents: integer("price_cents").notNull(),
  inventory: integer("inventory").notNull(),
  status: text("status").notNull(),
  category: text("category").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const targetRecords = sqliteTable("target_records", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  title: text("title").notNull(),
  priceCents: integer("price_cents").notNull(),
  inventory: integer("inventory").notNull(),
  status: text("status").notNull(),
  category: text("category").notNull(),
  remoteVersion: integer("remote_version").notNull(),
  lastPayloadHash: text("last_payload_hash").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const syncRuns = sqliteTable("sync_runs", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  sourceBatch: text("source_batch").notNull(),
  parentRunId: text("parent_run_id"),
  createdAt: text("created_at").notNull(),
  createCount: integer("create_count").notNull().default(0),
  updateCount: integer("update_count").notNull().default(0),
  skipCount: integer("skip_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0)
});

export const syncRunItems = sqliteTable("sync_run_items", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => syncRuns.id, { onDelete: "cascade" }),
  sourceRecordId: text("source_record_id").references(() => sourceRecords.id),
  targetRecordId: text("target_record_id").references(() => targetRecords.id),
  sku: text("sku").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  payloadHash: text("payload_hash"),
  idempotencyKey: text("idempotency_key"),
  reason: text("reason").notNull(),
  errorMessage: text("error_message"),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  attemptCount: integer("attempt_count").notNull().default(0)
});

export const idempotencyKeys = sqliteTable("idempotency_keys", {
  key: text("key").primaryKey(),
  runItemId: text("run_item_id")
    .notNull()
    .references(() => syncRunItems.id),
  targetRecordId: text("target_record_id")
    .notNull()
    .references(() => targetRecords.id),
  payloadHash: text("payload_hash").notNull(),
  appliedAt: text("applied_at").notNull()
});

export const operationLogs = sqliteTable("operation_logs", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => syncRuns.id, { onDelete: "cascade" }),
  runItemId: text("run_item_id").references(() => syncRunItems.id),
  level: text("level").notNull(),
  event: text("event").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull()
});

export type SourceRecord = typeof sourceRecords.$inferSelect;
export type TargetRecord = typeof targetRecords.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
export type SyncRunItem = typeof syncRunItems.$inferSelect;
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type OperationLog = typeof operationLogs.$inferSelect;
