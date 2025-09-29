import { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import Database from "better-sqlite3";
import { ENV } from "../data";
import * as schema from "../models";

export async function createContext() {
  const sqlite = new Database(ENV.getDbUrl());
  sqlite.exec("PRAGMA foreign_keys=ON;");

  return drizzle({ client: sqlite, schema });
}

export type DbContext = Awaited<ReturnType<typeof createContext>>;
export type TxContext = SQLiteTransaction<
  "async",
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
