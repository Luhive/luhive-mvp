import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const run = promisify(execFile);

/**
 * Generates Kysely types for one database and returns them.
 *
 * Restricted to `public`: the Supabase-managed schemas differ between projects
 * (`net`, `supabase_functions` only exist where webhooks are enabled) and this
 * package never queries them. Kysely's own bookkeeping tables exist only after
 * a migration run, so they are excluded too.
 */
export async function generateTypes(
  connectionString: string,
  outFile: string,
): Promise<string> {
  await run(
    "kysely-codegen",
    [
      "--url",
      connectionString,
      "--default-schema=public",
      "--include-pattern=public.*",
      "--exclude-pattern=public.kysely_migration*",
      "--out-file",
      outFile,
    ],
    { env: process.env },
  );

  return readFile(outFile, "utf8");
}
