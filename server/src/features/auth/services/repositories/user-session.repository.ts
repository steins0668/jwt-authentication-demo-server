import { and, eq, isNull, lte } from "drizzle-orm";
import { DbContext } from "../../../../db/createContext";
import { DbAccess } from "../../../../error";
import { UserSession } from "../../../../models";
import { Repository } from "../../../../services";
import { LogUtil, ResultBuilder } from "../../../../utils";
import { BaseResult } from "../../../../types";
import { InsertModels, ViewModels, Tables } from "../../types";

const { DbLogger } = LogUtil;

type DeleteUserSession = {
  scope: "user_session";
  sessionNumberHash: string;
};

type DeleteAllUserSessions = {
  scope: "all_sessions";
  userId: number;
};

type DeleteExpiredPersistent = {
  scope: "expired_persistent";
};

type DeleteIdleSession = {
  scope: "idle_session";
};

type DeleteTarget =
  | DeleteUserSession
  | DeleteAllUserSessions
  | DeleteExpiredPersistent
  | DeleteIdleSession;

export class UserSessionRepository extends Repository<Tables.UserSessions> {
  public constructor(context: DbContext) {
    super(context, UserSession);
  }

  /**
   * @public
   * @async
   * @function tryInsertSession
   * @description Asynchronously attempts to insert a {@link InsertModels.UserSession}
   * object into {@link Tables.UserSession}.
   * @param session - The {@link InsertModels.UserSession} object to be inserted.
   * @returns A `Promise` that resolves a {@link BaseResult.Success} object containing
   * the `sessionId` of the inserted `UserSession`.
   */
  public async tryInsertSession(
    session: InsertModels.UserSession
  ): Promise<
    | BaseResult.Success<number, "DB_INSERT">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const getInsertErr = (message: string, err?: unknown) => {
      //  Error class creation helper
      return new DbAccess.ErrorClass({
        name: "DB_ACCESS_INSERT_ERROR",
        message,
        cause: err,
      });
    };

