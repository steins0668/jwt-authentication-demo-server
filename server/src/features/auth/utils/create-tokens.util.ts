import { Request } from "express";
import { AccessTknPayload, RefreshTknPayload } from "../schemas";
import { ViewModels } from "../types";
import { createJwt } from "./create-jwt.util";
import { createPayload } from "./create-payload.util";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * @public
 * @async
 * @function createTokens
 * @description A helper for the {@link handleLogin} controller. Asynchronously handles access
 * and refresh token creation.
 * - Retrieves a list of `role`s associated with the `User`.
 * - Creates a token payload containing the `verifiedUser` and the list of `role`s.
 * - Creates JWT `access` and `refresh` tokens containing the payload.
 * - Returns both tokens.
 * @param req
 * @param verifiedUser A {@link UserViewModel} used for retrieving the `User`'s `role`s and
 * creating the token `payload`.
 * @param sessionNumber The `sessionNumber` corresponding to the current `UserSession`.
 * @param isPersistentAuth An optional boolean representing the persistence of the authentication state.
 * `true` if the auth is persistent. `false` otherwise.
 * @returns A `Promise` that resolves to a {@link Tokens} object containing the `accessToken`
 * and `refreshToken`.
 */
export async function createTokens(
  req: Request,
  verifiedUser: ViewModels.User,
  sessionNumber: string,
  isPersistentAuth?: boolean
): Promise<Tokens> {
  const { requestLogger } = req;

  requestLogger.log("debug", "Creating tokens.");

  const role = await req.userDataService.getUserRole(verifiedUser.userId);

  if (role === undefined) throw new Error("System error."); //  todo: add better error handling

  const accessTokenPayload: AccessTknPayload = createPayload({
    tknType: "access",
    user: verifiedUser,
    role,
  });
  const refreshTokenPayload: RefreshTknPayload = createPayload({
    tknType: "refresh",
    sessionNumber,
    userId: verifiedUser.userId,
    isPersistentAuth: isPersistentAuth ?? false,
  });

  const accessToken = createJwt({
    tokenType: "access",
    payload: accessTokenPayload,
  });
  const refreshToken = createJwt({
    tokenType: "refresh",
    payload: refreshTokenPayload,
  });

  return { accessToken, refreshToken };
}
