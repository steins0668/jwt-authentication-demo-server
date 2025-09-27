import { BaseError } from "../error";

export namespace BaseResult {
  export type Success<TResult, TSource extends string = string> = {
    success: true;
    result: TResult;
    source?: TSource | undefined;
  };

  export type Fail<TError extends BaseError<string>> = {
    success: false;
    error: TError;
  };
}
