import type { Request } from "express";
import winston from "winston";
import { RouteLogger } from "./logger.util";

/**
 * @public
 * @function createRouteLogHelper
 * @description Creates a new instance of the {@link RequestLogContext} using
 * the `request` object. Used for attaching to the `request` as a middleware.
 * @param req
 * @returns
 */
export function createRequestLogger(req: Request) {
  return new RequestLogger(req);
}

/**
 * @public
 * @class
 * @description A utility logger class used for logging request lifecycles.
 * Used for logging requests from arrivals, to middleware, until the controller
 * finishes executing.
 * - Contains utility functions for logging plain winston, as well as responding
 * with status codes and custom json message responses using the {@link Response} object.
 * - Uses the {@link Request} object for creating a log message header.
 * - Uses the {@link RouteLogger} for logging to transports.
 */
export class RequestLogger {
  private readonly _req: Request;
  private readonly _logger: winston.Logger;
  private _profiler?: winston.Profiler;

  public constructor(req: Request) {
    this._req = req;
    this._logger = RouteLogger;
  }

  /**
   * @public
   * @function getRequestProfiler
   * @description Wrapper function for starting a {@link winston.Profiler}
   * object of the {@link RouteLogger} class.
   */
  public startRequestProfiler(): void {
    this.log("debug", "Processing request...");

    this._profiler = this._logger.startTimer();
  }

  /**
   * @public
   * @function setProfilerDone
   * @description Checks if the {@link _profiler} has been started and sets it to done.
   * Afterwards, logs a message and the request's status code to notify that the request
   * was completed.
   */
  public endRequestProfiler(statusCode: number): void {
    if (!this._profiler) return;

    const logHeader = this.__constructLogHeader();
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
   * todo: encapsulate log header construction logic if it becomes too verbose or complicated.
   */
  public log(
    level: "error" | "warn" | "info" | "debug",
    msg: string,
    err?: unknown
  ): void {
    const logHeader = this.__constructLogHeader();
    const logMsg = `${logHeader} ${msg}`;

    level === "error" && err
      ? this._logger.log(level, logMsg, err)
      : this._logger.log(level, logMsg);
  }

  /**
   * @private
   * @function __getLogHeader
   * @description Helper function for constructing the log header from the `method`
   * and `originalUrl` in the {@link Request} object.
   * @returns A `string` containing the `logHeader`.
   */
  private __constructLogHeader(): string {
    const { method, originalUrl } = this._req;
    const logHeader = `[${method} ${originalUrl}]`;

    return logHeader;
  }
}
