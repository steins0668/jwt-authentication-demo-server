import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const Role = sqliteTable("roles", {
  roleId: integer("role_id").primaryKey({ autoIncrement: true }),
  roleName: text("role").unique().notNull(),
});
