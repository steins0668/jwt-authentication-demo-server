import { Request } from "express";
import { BaseResult } from "../../../types";
import { ResultBuilder } from "../../../utils";
import { Session } from "../error";
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
  options: {
    verifiedUser: ViewModels.User;
    sessionNumber: string;
    isPersistentAuth?: boolean | undefined;
  }
): Promise<
  | BaseResult.Success<Tokens, "TOKEN_CREATION">
  | BaseResult.Fail<Session.ErrorClass>
> {
  const { requestLogger } = req;
  const { verifiedUser, sessionNumber, isPersistentAuth } = options;

  requestLogger.log("debug", "Creating tokens.");

  const role = await req.userDataService.getUserRole(verifiedUser.userId);

  if (role === undefined)
    //  failed finding role for some reason.
    return ResultBuilder.fail({
      name: "SESSION_TOKEN_CREATION_ERROR",
      message: "Could not retrieve user's role.",
    });

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

  try {
    const accessToken = createJwt({
      tokenType: "access",
      payload: accessTokenPayload,
    });
    const refreshToken = createJwt({
      tokenType: "refresh",
      payload: refreshTokenPayload,
    });

    return ResultBuilder.success(
      { accessToken, refreshToken },
      "TOKEN_CREATION"
    );
  } catch (err) {
    return ResultBuilder.fail(
      Session.normalizeError({
        name: "SESSION_TOKEN_CREATION_ERROR",
        message: "Failed creating tokens.",
        err,
      })
    );
  }
}
