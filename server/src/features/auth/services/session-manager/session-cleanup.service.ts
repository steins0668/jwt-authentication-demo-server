import { HashUtil, ResultBuilder } from "../../../../utils";
import { Session } from "../../error";
import { SessionResult } from "../../types";
import { UserSessionRepository } from "../repositories";

export class SessionCleanupService {
  private readonly _userSessionRepository: UserSessionRepository;

  constructor(userSessionTokenRepository: UserSessionRepository) {
    this._userSessionRepository = userSessionTokenRepository;
  }

  /**
   * @public
   * @async
   * @function tryEndSession
   * @description Asynchronously attempts to end a session with the hash of a
   * specified `sessionNumber`.
   * @param sessionNumber The `sessionNumber` of the session that will be deleted.
   * @returns A `Promise` resolving to the `id` of the deleted session, or `null` if the
   * operation fails.
   */
  public async endSession(
    sessionNumber: string
  ): Promise<
    | SessionResult.Success<number | undefined, "SESSION_END">
    | SessionResult.Fail
  > {
    try {
      const deleteResult = await this._userSessionRepository.deleteSessions({
        scope: "user_session",
        sessionNumberHash: HashUtil.byCrypto(sessionNumber),
      });

      const deletedId = deleteResult[0];

      return ResultBuilder.success(deletedId, "SESSION_END");
    } catch (err) {
      const error: Session.ErrorClass = {
        name: "SESSION_CLEANUP_ERROR",
        message: "Failed deleting session. Please try again later.",
        cause: err,
      };

      return ResultBuilder.fail(error);
    }
  }
  /**
   * @public
   * @async
   * @function endIdleSessions
   * @description Asynchronously ends/deletes idle sessions in the database.
   * @returns A `Promise` that resolves to an array of `number`s representing
   * the deleted session ids or `null` if the delete operation fails.
   */
  public async endIdleSessions(): Promise<
    SessionResult.Success<number[], "SESSION_END"> | SessionResult.Fail
  > {
    try {
      const deletedSessionIds =
        await this._userSessionRepository.deleteSessions({
          scope: "idle_session",
        });

      return ResultBuilder.success(deletedSessionIds, "SESSION_END");
    } catch (err) {
      const error: Session.ErrorClass = {
        name: "SESSION_CLEANUP_ERROR",
        message: "Failed deleting idle sessions.",
        cause: err,
      };
      return ResultBuilder.fail(error);
    }
  }

  /**
   * @public
   * @async
   * @function endExpiredSessions
   * @description Asynchronously ends/deletes all expired sessions in the
   * database.
   * @returns A `Promise` that resolves to an array of `number`s representing
   * the deleted session ids or `null` if the delete operation fails.
   */
  public async endExpiredSessions(): Promise<
    SessionResult.Success<number[], "SESSION_END"> | SessionResult.Fail
  > {
    try {
      const deletedSessionIds =
        await this._userSessionRepository.deleteSessions({
          scope: "expired_persistent",
        });

      return ResultBuilder.success(deletedSessionIds, "SESSION_END");
    } catch (err) {
      const error: Session.ErrorClass = {
        name: "SESSION_CLEANUP_ERROR",
        message: "Failed deleting idle sessions.",
        cause: err,
      };
      return ResultBuilder.fail(error);
    }
  }
}
