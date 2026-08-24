import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { SqlFileMigrationProvider } from "./sql-file-migration-provider";

describe("SqlFileMigrationProvider", () => {
  let folder: string;

  beforeAll(async () => {
    folder = await mkdtemp(join(tmpdir(), "luhive-migrations-"));
    await writeFile(join(folder, "0001_second.sql"), "SELECT 2;", "utf8");
    await writeFile(join(folder, "0000_first.sql"), "SELECT 1;", "utf8");
    await writeFile(join(folder, "notes.md"), "ignored", "utf8");
    await mkdir(join(folder, "archive"), { recursive: true });
    await writeFile(join(folder, "archive/old.sql"), "DROP TABLE events;", "utf8");
  });

  it("loads only root .sql files, in lexical order", async () => {
    const migrations = await new SqlFileMigrationProvider(folder).getMigrations();

    expect(Object.keys(migrations)).toEqual(["0000_first", "0001_second"]);
  });

  it("is forward-only", async () => {
    const migrations = await new SqlFileMigrationProvider(folder).getMigrations();

    expect(migrations["0000_first"].down).toBeUndefined();
  });

  it("rejects files containing psql meta-commands", async () => {
    await writeFile(join(folder, "0002_meta.sql"), "\\restrict x\nSELECT 3;", "utf8");
    const migrations = await new SqlFileMigrationProvider(folder).getMigrations();

    await expect(migrations["0002_meta"].up({} as never)).rejects.toThrow(
      /0002_meta\.sql:1 contains the psql meta-command "\\restrict x"/,
    );
  });
});
