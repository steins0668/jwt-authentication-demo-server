import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client/.";
import { ENV } from "../data";

let dbClient: ReturnType<typeof createClient> | null = null;

export async function createContext() {
  if (!dbClient) {
    dbClient = createClient({
      url: ENV.getDbUrl(),
    });
  }

  await dbClient.execute("PRAGMA foreign_keys=ON;");

  return dbClient;
}
