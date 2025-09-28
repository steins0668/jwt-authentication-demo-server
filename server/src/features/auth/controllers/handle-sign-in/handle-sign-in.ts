import type { Request, Response } from "express";
import { SignInSchema } from "../../schemas";

export async function handleSignIn(
  req: Request<{}, {}, SignInSchema>,
  res: Response
) {
  const { body: authDetails, requestLogger: logger, userDataService } = req;

  //  validate user credentials
}
