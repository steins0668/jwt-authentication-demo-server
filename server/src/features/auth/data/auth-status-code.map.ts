import { Exhaustive } from "../../../types";
import { Session, SignIn } from "../error";

export namespace AuthStatusCode {
  export const SignInError: Exhaustive<SignIn.ErrorName> = {
    SIGN_IN_INVALID_CREDENTIALS_ERROR: 401, //  unauthorized
    SIGN_IN_VERIFICATION_ERROR: 401, //  unauthorized
    SIGN_IN_SYSTEM_ERROR: 500, //  internal server error
  };

  export const SessionError: Exhaustive<Session.ErrorName> = {
    SESSION_CLEANUP_ERROR: 500,
    SESSION_START_ERROR: 500,
    SESSION_TOKEN_CREATION_ERROR: 500,
    SESSION_TOKEN_REUSE_ERROR: 403,
    SESSION_TOKEN_ROTATION_ERROR: 500,
    SESSION_REFRESH_ERROR: 500,
  };
}
