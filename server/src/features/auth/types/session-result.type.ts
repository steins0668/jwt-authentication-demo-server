import { BaseResult } from "../../../types";
import { Session } from "../error";

export namespace SessionResult {
  export type Success<TResult> = BaseResult.Success<TResult, "SESSION">;
  export type Fail = BaseResult.Fail<Session.ErrorClass>;
}
