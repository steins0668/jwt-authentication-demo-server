import { BaseError } from "../../../error";

export namespace AuthConfig {
  export type ErrorName =
    | "AUTH_CONFIG_ENV_TKN_SECRET_ERROR"
    | "AUTH_CONFIG_COOKIE_CONFIG_ERROR";
  export class ErrorClass extends BaseError<ErrorName> {}
}
