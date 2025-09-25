export function getDb(): string {
  const dbName: string | undefined = process.env.DB_FILENAME;
  if (!dbName) throw new Error("DB filename not configured.");

  return dbName;
}
