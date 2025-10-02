import type { Request, Response } from "express";
import { BaseResult } from "../../../../types";
import { ResultBuilder } from "../../../../utils";
import { type CookieConfig, TOKEN_CONFIG_RECORD } from "../../data";
import * as AuthError from "../../error";
import { SessionResult, ViewModels } from "../../types";
import { createTokens } from "../../utils";
import { verifyRefreshTkn } from "../../utils/verify-refresh-tkn";

export async function handleRefresh(req: Request, res: Response) {
  const { requestLogger: logger, cookies, sessionManager } = req;

  const internalErrMsg =
    "An error occured while refreshing session. Please try again later.";

  //  * get config for refresh cookie
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

  const { cookieName: refreshTknCookie } = cookieConfig.result;
  const oldRefreshTkn = cookies[refreshTknCookie] as string;

  //  * verify payload
  const payloadVerification = verifyRefreshTkn(req, oldRefreshTkn);
  if (!payloadVerification.success) {
    //  !failed payload verification
    const { error } = payloadVerification;

    res
      .status(AuthError.Session.getErrStatusCode(error))
      .json({ success: false, message: error.message });

    logger.log("error", "Failed verifying refresh token.", error);

    return;
  }

  //  * get user with user id from payload
  const userQuery = await resolveUser(req, payloadVerification.result.userId);

  if (!userQuery.success) {
    //  ! could not get user from db.
    res.status(500).json({ success: false, message: internalErrMsg });

    const { error } = userQuery;
    logger.log("error", "Failed retrieving user", error);
    return;
  }

  const { sessionNumber, isPersistentAuth } = payloadVerification.result;

  //  * create new tokens
  const tknCreation = await createTokens(req, {
    verifiedUser: userQuery.result,
    sessionNumber,
    isPersistentAuth,
  });

  if (!tknCreation.success) {
    //  !failed creating tokens
    const { error } = tknCreation;

    res
      .status(AuthError.Session.getErrStatusCode(error))
      .json({ success: false, message: internalErrMsg });

    logger.log("error", "Failed creating tokens.", error);

    return;
  }

  //  * token creation result
  const { accessToken, refreshToken } = tknCreation.result;

  //  * rotate tokens in session.
  const tknRotation = await sessionManager.rotateTokens({
    sessionNumber,
    oldToken: oldRefreshTkn,
    newToken: refreshToken,
  });

  if (!tknRotation.success) {
    //  !failed rotating tokens
    const { error } = tknRotation;

    res
      .status(AuthError.Session.getErrStatusCode(error))
      .json({ success: false, message: internalErrMsg });

    logger.log("error", "Failed rotating tokens.", error);

    return;
  }

  const { cookieName, persistentCookie, sessionCookie } = cookieConfig.result;

  //  * create cookie and json for access token
  const {} = refreshTknCookie;

  res.cookie(
    cookieName,
    refreshToken,
    isPersistentAuth ? persistentCookie : sessionCookie
  );
  res.json({ success: true, accessToken, refreshToken }); //  ! refresh token is for demo only
}

function getRefreshConfig():
  | BaseResult.Success<CookieConfig>
  | BaseResult.Fail<AuthError.AuthConfig.ErrorClass> {
  const { cookieConfig: refreshCookie } = TOKEN_CONFIG_RECORD.refresh;

  if (!refreshCookie)
    //  cookie config not set
    return ResultBuilder.fail({
      name: "AUTH_CONFIG_COOKIE_CONFIG_ERROR",
      message: "Refresh token cookie is not configured properly.",
    });

  return ResultBuilder.success(refreshCookie);
}

async function resolveUser(
  req: Request,
  userId: number
): Promise<
  | SessionResult.Success<ViewModels.User, "SESSION_TOKEN_VERIFY">
  | SessionResult.Fail
> {
  const { userDataService } = req;

  const userQuery = await userDataService.tryGetUser({
    type: "userId",
    userId,
  });

  if (userQuery.success && userQuery.result)
    return ResultBuilder.success(userQuery.result, "SESSION_TOKEN_VERIFY");

  //  !user query fails or user query result is undefined
  return ResultBuilder.fail(
    AuthError.Session.normalizeError({
      name: "SESSION_TOKEN_MALFORMED_ERROR",
      message: "Failed retrieving user details.",
      err: !userQuery.success ? userQuery.error : undefined,
    })
  );
}
