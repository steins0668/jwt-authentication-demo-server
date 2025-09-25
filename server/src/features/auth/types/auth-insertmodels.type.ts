import * as schema from "../../../models";

export type NewSessionToken = typeof schema.SessionToken.$inferInsert;
export type NewUser = typeof schema.User.$inferInsert;
export type NewUserSession = typeof schema.UserSession.$inferInsert;
