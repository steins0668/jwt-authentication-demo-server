import type { Request, Response } from "express";
import { BaseResult } from "../../../../types";
import { ResultBuilder } from "../../../../utils";
import { type CookieConfig, TOKEN_CONFIG_RECORD } from "../../data";
import * as AuthError from "../../error";

export async function handleRefresh(req: Request, res: Response) {
  const { requestLogger: logger } = req;

  const internalErrMsg =
    "An error occured while refreshing session. Please try again later.";

  //  * get config for refresh cookie
  const cookieResult = getRefreshConfig();
  if (!cookieResult.success) {
    //  !failed getting refresh token config
    const { error } = cookieResult;

    res
      .status(AuthError.AuthConfig.getErrStatusCode(error))
      .json({ success: false, message: internalErrMsg });

    logger.log("error", "Failed getting refresh token config.", error);

    return;
  }

  res.json({ msg: "sample msg" });
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
