import { Request } from "express";
import { SessionResult, ViewModels } from "../../types";

/**
 * todo: add better docs
 * Start session
 * @param req
 * @param sessionNumber
 * @param verifiedUser
 * @param refreshToken
 * @param isPersistentAuth
 * @returns
 */
export async function startSession(
  req: Request,
  data: {
    sessionNumber: string;
    user: ViewModels.User;
    refreshToken: string;
    isPersistentAuth?: boolean | undefined;
  }
): Promise<SessionResult.Success<string> | SessionResult.Fail> {
  const { sessionManager } = req;
  const { sessionNumber, user, refreshToken, isPersistentAuth } = data;

  const persistentTokenExpiry = new Date();

  persistentTokenExpiry.setDate(persistentTokenExpiry.getDate() + 30);

  const sessionResult = await sessionManager.startSession({
    sessionNumber,
    userId: user.userId,
    refreshToken,
    expiresAt: isPersistentAuth ? persistentTokenExpiry : null,
  });

  return sessionResult;
}
