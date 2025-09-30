import type { Request, Response } from "express";
import { ResultBuilder, StatusCode } from "../../../../utils";
import { AuthStatusCode } from "../../data";
import * as AuthError from "../../error";
import { SignInSchema } from "../../schemas";
import { verifyUser } from "./verify-user";
import { getSignInMethod } from "./get-sign-in-method";

export async function handleSignIn(
  req: Request<{}, {}, SignInSchema>,
  res: Response
) {
  const { body: authDetails, requestLogger: logger, userDataService } = req;

  //  validate and verify user credentials
  const verificationResult = await verifyUser(req);

  if (!verificationResult.success) {
    //  authentication failed
    const { error } = verificationResult;
    const { name, message } = error;

    const statusCode = StatusCode.fromError({
      errorName: name,
      statusCodeMap: AuthStatusCode.SignInError,
    });
    res.status(statusCode).json({ message });

    const safeId = getSafeId(authDetails.identifier);
    const logMsg = `Failed sign-in attempt from user ${safeId}.`;
    logger.log("error", logMsg, error);

    return;
  }

  const { isPersistentAuth } = authDetails;
}

function getSafeId(identifier: string): string {
  const signInMethod = getSignInMethod(identifier);

  switch (signInMethod) {
    case "email":
      return identifier.replace(/^(.{2}).*(@.*)$/, "$1***$2"); //  mask emails
    case "username":
      return identifier.slice(0, Math.min(8, identifier.length)) + "***";
    default:
      return JSON.stringify(identifier).slice(0, 50);
  }
}
