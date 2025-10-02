import { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, LibSQLDatabase, LibSQLTransaction } from "drizzle-orm/libsql";
import { ENV } from "../data";
import * as schema from "../models";

export type DbContext = LibSQLDatabase<typeof schema>;
export type TxContext = LibSQLTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

let dbContext: DbContext | undefined;

export async function createContext(): Promise<DbContext> {
  if (dbContext === undefined) {
    dbContext = drizzle(ENV.getDbUrl(), { schema });
    dbContext.run("PRAGMA foreign_keys=ON;");
  }

  return dbContext;
}
