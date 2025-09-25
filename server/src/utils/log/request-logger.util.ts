import winston from "winston";
import { RouteLogger } from "./logger.util";

/**
 * @public
 * @function createRequestLogger
 * @description Creates a new instance of the {@link RequestLogger}. Used for
 * attaching to the `request` as a middleware.
 * @returns
 */
export function createRequestLogger() {
  return new RequestLogger();
}

type LogHeaderDetails = {
  method: string;
  originalUrl: string;
};

/**
 * @public
 * @class
 * @description A utility logger class used for logging request lifecycles.
 * Used for logging requests from arrivals, to middleware, until the controller
 * finishes executing.
 * - Contains utility functions for logging plain winston,
 * - Uses the {@link RouteLogger} for logging to transports.
 */
export class RequestLogger {
  private readonly _logger: winston.Logger;
  private _profiler?: winston.Profiler;

  public constructor() {
    this._logger = RouteLogger;
  }

  /**
   * @public
   * @function getRequestProfiler
   * @description Wrapper function for starting a {@link winston.Profiler}
   * object of the {@link RouteLogger} class.
   */
  public startRequestProfiler(logHeaderDetails: LogHeaderDetails): void {
    this.log({
      level: "debug",
      logHeaderDetails,
      msg: "Processing request...",
    });

    this._profiler = this._logger.startTimer();
  }

  /**
   * @public
   * @function setProfilerDone
   * @description Checks if the {@link _profiler} has been started and sets it to done.
   * Afterwards, logs a message and the request's status code to notify that the request
   * was completed.
   */
  public endRequestProfiler(
    logHeaderDetails: LogHeaderDetails,
    statusCode: number
  ): void {
    if (!this._profiler) return;

    const logHeader = this.__constructLogHeader(logHeaderDetails);
    const profilerMsg = `${logHeader} Request completed with status ${statusCode}.`;

    this._profiler.done({ message: profilerMsg });
  }

  /**
   * @public
   * @function log
   * @description Logs a provided {@link msg} using the {@link RouteLogger}.
   * - Optionally includes the {@link err} object in the `log` if it is provided
   * and the {@link level} is specified as `error`.
   * @param level The level of the error. Can be either `error`, `warn`, `info`, or `debug`.
   * @param msg The log message.
   * @param err An `Error` object passed into the log.
   * todo: possible include other levels as well.
   */
  public log(options: {
    level: "error" | "warn" | "info" | "debug";
    logHeaderDetails: LogHeaderDetails;
    msg: string;
    err?: unknown;
  }): void {
    const { level, logHeaderDetails, msg, err } = options;

    const logHeader = this.__constructLogHeader(logHeaderDetails);
    const logMsg = `${logHeader} ${msg}`;

    level === "error" && err
      ? this._logger.log(level, logMsg, err)
      : this._logger.log(level, logMsg);
  }

  /**
   * @private
   * @function __getLogHeader
   * @description Helper function for constructing the log header from the `method`
   * and `originalUrl` in the Request body.
   * @returns A `string` containing the `logHeader`.
   */
  private __constructLogHeader(logHeaderDetails: LogHeaderDetails): string {
    const { method, originalUrl } = logHeaderDetails;
    const logHeader = `[${method} ${originalUrl}]`;

    return logHeader;
  }
}
