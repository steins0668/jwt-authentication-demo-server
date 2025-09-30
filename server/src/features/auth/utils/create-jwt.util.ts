import jwt from "jsonwebtoken";
import { AuthToken } from "../types";
import { AccessTknPayload, RefreshTknPayload } from "../schemas";
import { TOKEN_CONFIG_RECORD } from "../data";

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
 * @param options.tokenType The token type. See {@link AUTH.TokenType} for info on the allowed
 * values.
 * @param options.payload The payload object. May either be {@link AccessTokenPayload} or
 * {@link RefreshTokenPayload} depending on the value of {@link tokenType}
 * @returns The created `JWT`.
 *
 * ! this change was done in favor of allowing the method to accept different payload types
 * ! depending on the token type.
 */
export function createJwt({ tokenType, payload }: JwtOptions): string {
  const { secret, signOptions } = TOKEN_CONFIG_RECORD[tokenType];

  if (!secret) {
    //  todo: add better error handling
    throw new Error(
      `${tokenType.toUpperCase()}_TOKEN_SECRET is not defined in env.`
    );
  }

  const token: string = jwt.sign(payload, secret, signOptions);

  return token;
}
