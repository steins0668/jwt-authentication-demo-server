import * as schema from "../../../models";

export type NewRole = typeof schema.Role.$inferInsert;
export type NewSessionToken = typeof schema.SessionToken.$inferInsert;
export type NewUser = typeof schema.User.$inferInsert;
export type NewUserSession = typeof schema.UserSession.$inferInsert;
