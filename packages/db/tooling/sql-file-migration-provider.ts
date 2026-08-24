import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql, type Kysely } from "kysely";
import type { Migration, MigrationProvider } from "kysely/migration";

/**
 * Runs hand-written `.sql` files as migrations.
 *
 * `kysely-ctl`'s default provider only loads TypeScript modules, so the
 * baseline dump would be silently skipped without this.
 */
export class SqlFileMigrationProvider implements MigrationProvider {
  constructor(private readonly migrationFolder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const entries = await readdir(this.migrationFolder, {
      withFileTypes: true,
    });

    // Only the folder root: `archive/` holds pre-baseline history that must
    // never execute.
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const migrations: Record<string, Migration> = {};

    for (const file of files) {
      const path = join(this.migrationFolder, file);
      migrations[file.replace(/\.sql$/, "")] = {
        // Forward-only: no `down`, so a rollback cannot half-drop the schema.
        async up(db: Kysely<unknown>) {
          const statements = await readFile(path, "utf8");
          assertNoMetaCommands(statements, file);
          // Raw with no parameters, so pg uses the simple query protocol and
          // the whole file runs as one multi-statement command.
          await sql.raw(statements).execute(db);
        },
      };
    }

    return migrations;
  }
}

function assertNoMetaCommands(statements: string, file: string): void {
  const offending = statements
    .split("\n")
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .find(({ line }) => line.startsWith("\\"));

  if (offending) {
    throw new Error(
      `${file}:${offending.number} contains the psql meta-command "${offending.line}". Postgres cannot execute it; strip it from the file.`,
    );
  }
}
