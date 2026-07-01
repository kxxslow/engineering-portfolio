import { getDatabasePath } from "@/db/client";
import { resetSupportDatabase } from "@/db/reset";

const dbPath = getDatabasePath();
resetSupportDatabase(dbPath);
console.log(`Reset support RAG SQLite database at ${dbPath}`);
