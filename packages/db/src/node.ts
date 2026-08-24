import { Kysely, PostgresDialect } from "kysely";
import { Pool, type PoolConfig } from "pg";
import type { DB } from "./db.types";

/**
 * Builds a Node-only Kysely client. The returned instance owns the `pg` pool;
 * call `await db.destroy()` to release it.
 */
export function createNodeClient(config: PoolConfig) {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool(config),
    }),
  });
}

export type NodeClient = Kysely<DB>;
