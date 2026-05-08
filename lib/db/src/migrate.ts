import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "drizzle",
);

console.log("Running migrations from:", migrationsFolder);
await migrate(db, { migrationsFolder });
console.log("Migrations complete.");
await pool.end();
