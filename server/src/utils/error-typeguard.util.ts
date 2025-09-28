import { BaseError } from "../error";

export function isError<T extends BaseError<string>>(
  constructor: new (...args: any[]) => T,
  err: unknown
): err is T {
  return err instanceof constructor;
}

export function isAnyError<
  C extends Array<new (...args: any[]) => BaseError<string>>
>(constructors: [...C], err: unknown): err is InstanceType<C[number]> {
  return constructors.some((constructor) => err instanceof constructor);
}
