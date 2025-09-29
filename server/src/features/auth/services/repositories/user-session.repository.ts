import { and, eq, isNull, lte } from "drizzle-orm";
import { DbContext } from "../../../../db/createContext";
import { UserSession } from "../../../../models";
import { Repository } from "../../../../services";
import { InsertModels, ViewModels, Tables } from "../../types";

type BySessionId = {
  queryBy: "session_id";
  sessionId: number;
};

type BySessionHash = {
  queryBy: "session_hash";
  sessionHash: string;
};

type QueryOptions = BySessionId | BySessionHash;

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

  public async tryGetSession(
    queryOptions: {
      isAscending?: boolean;
      pageSize?: number;
      pageNumber?: number;
    } & QueryOptions
  ): Promise<ViewModels.UserSession[]> {
    const { queryBy } = queryOptions;
    const whereClause =
      queryBy === "session_hash"
        ? eq(UserSession.sessionHash, queryOptions.sessionHash)
        : eq(UserSession.sessionId, queryOptions.sessionId);

    const sessions = await this.GetRows({
      column: UserSession.userId,
      whereClause,
      ...queryOptions,
    });

    return sessions;
  }

  /**
   * @public
   * @async
   * @function tryInsertSession
   * @description Asynchronously attempts to insert a `UserSession`
   * object into `user_sessions` table.
   * @param session - The `UserSession` object to be inserted.
   * @returns A `Promise` that resolves to the `sessionId` or `undefined` if the insert
   * operation fails.
   */
  public async tryInsertSession(
    session: InsertModels.UserSession
  ): Promise<number | undefined> {
    const inserted = await this.insertRow(session);
    return inserted?.sessionId;
  }

  /**
   * todo: add docs
   */
  public async tryUpdateLastUsed(
    queryOptions: QueryOptions
  ): Promise<number | undefined> {
    const { queryBy } = queryOptions;
    const whereClause =
      queryBy === "session_hash"
        ? eq(UserSession.sessionHash, queryOptions.sessionHash)
        : eq(UserSession.sessionId, queryOptions.sessionId);

    const now = new Date();
    const updatedSessionIds = await this._dbContext
      .update(UserSession)
      .set({ lastUsedAt: now.toISOString() })
      .where(whereClause)
      .returning()
      .then((result) => result[0]?.sessionId);

    return updatedSessionIds;
  }

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
  public async tryDeleteSessions(
    deleteTarget: DeleteTarget
  ): Promise<number[]> {
    const { scope } = deleteTarget;
    const operationScope =
      scope === "user_session"
        ? `session_number_hash: ${deleteTarget.sessionNumberHash}.`
        : scope === "all_sessions"
        ? `user_id: ${deleteTarget.userId}.`
        : scope === "expired_persistent"
        ? `idle sessions.`
        : `expired persistent sessions.`;

    const deleteCondition = this.getSessionDeleteCondition(deleteTarget);

    const deletedIds = await this._dbContext
      .delete(UserSession)
      .where(deleteCondition)
      .returning()
      .then((result) => result.map((session) => session.sessionId));

    return deletedIds;
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
