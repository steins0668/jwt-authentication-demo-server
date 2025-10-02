import { Exhaustive } from "../../../types";
import * as AuthError from "../error";

export namespace AuthStatusCode {
  export const AuthConfigError: Exhaustive<AuthError.AuthConfig.ErrorName> = {
    AUTH_CONFIG_COOKIE_CONFIG_ERROR: 500,
    AUTH_CONFIG_ENV_TKN_SECRET_ERROR: 500,
  } as const;

  export const SignInError: Exhaustive<AuthError.SignIn.ErrorName> = {
    SIGN_IN_INVALID_CREDENTIALS_ERROR: 401, //  unauthorized
    SIGN_IN_VERIFICATION_ERROR: 401, //  unauthorized
    SIGN_IN_SYSTEM_ERROR: 500, //  internal server error
  } as const;

  export const SessionError: Exhaustive<AuthError.Session.ErrorName> = {
    SESSION_CLEANUP_ERROR: 500,
    SESSION_START_ERROR: 500,
    SESSION_TOKEN_CREATION_ERROR: 500,
    SESSION_TOKEN_EXPIRED_OR_INVALID_ERROR: 403,
    SESSION_TOKEN_MALFORMED_ERROR: 403,
    SESSION_TOKEN_REUSE_ERROR: 403,
    SESSION_TOKEN_ROTATION_ERROR: 500,
    SESSION_REFRESH_ERROR: 500,
  } as const;
}
