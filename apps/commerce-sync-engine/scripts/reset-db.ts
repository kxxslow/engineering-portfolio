import { getDatabasePath } from "../src/db/client";
import { resetCommerceDatabase } from "../src/db/reset";

const dbPath = getDatabasePath();
resetCommerceDatabase(dbPath, true);

console.log(`Reset and seeded commerce sync database at ${dbPath}`);
