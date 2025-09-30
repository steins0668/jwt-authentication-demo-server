import { BaseError } from "../../../error";
import { isError } from "../../../utils";

export namespace Session {
  export type ErrorName =
    | "SESSION_START_ERROR"
    | "SESSION_TOKEN_ROTATION_ERROR"
    | "SESSION_CLEANUP_ERROR";

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

    return new ErrorClass({ name, message, cause: err });
  }
}