    try {
      DbLogger.info(`[UserSession] Attempting to insert new user session...`);

      const inserted = await this.insertRow(session);

      if (inserted) {
        DbLogger.info(
          `[UserSession] User session successfully inserted with id: ${inserted.sessionId}`
        );
        return ResultBuilder.success(inserted.sessionId, "DB_INSERT");
      } else {
        const msg = "Failed inserting user session due to conflict.";
        DbLogger.warn(`[UserSession] ${msg}`);

        const error = getInsertErr(msg);
        return ResultBuilder.fail(error);
      }
    } catch (err) {
      const msg = "Insert operation failed.";
      DbLogger.error(`[UserSession] ${msg}`, err);

      const error = getInsertErr(msg, err);
      return ResultBuilder.fail(error);
    }
  }

  //   /**
  //    * @public
  //    * @async
  //    * @function tryUpdateSessionToken
  //    * @description Asynchronously attempts to update {@link UserSession.refreshTokenHash} and
  //    * {@link UserSession.lastUsedAt}.
  //    *
  //    * @param data Contains the following fields:
  //    * - {@link sessionNumberHash} - The id of the session to be updated. Used for logging.
  //    * - {@link userId} - The id of the user tied to the session.  Used for logging.
  //    * - {@link oldTokenHash} - The hash of the refresh token to be rotated out. Used for setting
  //    * the `where` condition of the update operation.
  //    * - {@link newTokenHash} - The hash of the new refresh token that will replace the old token hash.
  //    * @returns A `Promise` that resolves to the {@link UserSession.userId} if the update operation succeeds
  //    * and `null` otherwise.
  //    */
  //   public async tryUpdateSessionToken(data: {
  //     sessionNumberHash: string;
  //     userId: number;
  //     oldTokenHash: string;
  //     newTokenHash: string;
  //   }): Promise<number | null> {
  //     const { sessionNumberHash, userId, oldTokenHash, newTokenHash } = data;

  //     try {
  //       DbLogger.info(
  //         `[UserSession] Attempting to update refresh token of session (session_number_hash: ${sessionNumberHash}, userId: ${userId}).`
  //       );

  //       const now = new Date();

  //       const updatedSessionId: number | null = await this._dbContext
  //         .update(UserSession)
  //         .set({ refreshTokenHash: newTokenHash, lastUsedAt: now.toISOString() })
  //         .where(eq(UserSession.refreshTokenHash, oldTokenHash))
  //         .returning()
  //         .then((result) => result[0]?.sessionId ?? null);

  //       if (!updatedSessionId) throw new Error();

  //       DbLogger.info(
  //         `[UserSession] Success updating refresh token of session (session_id: ${updatedSessionId}, userId: ${userId}).`
  //       );

  //       return updatedSessionId;
  //     } catch (err) {
  //       DbLogger.error(
  //         `[UserSession] Failed updating refresh token of session (session_id: ${sessionNumberHash}, userId: ${userId}).`,
  //         err
  //       );

  //       return null;
  //     }
  //   }

  /**
   * @public
   * @async
   * @function tryDeleteSession
   * @description Asynchronously attempts to delete session or sessions based on the provided
   * {@link deleteTarget}
   *
   * - Generates a sqlite where condition from the {@link deleteTarget} object.
   * - Runs a db command to attempt to delete tha target.
   * - Returns an array of ids of the deleted sessions on successful delete.
   * - Returns null on failed delete.
   * @param deleteTarget Contains the following fields:
   * - `scope` - The scope of the delete operation. See {@link DeleteTarget} for possible
   * values.
   * - `sessionNumberHash` - The `sessionNumberHash` of the session to be deleted. Used to
   * identify the target session when `scope` is set to `user_session`.
   * - `userId` - The id of the user whose sessions are to be deleted. Used to identify
   * the target sessions when `scope` is set to `all_sessions`.
   * @returns A `Promise` that resolves to an array of numbers if the delete operation
   * ran successfully or `null` if it failed.
   */
  public async tryDeleteSession(
    deleteTarget: DeleteTarget
  ): Promise<
    | BaseResult.Success<number[], "DB_DELETE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const { scope } = deleteTarget;
    const operationScope =
      scope === "user_session"
        ? `session_number_hash: ${deleteTarget.sessionNumberHash}.`
        : scope === "all_sessions"
        ? `user_id: ${deleteTarget.userId}.`
        : scope === "expired_persistent"
        ? `idle sessions.`
        : `expired persistent sessions.`;

    try {
      DbLogger.info(
        `[UserSession] Attempting to delete session/s with ${operationScope}`
      );

      const deleteCondition = this.getSessionDeleteCondition(deleteTarget);

      const deletedIds = await this._dbContext
        .delete(UserSession)
        .where(deleteCondition)
        .returning()
        .then((result) => result.map((session) => session.sessionId));

      DbLogger.info(`[UserSession] Deleted session/s: `, deletedIds);

      return ResultBuilder.success(deletedIds, "DB_DELETE");
    } catch (err) {
      const msg = `Failed deleting session/s with ${operationScope}.`;
      DbLogger.error(`[UserSession] ${msg}`, err);

      const error = new DbAccess.ErrorClass({
        name: "DB_ACCESS_QUERY_ERROR",
        message: msg,
        cause: err,
      });

      return ResultBuilder.fail(error);
    }
  }

  /**
   * @private
   * @function getSessionDeleteCondition
   * @description A helper function for generating the sqlite `where` condition needed in
   * the {@link tryDeleteSession} function.
   * @param deleteTarget - see {@link tryDeleteSession}
   * @returns - An sqlite `where` condition for the delete operation.
   */
  private getSessionDeleteCondition(deleteTarget: DeleteTarget) {
    switch (deleteTarget.scope) {
      case "all_sessions":
        return eq(UserSession.userId, deleteTarget.userId);
      case "user_session":
        return eq(UserSession.sessionHash, deleteTarget.sessionNumberHash);
      case "expired_persistent": {
        //  for expiring tokens: past expiration
        const now = new Date();
        const nowISO = now.toISOString();
        const expiredPersistentCondition = lte(UserSession.expiresAt, nowISO);

        return expiredPersistentCondition;
      }
      case "idle_session": {
        //  for non-expiring tokens: idle for more than 1 day
        const isExpiresNull = isNull(UserSession.expiresAt);

        const maxIdleDate = new Date();
        maxIdleDate.setDate(maxIdleDate.getDate() - 1);

        const idleSessionCondition = and(
          isExpiresNull,
          lte(UserSession.lastUsedAt, maxIdleDate.toISOString())
        );

        return idleSessionCondition;
      }
      default:
        throw new Error(`Invalid scope provided: ${deleteTarget}.`);
    }
  }
}
