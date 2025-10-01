import jwt from "jsonwebtoken";
import { AuthToken } from "../types";
import { AccessTknPayload, RefreshTknPayload } from "../schemas";
import { TOKEN_CONFIG_RECORD } from "../data";
import { AuthEnv } from "../error";

type AccessOptions = {
  tokenType: Extract<AuthToken, "access">;
  payload: AccessTknPayload;
};

type RefreshOptions = {
  tokenType: Extract<AuthToken, "refresh">;
  payload: RefreshTknPayload;
};

type JwtOptions = AccessOptions | RefreshOptions;

/**
 * @public
 * @function createJwt
 * @description A utility function that creates and returns a `JWT` from a provided
 * `options` parameter.
 * @param options.tokenType The token type. See {@link AuthToken} for info on the allowed
 * values.
 * @param options.payload The payload object. May either be a refresh token or access token
 * payload depending on the value of {@link tokenType}
 * @returns The created `JWT`.
 *
 * ! this change was done in favor of allowing the method to accept different payload types
 * ! depending on the token type.
 */
export function createJwt({ tokenType, payload }: JwtOptions): string {
  const { secret, signOptions } = TOKEN_CONFIG_RECORD[tokenType];

  if (!secret)
    throw new AuthEnv.ErrorClass({
      name: "ENV_TKN_SECRET_ERROR",
      message: `${tokenType.toUpperCase()}_TOKEN_SECRET is not defined in env.`,
    });

  const token: string = jwt.sign(payload, secret, signOptions);

  return token;
}
