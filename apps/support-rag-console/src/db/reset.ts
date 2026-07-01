import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { openSupportDb } from "@/db/client";
import { seedSupportData } from "@/db/seed";

export function resetSupportDatabase(dbPath: string, includeDemoDecisions = true) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const sqlite = new Database(dbPath);
  const migration = fs.readFileSync(
    path.join(process.cwd(), "drizzle", "0000_support_rag.sql"),
    "utf8"
  );

  sqlite.exec("PRAGMA foreign_keys = ON;");
  sqlite.exec(migration);
  sqlite.close();

  const connection = openSupportDb(dbPath);
  try {
    seedSupportData(connection.db, includeDemoDecisions);
  } finally {
    connection.sqlite.close();
  }
}
