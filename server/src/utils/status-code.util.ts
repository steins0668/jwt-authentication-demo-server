import { Exhaustive } from "../types";

export class StatusCode {
  /**
   * @static
   * @function fromError
   * @description Converts a provided `errorName` into the corresponding `statusCode`
   * provided by a `StatusCodeMap`.
   * @param errorName The error name to be converted to a status code.
   * @param statusCodeMap The Status Code Map to be used as reference for the conversion.
   * @returns The status code matching the error name.
   */
  public static fromError<M extends Exhaustive<string>>({
    errorName,
    statusCodeMap,
  }: {
    errorName: keyof M;
    statusCodeMap: M;
  }) {
    return statusCodeMap[errorName];
  }
}
