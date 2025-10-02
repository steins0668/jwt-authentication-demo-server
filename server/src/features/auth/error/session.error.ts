import { BaseError } from "../../../error";
import { isError, StatusCode } from "../../../utils";
import { AuthStatusCode } from "../data";

export namespace Session {
  export type ErrorName =
    | "SESSION_START_ERROR" //  failed starting session
    | "SESSION_TOKEN_CREATION_ERROR" //  failed creating token
    | "SESSION_TOKEN_EXPIRED_OR_INVALID_ERROR" //   token is invalid or expired
    | "SESSION_TOKEN_MALFORMED_ERROR" //  payload doesn't match schema
    | "SESSION_TOKEN_MISSING_ERROR" //  token is missing
    | "SESSION_TOKEN_ROTATION_ERROR" //  failed rotating tokens
    | "SESSION_TOKEN_REUSE_ERROR" //  detected token reuse attempt
    | "SESSION_CLEANUP_ERROR" //  failed cleaning up/ending session
    | "SESSION_REFRESH_ERROR"; //  failed refreshing session
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
      statusCodeMap: AuthStatusCode.SessionError,
    });
  }
}
