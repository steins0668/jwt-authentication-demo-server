import type { Request, Response, NextFunction } from "express";
import { LogUtil } from "../utils";
import type { RequestLogger } from "../utils/log";

/**
 * @middleware
 * @function attachRequestLogContext
 * @description Attaches the {@link RequestLogContext} utility class as a middleware to the
 * {@link Request} object.
 * @param req
 * @param res
 * @param next
 */
export function attachRequestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.requestLogger = LogUtil.createRequestLogger(req);
  next();
}

// * extending the Express.Request interface to include the logger context for this
// * middleware.
declare global {
  namespace Express {
    interface Request {
      requestLogger: RequestLogger;
    }
  }
}
