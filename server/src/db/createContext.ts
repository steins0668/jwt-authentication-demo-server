import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { ENV } from "../data";
import * as schema from "../models";

export async function createContext() {
  const sqlite = new Database(ENV.getDbUrl());
  sqlite.exec("PRAGMA foreign_keys=ON;");

  return drizzle({ client: sqlite, schema });
}

export type DbContext = Awaited<ReturnType<typeof createContext>>;
