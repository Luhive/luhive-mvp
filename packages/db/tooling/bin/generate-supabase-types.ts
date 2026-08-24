import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSupabaseTypes } from "../supabase-gen-types";

const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/supabase.types.ts",
);

const url = process.env.PRODUCTION_DATABASE_URL;
if (!url) {
  throw new Error("PRODUCTION_DATABASE_URL is not set.");
}

await generateSupabaseTypes(url, OUT_FILE);

console.log(`Wrote ${OUT_FILE}`);
