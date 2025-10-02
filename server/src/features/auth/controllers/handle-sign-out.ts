import type { Request, Response } from "express";
import { CookieConfig } from "../data";
import * as AuthError from "../error";
import { getRefreshConfig, verifyRefreshTkn } from "../utils";

export async function handleSignOut(req: Request, res: Response) {
  const { requestLogger: logger, cookies, sessionManager } = req;

  const internalErrMsg =
    "An error occured while signing out session. Please try again later.";

  //  * get config for refresh token cookie
  const cookieConfig = getRefreshConfig();
  if (!cookieConfig.success) {
    //  !failed getting refresh token config
    const { error } = cookieConfig;

    res
      .status(AuthError.AuthConfig.getErrStatusCode(error))
      .json({ success: false, message: internalErrMsg });

    logger.log("error", "Failed getting refresh token config.", error);

    return;
  }

  const { cookieName: refresh } = cookieConfig.result;

  //  * helper function for clearing cookie
  const clearCookie = (cookieConfig: CookieConfig) => {
    const { cookieName: refresh, clearCookie } = cookieConfig;
    res
      .clearCookie(refresh, clearCookie)
      .status(200)
      .json({ success: true, message: "Logged out successfully." });
  };

  //  * get refresh tkn
  const refreshTkn = cookies?.[refresh] as string | undefined;
  //  ! refresh tkn not found. just clear cookie
  if (refreshTkn === undefined) return clearCookie(cookieConfig.result);

  //  * verify payload
  const payloadVerification = verifyRefreshTkn(req, refreshTkn);
  //  ! payload not found, just clear cookie
  if (!payloadVerification.success) return clearCookie(cookieConfig.result);

  //  * delete session
  const { sessionNumber } = payloadVerification.result;
  await sessionManager.endSession(sessionNumber);

  //  * clear cookie
  clearCookie(cookieConfig.result);
}
