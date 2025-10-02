import { BaseError } from "../../../error";
import { isError, StatusCode } from "../../../utils";
import { AuthStatusCode } from "../data";

export namespace SignIn {
  export type ErrorName =
    | "SIGN_IN_INVALID_CREDENTIALS_ERROR" //  deprecated, use SIGN_IN_VERIFICATION_ERROR
    | "SIGN_IN_VERIFICATION_ERROR" //  for incorrect login credentials
    | "SIGN_IN_SYSTEM_ERROR"; //  internal errors (e.g. db)

  export class ErrorClass extends BaseError<ErrorName> {}

  export function normalizeError<E extends ErrorName>({
    name,
    message,
    err,
  }: {
    name: E;
    message: string;
    err: unknown;
  }) {
    if (isError(ErrorClass, err)) return err;

    return new ErrorClass({
      name,
      message,
      cause:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : err,
    });
  }

  export function getErrStatusCode(error: ErrorClass) {
    return StatusCode.fromError({
      errorName: error.name,
      statusCodeMap: AuthStatusCode.SignInError,
    });
  }
}
