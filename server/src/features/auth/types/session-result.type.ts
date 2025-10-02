import { BaseResult } from "../../../types";
import { Session } from "../error";

export namespace SessionResult {
  type SuccessSource =
    | "SESSION_END"
    | "SESSION_REFRESH"
    | "SESSION_START"
    | "SESSION_TOKEN_VERIFY"
    | "SESSION_TOKEN_ROTATION";
  export type Success<
    TResult,
    TSource extends SuccessSource
  > = BaseResult.Success<TResult, TSource>;
  export type Fail = BaseResult.Fail<Session.ErrorClass>;
}
