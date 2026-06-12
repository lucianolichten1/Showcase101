#!/usr/bin/env node
/**
 * Apply all supabase/migrations/*.sql in order.
 * Requires SUPABASE_DB_URL (direct Postgres connection string) in env or .env.local.
 *
 * Example:
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
 *     node scripts/apply-supabase-migrations.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const migrationsDir = join(root, "supabase", "migrations");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL or DATABASE_URL.\n" +
      "Add the Postgres connection string from Supabase → Project Settings → Database."
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log(`Connected. Applying ${files.length} migrations...`);

  await client.query("CREATE SCHEMA IF NOT EXISTS supabase_migrations");
  await client.query(`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const { rows } = await client.query(
      "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
      [version]
    );
    if (rows.length > 0) {
      console.log(`  skip ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`  apply ${file}...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)",
        [version]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log("\nPublic tables:");
  for (const row of tables.rows) console.log(`  - ${row.table_name}`);

  await client.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
