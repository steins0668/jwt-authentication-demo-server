import { BaseResult } from "../../../types";
import { ResultBuilder } from "../../../utils";
import { CookieConfig, TOKEN_CONFIG_RECORD } from "../data";
import { AuthConfig } from "../error";

export function getRefreshConfig():
  | BaseResult.Success<CookieConfig>
  | BaseResult.Fail<AuthConfig.ErrorClass> {
  const { cookieConfig: refreshCookie } = TOKEN_CONFIG_RECORD.refresh;

  if (!refreshCookie)
    //  cookie config not set
    return ResultBuilder.fail({
      name: "AUTH_CONFIG_COOKIE_CONFIG_ERROR",
      message: "Refresh token cookie is not configured properly.",
    });

  return ResultBuilder.success(refreshCookie);
}
