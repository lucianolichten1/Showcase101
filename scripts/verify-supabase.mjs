#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { error } = await supabase.from("companies").select("id").limit(1);

if (error) {
  if (error.code === "PGRST205") {
    console.log("OK: Supabase connected — schema not migrated yet (companies table missing).");
    process.exit(0);
  }
  console.error("Supabase error:", error.message);
  process.exit(1);
}

console.log("OK: Supabase connected and companies table exists.");
process.exit(0);
