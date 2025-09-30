import { Exhaustive } from "../../../types";
import { SignIn } from "../error";

export namespace AuthStatusCode {
  export const SignInError: Exhaustive<SignIn.ErrorName> = {
    SIGN_IN_INVALID_CREDENTIALS_ERROR: 401, //  unauthorized
    SIGN_IN_VERIFICATION_ERROR: 401, //  unauthorized
    SIGN_IN_SYSTEM_ERROR: 500, //  internal server error
  };
}
