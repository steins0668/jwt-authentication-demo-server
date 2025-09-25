export function getDbUrl(): string {
  const dbName: string | undefined = process.env.DB_URL;
  if (!dbName) throw new Error("DB URL not configured.");

  return dbName;
}
