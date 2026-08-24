import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * Generates Supabase's own `Database` type for one database.
 *
 * This is not redundant with `kysely-codegen`. supabase-js infers `.from()`
 * results from Supabase's `Row`/`Insert`/`Update` shape, which Kysely's flat
 * table interfaces cannot satisfy, so both generators run off the same schema.
 *
 * `--db-url` rather than `--project-id`: the connection string is already the
 * package's one production credential, and it needs no dashboard login.
 */
export async function generateSupabaseTypes(
  connectionString: string,
  outFile: string,
): Promise<string> {
  const { stdout } = await run(
    "supabase",
    [
      "gen",
      "types",
      "typescript",
      "--db-url",
      connectionString,
      "--schema",
      "public",
    ],
    { maxBuffer: 32 * 1024 * 1024, env: process.env },
  );

  await writeFile(outFile, stdout, "utf8");

  return stdout;
}
