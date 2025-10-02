import { BaseResult } from "../../../types";
import { UserData } from "../error";

export namespace UserDataResult {
  type SuccessSource = "USER_CREATE" | "USER_READ" | "USER_ROLE_READ";

  export type Success<
    TResult,
    TSource extends SuccessSource
  > = BaseResult.Success<TResult, TSource>;

  export type Fail = BaseResult.Fail<UserData.ErrorClass>;
}
