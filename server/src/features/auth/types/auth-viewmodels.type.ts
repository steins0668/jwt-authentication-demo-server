import * as schema from "../../../models";

export type RoleViewModel = typeof schema.Role.$inferSelect;
export type SessionTokenViewModel = typeof schema.SessionToken.$inferSelect;
export type UserSessionViewModel = typeof schema.UserSession.$inferSelect;
export type UserViewModel = typeof schema.User.$inferSelect;
