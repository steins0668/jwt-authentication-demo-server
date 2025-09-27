import { BaseError } from "./base.error";

export namespace Env {
  export type ErrorName = "DB_CONFIGURATION";
  export class ErrorClass extends BaseError<ErrorName> {}
}
