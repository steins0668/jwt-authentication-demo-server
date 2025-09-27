import { BaseError, type DbAccess } from "../../../error";

export namespace Register {
  export type ErrorName = "USER_ALREADY_EXISTS_ERROR" | DbAccess.ErrorName;

  export class ErrorClass extends BaseError<ErrorName> {}
}
