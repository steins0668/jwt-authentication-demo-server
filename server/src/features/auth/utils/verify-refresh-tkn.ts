import { Request } from "express";
import jwt from "jsonwebtoken";
import { getTknSecrets } from "../data";
import { refreshTknPayload, RefreshTknPayload } from "../schemas";
import { Session } from "../error";
import { SessionResult } from "../types";
import { ResultBuilder } from "../../../utils";

/**
 * @public
 * @function verifyRefreshToken
 * @description Helper function for {@link handleRefreshToken} controller. Verifies the
 * refresh token. If the token verification fails, responds with status code `403`.
 * After that, parses the schema with zod `safeParse` method. If the parse fails, responds
 * with status code `403`.
 * todo: revise docs
 * @param req
 * @param refreshToken
 * @param user
 * @returns
 */
export function verifyRefreshTkn(
  req: Request,
  refreshToken: string
):
  | SessionResult.Success<RefreshTknPayload, "SESSION_TOKEN_VERIFY">
  | SessionResult.Fail {
  const { requestLogger } = req;

  let payload;
  try {
    payload = jwt.verify(refreshToken, getTknSecrets().refreshSecret);
  } catch (err) {
    requestLogger.log("error", "Invalid or expired refresh token.", err);
    return ResultBuilder.fail(
      Session.normalizeError({
        name: "SESSION_TOKEN_EXPIRED_OR_INVALID_ERROR",
        message: "Invalid or expired refresh token.",
        err,
      })
    );
  }

  const payloadParse = refreshTknPayload.safeParse(payload);
  if (!payloadParse.success) {
    requestLogger.log("error", "Malformed refresh token.");
    return ResultBuilder.fail({
      name: "SESSION_TOKEN_MALFORMED_ERROR",
      message: "Malformed refresh token.",
    });
  }

  return ResultBuilder.success(payloadParse.data, "SESSION_TOKEN_VERIFY");
}
