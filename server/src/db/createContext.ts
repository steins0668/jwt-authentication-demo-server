import { ExtractTablesWithRelations } from "drizzle-orm";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import Database from "better-sqlite3";
import { ENV } from "../data";
import * as schema from "../models";

export type DbContext = BetterSQLite3Database<typeof schema>;
export type TxContext = SQLiteTransaction<
  "sync",
  Database.RunResult,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
//  ? better version
// export type TxContext = Parameters<DbContext["transaction"]>[0] extends (
//   cb: (tx: infer T) => any
// ) => any
//   ? T
//   : never;

let dbContext: DbContext | undefined = undefined;

export async function createContext(): Promise<DbContext> {
  const sqlite = new Database(ENV.getDbUrl());
  sqlite.exec("PRAGMA foreign_keys=ON;");

  if (!dbContext) {
    dbContext = drizzle({ client: sqlite, schema });
  }

  return dbContext;
}
