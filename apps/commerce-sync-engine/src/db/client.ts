import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import * as schema from "@/db/schema";

export type CommerceDb = ReturnType<typeof drizzle<typeof schema>>;

export function getDatabasePath() {
  return (
    process.env.COMMERCE_SYNC_DB_PATH ??
    path.join(process.cwd(), "data", "commerce-sync.sqlite")
  );
}

export function openCommerceDb(dbPath = getDatabasePath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");

  return {
    sqlite,
    db: drizzle(sqlite, { schema })
  };
}

export function withCommerceDb<T>(
  callback: (db: CommerceDb) => T,
  dbPath = getDatabasePath()
) {
  const connection = openCommerceDb(dbPath);

  try {
    return callback(connection.db);
  } finally {
    connection.sqlite.close();
  }
}
