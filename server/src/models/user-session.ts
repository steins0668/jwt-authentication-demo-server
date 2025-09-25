import {
  index,
  integer,
  text,
  uniqueIndex,
  sqliteTable,
} from "drizzle-orm/sqlite-core";
import { isNull } from "drizzle-orm";
import { User } from "./user";

export const UserSession = sqliteTable(
  "user_sessions",
  {
    sessionId: integer("session_id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => User.userId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sessionHash: text("session_hash").unique().notNull(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at"),
    lastUsedAt: text("last_used_at").notNull(),
  },
  (table) => [
    uniqueIndex("user_sessions_session_hash_uidx").on(table.sessionHash),
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_persistent_clean_up_idx").on(table.expiresAt),
    index("user_sessions_session_clean_up_idx")
      .on(table.expiresAt, table.lastUsedAt)
      .where(isNull(table.expiresAt)),
  ]
);
