import type { Request, Response } from "express";
import { ResultBuilder } from "../../../../utils";
import { CookieConfig, TOKEN_CONFIG_RECORD } from "../../data";
import * as AuthError from "../../error";
import { SignInSchema } from "../../schemas";
import { SignInResult } from "../../types";
import { createTokens } from "../../utils";
import { verifyUser } from "./verify-user";
import { getSignInMethod } from "./get-sign-in-method";

export async function handleSignIn(
  req: Request<{}, {}, SignInSchema>,
  res: Response
) {
  const { body: authDetails, requestLogger: logger, sessionManager } = req;

  //  *validate and verify user credentials
  const verificationResult = await verifyUser(req);

  if (!verificationResult.success) {
    //  !authentication failed
    const { error } = verificationResult;

    res
      .status(AuthError.SignIn.getErrStatusCode(error))
      .json({ success: false, ...error });

    const safeId = getSafeId(authDetails.identifier);
    const logMsg = `Failed sign-in attempt from user ${safeId}.`;
    logger.log("error", logMsg, error);

    return;
  }

  //  *start session creation
  const { isPersistentAuth } = authDetails;
  const { result: user } = verificationResult;
  const sessionNumber = sessionManager.generateSessionNumber(user.userId);

  //  *create tokens
  const tokenResult = await createTokens(req, {
    verifiedUser: user,
    sessionNumber,
    isPersistentAuth,
  });

  const internalErrMsg =
    "An error occurred while authenticating. Please try again later.";
  if (!tokenResult.success) {
    //  !failed creating tokens
    const { error } = tokenResult;

    res
      .status(AuthError.Session.getErrStatusCode(error))
      .json({ success: false, ...error, message: internalErrMsg });

    logger.log("error", "Failed creating tokens.", error);

    return;
  }

  //  *start session
  const { accessToken, refreshToken } = tokenResult.result;

  const persistentTokenExpiry = new Date();
  persistentTokenExpiry.setDate(persistentTokenExpiry.getDate() + 30);
  const sessionResult = await sessionManager.startSession({
    sessionNumber,
    userId: user.userId,
    refreshToken,
    expiresAt: isPersistentAuth ? persistentTokenExpiry : null,
  });

  if (!sessionResult.success) {
    //  !failed starting session
    const { error } = sessionResult;

    res
      .status(AuthError.Session.getErrStatusCode(error))
      .json({ success: false, ...error, message: internalErrMsg });

    logger.log("error", "Failed starting session.", error);

    return;
  }

  const cookieResult = getRefreshConfig();

  if (!cookieResult.success) {
    //  !failed getting refresh token config
    const { error } = cookieResult;

    res
      .status(AuthError.SignIn.getErrStatusCode(error))
      .json({ success: false, ...error, message: internalErrMsg });

    logger.log("error", "Failed getting refresh token config.", error);

    return;
  }

  const { cookieName, persistentCookie, sessionCookie } = cookieResult.result;

  //  *cookie creation
  res.cookie(
    cookieName,
    refreshToken,
    isPersistentAuth ? persistentCookie : sessionCookie
  );
  res.json({ success: true, accessToken });
}

function getSafeId(identifier: string): string {
  const signInMethod = getSignInMethod(identifier);

  switch (signInMethod) {
    case "email":
      return identifier.replace(/^(.{2}).*(@.*)$/, "$1***$2"); //  mask emails
    case "username":
      return identifier.slice(0, Math.min(8, identifier.length)) + "***";
    default:
      return JSON.stringify(identifier).slice(0, 50);
  }
}

function getRefreshConfig():
  | SignInResult.Success<CookieConfig>
  | SignInResult.Fail {
  const { cookieConfig: refreshCookie } = TOKEN_CONFIG_RECORD.refresh;

  if (!refreshCookie)
    //  cookie config not set
    return ResultBuilder.fail({
      name: "SIGN_IN_SYSTEM_ERROR",
      message: "Refresh token cookie is not configured properly.",
    });

  return ResultBuilder.success(refreshCookie);
}
