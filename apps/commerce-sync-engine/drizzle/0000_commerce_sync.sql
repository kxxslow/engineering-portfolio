CREATE TABLE IF NOT EXISTS source_records (
  id TEXT PRIMARY KEY NOT NULL,
  source_batch TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  inventory INTEGER NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS target_records (
  id TEXT PRIMARY KEY NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  inventory INTEGER NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  remote_version INTEGER NOT NULL,
  last_payload_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  source_batch TEXT NOT NULL,
  parent_run_id TEXT,
  created_at TEXT NOT NULL,
  create_count INTEGER NOT NULL DEFAULT 0,
  update_count INTEGER NOT NULL DEFAULT 0,
  skip_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_run_items (
  id TEXT PRIMARY KEY NOT NULL,
  run_id TEXT NOT NULL REFERENCES sync_runs(id) ON DELETE CASCADE,
  source_record_id TEXT REFERENCES source_records(id),
  target_record_id TEXT REFERENCES target_records(id),
  sku TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_hash TEXT,
  idempotency_key TEXT,
  reason TEXT NOT NULL,
  error_message TEXT,
  before_json TEXT,
  after_json TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY NOT NULL,
  run_item_id TEXT NOT NULL REFERENCES sync_run_items(id),
  target_record_id TEXT NOT NULL REFERENCES target_records(id),
  payload_hash TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id TEXT PRIMARY KEY NOT NULL,
  run_id TEXT NOT NULL REFERENCES sync_runs(id) ON DELETE CASCADE,
  run_item_id TEXT REFERENCES sync_run_items(id),
  level TEXT NOT NULL,
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
