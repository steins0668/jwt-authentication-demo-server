import { BaseError } from "../../../error";
import { isError } from "../../../utils";

export namespace SignIn {
  export type ErrorName =
    | "SIGN_IN_INVALID_CREDENTIALS_ERROR"
    | "SIGN_IN_VERIFICATION_ERROR";

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
