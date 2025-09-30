import { BaseError } from "../../../error";

export namespace AuthEnv {
  export type ErrorName = "ENV_TKN_SECRET_ERROR";
  export class ErrorClass extends BaseError<ErrorName> {}
}
