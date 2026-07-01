import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import * as schema from "@/db/schema";

export type SupportDb = ReturnType<typeof drizzle<typeof schema>>;

export function getDatabasePath() {
  return (
    process.env.SUPPORT_RAG_DB_PATH ??
    path.join(process.cwd(), "data", "support-rag.sqlite")
  );
}

export function openSupportDb(dbPath = getDatabasePath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");

  return {
    sqlite,
    db: drizzle(sqlite, { schema })
  };
}

export function withSupportDb<T>(
  callback: (db: SupportDb) => T,
  dbPath = getDatabasePath()
) {
  const connection = openSupportDb(dbPath);

  try {
    return callback(connection.db);
  } finally {
    connection.sqlite.close();
  }
}
