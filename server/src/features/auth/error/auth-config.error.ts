import { BaseError } from "../../../error";
import { StatusCode } from "../../../utils";
import { AuthStatusCode } from "../data";

export namespace AuthConfig {
  export type ErrorName =
    | "AUTH_CONFIG_ENV_TKN_SECRET_ERROR"
    | "AUTH_CONFIG_COOKIE_CONFIG_ERROR";
  export class ErrorClass extends BaseError<ErrorName> {}

  export function getErrStatusCode(error: ErrorClass) {
    return StatusCode.fromError({
      errorName: error.name,
      statusCodeMap: AuthStatusCode.AuthConfigError,
    });
  }
}
