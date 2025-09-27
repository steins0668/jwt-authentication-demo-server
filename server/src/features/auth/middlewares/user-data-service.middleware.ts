import type { Request, Response, NextFunction } from "express";
import {
  createUserDataService,
  UserDataService,
} from "../services/user-data.service";

export async function attachUserDataService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.userDataService = await createUserDataService();
  next();
}

declare global {
  namespace Express {
    interface Request {
      userDataService: UserDataService;
    }
  }
}
