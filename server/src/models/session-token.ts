import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { UserSession } from "./user-session";

export const SessionToken = sqliteTable("session_tokens", {
  tokenId: integer("token_id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => UserSession.sessionId),
  tokenHash: text("token_hash").unique().notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at"),
  isUsed: integer("is_used", { mode: "boolean" }).notNull().default(false),
});
