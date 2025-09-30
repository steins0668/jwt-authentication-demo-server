import type { Request, Response } from "express";
import { ResultBuilder } from "../../../../utils";
import * as AuthError from "../../error";
import { SignInSchema } from "../../schemas";
import { verifyUser } from "./verify-user";

export async function handleSignIn(
  req: Request<{}, {}, SignInSchema>,
  res: Response
) {
  const { body: authDetails, requestLogger: logger, userDataService } = req;

  //  validate user credentials
  const verifiedUser = await verifyUser(req);

  if (!verifiedUser) {
    //  authentication failed
    const error = new AuthError.SignIn.ErrorClass({
      name: "SIGN_IN_INVALID_CREDENTIALS_ERROR",
      message: "Incorrect email, username, or password. Please try again.",
    });

    const failResult = ResultBuilder.fail(error);

    const logMsg = `Failed sign-in attempt from user ${authDetails.identifier}.`;
    logger.log("debug", logMsg);
    res.status(401).json(failResult);
    return;
  }

  const { isPersistentAuth } = authDetails;
}
