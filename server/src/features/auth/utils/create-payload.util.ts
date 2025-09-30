import { AccessTknPayload, RefreshTknPayload } from "../schemas";
import { AuthToken, ViewModels } from "../types";

type AccessTknRequirements = {
  tknType: Extract<AuthToken, "access">;
  user: ViewModels.User;
  role: string;
};
type RefreshTknRequirements = {
  tknType: Extract<AuthToken, "refresh">;
  sessionNumber: string;
  userId: number;
  isPersistentAuth?: boolean;
};

type PayloadRequirements = AccessTknRequirements | RefreshTknRequirements;

/**
 * @public
 * @function createPayload
 * @description Creates a `payload` for either an access token or a refresh token basesd on
 * the provided `PayloadRequirements`
 * @param payloadRequirements The requirements to create the payload. Contains the following
 * fields:
 * - `tokenType` - The type of token that needs the payload. See {@link AuthToken} for
 * the allowed values.
 * - `user` - Contains user details. Used to create a `payload` for an access token.
 * - `role` - A string representing the user's role. Used for creating a `payload` for an
 * access token.
 * - `sessionNumber` - A string used to identify the current session for which the token
 * will be created for. Used for creating a refresh token payload.
 * - `userId` - The user's id in the database. Used for creating a refresh token payload.
 * - `isPersistentAuth` - An optional `boolean` field specifying if the session is persistent
 * (without an expiration). Used for creating a refresh token payload.
 * @returns - A payload for either an access token or a refresh token.
 *
 * ! this change was done in favor of allowing the method to return different payload types
 * ! depending on the token type.
 */
export function createPayload(
  payloadRequirements: AccessTknRequirements
): AccessTknPayload;
export function createPayload(
  payloadRequirements: RefreshTknRequirements
): RefreshTknPayload;
export function createPayload(
  payloadRequirements: PayloadRequirements
): AccessTknPayload | RefreshTknPayload {
  switch (payloadRequirements.tknType) {
    case "access": {
      return createAccessTknPayload(payloadRequirements);
    }
    case "refresh": {
      return createRefreshTknPayload(payloadRequirements);
    }
    default: {
      throw new Error("Invalid token type.");
    }
  }
}

/**
 * @function createAccessTknPayload
 * @description Helper function for creating access token payload.
 * @param payloadRequirements
 * @returns
 */
function createAccessTknPayload(payloadRequirements: AccessTknRequirements) {
  const { user, role } = payloadRequirements;

  const payload: AccessTknPayload = {
    userInfo: { ...user, role },
  };

  return payload;
}

/**
 * @function createRefreshTknPayload
 * @description Helper function for creating refresh token payload.
 * @param payloadRequirements
 * @returns
 */
function createRefreshTknPayload(payloadRequirements: RefreshTknRequirements) {
  const { sessionNumber, userId, isPersistentAuth } = payloadRequirements;
  const payload: RefreshTknPayload = {
    sessionNumber,
    userId,
    isPersistentAuth,
  };

  return payload;
}
