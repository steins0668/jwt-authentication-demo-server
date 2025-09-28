import { Request } from "express";
import bcrypt from "bcrypt";
import { REGEX } from "../../../../data";
import { ViewModels } from "../../types";
import { SignInSchema } from "../../schemas";

/**
 * @public
 * @async
 * @function getVerifiedUser
 * @description A helper for the `handleSignIn` controller. Asynchronously handles
 * verifying the user from the provided credentials in the request body.
 * - Retrieves the `email` or `username`, and `password` from the request body.
 * - Attempts to read an existing `User` from the database with the provided login fields.
 * - If no `User` is found, respond with status code `401` and log the failed log-in attempt.
 * - If a `User` is found, verify if the provided password is correct.
 * - If the password is incorrect, respond with status code `401` and log the failed log-in
 * attempt.
 * - If the password is correct, return the User `ViewModel`.
 * @param req The request object.
 * @returns A `Promise` that resolves to a {@link UserViewModel} that contains details about
 * the verified `User` or `null` if validation or verification fails..
 */
export async function getVerifiedUser(
  req: Request<{}, {}, SignInSchema>
): Promise<ViewModels.User | null> {
  const { body: authDetails, requestLogger } = req;

  requestLogger.log("debug", "Validating login credentials.");

  const isEmail = REGEX.AUTH.EMAIL.test(authDetails.identifier);
  const signInMethod = isEmail ? "email" : "username";
  const loginValue = authDetails.identifier;

  const queryResult = await req.userDataService.tryGetUser({
    type: "login",
    signInMethod,
    authDetails,
  });

  if (queryResult.success && queryResult.result) {
    //  query completed and there is a result

    const { password } = authDetails;
    const { passwordHash } = queryResult.result;

    let isAuthenticated = false;

    try {
      isAuthenticated = await bcrypt.compare(password, passwordHash);
    } catch (err) {}

    if (!isAuthenticated) {
    }
    return queryResult.result;
  }

  return null;
  //   if (!foundUser) {
  //     const logMsg = `Failed log-in attempt by user with ${signInMethod}: ${loginValue}`;
  //     const resMsg = "Incorrect email/username or password.";
  //     requestLogger.logStatus(401, {
  //     logMsg: `${signInMethod}: ${loginValue} doesn't exist.`,
  //     resMsg: "Incorrect email/username or password.",
  //   });
  //     requestLogger.log("debug", logMsg);
  //     return null;
  //   }

  //   const match = await bcrypt.compare(foundUser.)

  //   const isUserVerified = await authUtils.verifyPassword(
  //     foundUser,
  //     authDetails.password
  //   );
  //   if (!isUserVerified) {
  //     requestLogger.logStatus(401, {
  //       logMsg: `Incorrect password for ${loginValue}.`,
  //       resMsg: "Incorrect email/username or password.",
  //     });
  //     return null;
  //   }

  //   return foundUser;
}
