import { Request, Response, NextFunction } from "express";
import { createSessionManager, SessionManager } from "../services";

export async function attachSessionManager(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.sessionManager = await createSessionManager();
  next();
}

declare global {
  namespace Express {
    interface Request {
      sessionManager: SessionManager;
    }
  }
}
