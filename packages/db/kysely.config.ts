import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";
import { SqlFileMigrationProvider } from "./tooling/sql-file-migration-provider";
import { resolveValidationUrl } from "./tooling/validation-target";

const migrationFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export default defineConfig({
  dialect: "pg",
  dialectConfig: {
    // Lazy so `kysely --help` loads without a connection string, and so the
    // production guard runs at the moment a command actually connects.
    pool: async () => new Pool({ connectionString: resolveValidationUrl() }),
  },
  migrations: {
    provider: new SqlFileMigrationProvider(migrationFolder),
  },
});
