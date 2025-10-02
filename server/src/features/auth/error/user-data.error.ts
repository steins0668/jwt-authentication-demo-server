import { BaseError } from "../../../error";
import { isError } from "../../../utils";

export namespace UserData {
  export type ErrorName =
    | "USER_DATA_CREATE_USER_ERROR"
    | "USER_DATA_READ_USER_ERROR"
    | "USER_DATA_READ_ROLE_ERROR";

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
}
