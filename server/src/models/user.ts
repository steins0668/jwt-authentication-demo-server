import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { Role } from "./role";

export const User = sqliteTable("users", {
  userId: integer("user_id").primaryKey({ autoIncrement: true }),
  roleId: integer("role_id")
    .notNull()
    .references(() => Role.roleId, { onDelete: "restrict" }),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").unique().notNull(),
});
