import { Request } from "express";
import bcrypt from "bcrypt";
import { REGEX } from "../../../../data";
import { SignInSchema } from "../../schemas";
import { ViewModels } from "../../types";

/**
 * @public
 * @async
 * @function getVerifiedUser
 * @description A helper for the `handleSignIn` controller. Asynchronously handles
 * verifying the user from the provided credentials in the request body.
 * - Retrieves the `email` or `username`, and `password` from the request body.
 * - Attempts to read an existing `User` from the database with the provided login fields.
 * - If a `User` is found, verify if the provided password is correct.
 * - If the password is correct, return the User `ViewModel`.
 * @param req The request object.
 * @returns A `Promise` that resolves to the User `ViewModel` that contains details about
 * the verified `User` or `null` if validation or verification fails..
 */
export async function getVerifiedUser(
  req: Request<{}, {}, SignInSchema>
): Promise<ViewModels.User | null> {
  const { body: authDetails, requestLogger } = req;

  requestLogger.log("debug", "Validating login credentials.");

  const isEmail = REGEX.AUTH.EMAIL.test(authDetails.identifier);
  const signInMethod = isEmail ? "email" : "username";

  const queryResult = await req.userDataService.tryGetUser({
    type: "login",
    signInMethod,
    authDetails,
  });

  if (queryResult.success && queryResult.result) {
    //  query completed and there is a result
    const { result } = queryResult;

    const { password } = authDetails;
    const { passwordHash } = result;

    const isAuthenticated = await bcrypt.compare(password, passwordHash);

    //  success authenticating with password.
    if (isAuthenticated) return result;
  }

  return null;
}
