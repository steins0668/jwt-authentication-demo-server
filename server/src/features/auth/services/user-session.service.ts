import { randomUUID } from "crypto";
import { createContext, TxContext } from "../../../db/createContext";
import { DbAccess } from "../../../error";
import { BaseResult } from "../../../types";
import { HashUtil, ResultBuilder } from "../../../utils";
import { InsertModels } from "../types";
import { SessionTokenRepository, UserSessionRepository } from "./repositories";

export async function createUserSessionService() {
  const dbContext = await createContext();
  const sessionTokenRepo = new SessionTokenRepository(dbContext);
  const userSessionRepo = new UserSessionRepository(dbContext);

  return new UserSessionService(sessionTokenRepo, userSessionRepo);
}

/**
 * @class
 * @description Handles user session management from starting sessions, modifying
 * existing sessions, as well as ending sessions.
 */
export class UserSessionService {
  private readonly _sessionTokenRepository: SessionTokenRepository;
  private readonly _userSessionRepository: UserSessionRepository;

  public constructor(
    sessionTokenRepository: SessionTokenRepository,
    userSessionRepository: UserSessionRepository
  ) {
    this._sessionTokenRepository = sessionTokenRepository;
    this._userSessionRepository = userSessionRepository;
  }

  /**
   * @public
   * @function generateSessionNumber
   * @description Generates a session number for the provided `userId`.
   * Uses the `userId`, current date and a random generated `UUID`.
   * @param userId The `id` of the user.
   * @returns A string representing the generated session number.
   */
  public generateSessionNumber(userId: number): string {
    const sessionNumber = `${userId}-${Date.now()}-${randomUUID()}`;
    return sessionNumber;
  }

  //  todo: add docs
  public async newSession(sessionData: {
    sessionNumber: string;
    userId: number;
    refreshToken: string;
    expiresAt?: Date | null;
  }): Promise<
    | BaseResult.Success<number, "DB_INSERT">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const { sessionNumber, userId, refreshToken, expiresAt } = sessionData;

    const now = new Date();
    const nowISO = now.toISOString();
    const sessionRepo = this._userSessionRepository;

