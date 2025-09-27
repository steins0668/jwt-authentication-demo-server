import * as schema from "../../../models";

export type Role = typeof schema.Role.$inferInsert;
export type SessionToken = typeof schema.SessionToken.$inferInsert;
export type User = typeof schema.User.$inferInsert;
export type UserSession = typeof schema.UserSession.$inferInsert;
