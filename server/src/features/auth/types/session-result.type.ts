import { BaseResult } from "../../../types";
import { Session } from "../error";

export namespace SessionResult {
  type SuccessSource = "SESSION_START" | "SESSION_END" | "TOKEN_ROTATION";
  export type Success<TResult> = BaseResult.Success<TResult, SuccessSource>;
  export type Fail = BaseResult.Fail<Session.ErrorClass>;
}