    try {
      const result = await sessionRepo.execTransaction(async (tx) => {
        //  create session
        const sessionId = await sessionRepo.insertSession({
          dbOrTx: tx,
          userSession: {
            userId,
            sessionHash: HashUtil.byCrypto(sessionNumber),
            createdAt: nowISO,
            lastUsedAt: nowISO,
            expiresAt: expiresAt?.toISOString() ?? null,
          },
        });

        if (sessionId === undefined)
          throw new Error("Failed creating session.");

        //  store first refresh token
        await this.insertToken({
          tx,
          sessionId,
          tokenHash: HashUtil.byCrypto(refreshToken),
        });

        return sessionId;
      });

      return ResultBuilder.success(result, "DB_INSERT");
    } catch (err) {
      const error: DbAccess.ErrorClass = {
        name: "DB_ACCESS_INSERT_ERROR",
        message:
          "An error occured while creating session. Please try again later.",
        cause: err,
      };

      return ResultBuilder.fail(error);
    }
  }

  //    todo: add docs
  public async updateSession(data: {
    sessionNumber: string;
    oldToken: string;
    newToken: string;
  }): Promise<
    | BaseResult.Success<number, "DB_UPDATE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const { sessionNumber, oldToken, newToken } = data;

    try {
      const result = await this._userSessionRepository.execTransaction(
        async (tx) => {
          //  updated last used for session
          const updatedId = await this.updateLastUsed({ tx, sessionNumber });

          //  invalidate old token
          await this.invalidateToken({ tx, oldToken });

          const newTknHash = HashUtil.byCrypto(newToken);

          await this.ensureTokenUnused({ tx, tknHash: newTknHash });

          //  add new token
          await this.insertToken({
            tx,
            sessionId: updatedId,
            tokenHash: newTknHash,
          });

          return updatedId;
        }
      );

      return ResultBuilder.success(result, "DB_UPDATE");
    } catch (err) {
      const error: DbAccess.ErrorClass = {
        name: "DB_ACCESS_INSERT_ERROR",
        message: "Failed updating session.",
        cause: err,
      };

      return ResultBuilder.fail(error);
    }
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
    | BaseResult.Success<number | undefined, "DB_DELETE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const sessionNumberHash = HashUtil.byCrypto(sessionNumber);

    try {
      const deleteResult = await this._userSessionRepository.deleteSessions({
        scope: "user_session",
        sessionNumberHash,
      });

      const deletedId = deleteResult[0];

      return ResultBuilder.success(deletedId, "DB_DELETE");
    } catch (err) {
      const error: DbAccess.ErrorClass = {
        name: "DB_ACCESS_QUERY_ERROR",
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
    | BaseResult.Success<number[], "DB_DELETE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    try {
      const deletedSessionIds =
        await this._userSessionRepository.deleteSessions({
          scope: "idle_session",
        });

      return ResultBuilder.success(deletedSessionIds, "DB_DELETE");
    } catch (err) {
      const error: DbAccess.ErrorClass = {
        name: "DB_ACCESS_QUERY_ERROR",
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
    | BaseResult.Success<number[], "DB_DELETE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    try {
      const deletedSessionIds =
        await this._userSessionRepository.deleteSessions({
          scope: "expired_persistent",
        });

      return ResultBuilder.success(deletedSessionIds, "DB_DELETE");
    } catch (err) {
      const error: DbAccess.ErrorClass = {
        name: "DB_ACCESS_QUERY_ERROR",
        message: "Failed deleting idle sessions.",
        cause: err,
      };
      return ResultBuilder.fail(error);
    }
  }
  //#region updateSession helpers
  /**
   * Update `lastUsed` field for session with the matching hash of the provided
   * `sessionNumber`.
   * @param options
   * @returns
   */
  private async updateLastUsed(options: {
    tx: TxContext;
    sessionNumber: string;
  }): Promise<number> {
    //  updated last used for session
    const updatedId = await this._userSessionRepository.updateLastUsed({
      dbOrTx: options.tx,
      queryBy: "session_hash",
      sessionHash: HashUtil.byCrypto(options.sessionNumber),
    });

    if (updatedId === undefined) throw new Error("Failed updating session.");

    return updatedId;
  }

  /**
   * Invalidate the provided token string if found in the database by
   * setting the `isUsed` field to `true`.
   * @param options
   */
  private async invalidateToken(options: {
    tx: TxContext;
    oldToken: string;
  }): Promise<void> {
    await this._sessionTokenRepository.invalidateTokens({
      dbOrTx: options.tx,
      queryBy: "token_hash",
      tokenHash: HashUtil.byCrypto(options.oldToken),
    });
  }

  /**
   * Get the stored tokens in the database matching the provided hash.
   * If one of them has the `isUsed` field set to `true`, throw an error.
   * @param options
   */
  private async ensureTokenUnused(options: {
    tx: TxContext;
    tknHash: string;
  }): Promise<void> {
    const usedTokens = await this._sessionTokenRepository.getTokens({
      dbOrTx: options.tx,
      queryBy: "token_hash",
      tokenHash: options.tknHash,
    });

    //  todo: add fallback behavior to this (delete/logout all sessions)
    if (usedTokens.some((token) => token.isUsed))
      throw new Error("Token already used!!");
  }
  //#endregion

  /**
   * @description Insert a new token with the provided `sessionId` and `tokenHash`.
   * Automatically generates a new date ISO string for the `createdAt` field.
   * @throws `Error` if the the token creation failed.
   * @param options
   */
  private async insertToken(options: {
    tx: TxContext;
    sessionId: number;
    tokenHash: string;
  }): Promise<number> {
    const newTknId = await this._sessionTokenRepository.insertToken({
      dbOrTx: options.tx,
      sessionToken: {
        ...options,
        createdAt: new Date().toISOString(),
      },
    });

    if (newTknId === undefined) throw new Error("Failed creating new token.");

    return newTknId;
  }
}
