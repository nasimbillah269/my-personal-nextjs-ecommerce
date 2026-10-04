import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    charset: "utf8mb4",
    timezone: "Z",
  });

if (!globalForDb.mysqlPool) {
  // Store and read every timestamp in UTC so JS Dates round-trip correctly.
  pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
}

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
