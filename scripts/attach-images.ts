/**
 * Adds the bundled product photos to an existing database without reseeding.
 *
 *   npm run db:images              # only products that have no image yet
 *   npm run db:images -- --force   # replace existing images too
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../src/db/schema";
import { attachSeedImages } from "./seed-images";

config({ path: ".env.local" });

async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, charset: "utf8mb4" });
  const db = drizzle(conn, { schema, mode: "default" });
  const n = await attachSeedImages(db, { force: process.argv.includes("--force") });
  console.log(`✓ Added photos to ${n} product${n === 1 ? "" : "s"}`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
