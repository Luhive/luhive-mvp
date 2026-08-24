import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateTypes } from "../kysely-codegen";

const OUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/db.types.ts",
);

const url = process.env.PRODUCTION_DATABASE_URL;
if (!url) {
  throw new Error("PRODUCTION_DATABASE_URL is not set.");
}

await generateTypes(url, OUT_FILE);

console.log(`Wrote ${OUT_FILE}`);
