import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { openCommerceDb } from "@/db/client";
import { seedCommerceData } from "@/db/seed";

export function resetCommerceDatabase(dbPath: string, includeDemoRuns = true) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const sqlite = new Database(dbPath);
  const migration = fs.readFileSync(
    path.join(process.cwd(), "drizzle", "0000_commerce_sync.sql"),
    "utf8"
  );

  sqlite.exec("PRAGMA foreign_keys = ON;");
  sqlite.exec(migration);
  sqlite.close();

  const connection = openCommerceDb(dbPath);
  try {
    seedCommerceData(connection.db, includeDemoRuns);
  } finally {
    connection.sqlite.close();
  }
}
