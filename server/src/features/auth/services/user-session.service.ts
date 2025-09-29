import { randomUUID } from "crypto";
import { createContext, DbContext } from "../../../db/createContext";
import { HashUtil, ResultBuilder } from "../../../utils";
import { InsertModels, ViewModels } from "../types";
import { SessionTokenRepository, UserSessionRepository } from "./repositories";
import { UserSession } from "../../../models";
import { BaseResult } from "../../../types";
import { DbAccess } from "../../../error";

export async function createUserSessionService() {
  const dbContext = await createContext();
  const sessionTokenRepo = new SessionTokenRepository(dbContext);
  const userSessionRepo = new UserSessionRepository(dbContext);

  return new UserSessionService(dbContext, sessionTokenRepo, userSessionRepo);
}

/**
 * @class
 * @description Handles user session management from starting sessions, modifying
 * existing sessions, as well as ending sessions.
 */
export class UserSessionService {
  private readonly _dbContext: DbContext;
  private readonly _sessionTokenRepository: SessionTokenRepository;
  private readonly _userSessionRepository: UserSessionRepository;

  public constructor(
    dbContext: DbContext,
    sessionTokenRepository: SessionTokenRepository,
    userSessionRepository: UserSessionRepository
  ) {
    this._dbContext = dbContext;
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
  public async tryStartNewSession(sessionData: {
    sessionNumber: string;
    userId: number;
    refreshToken: string;
    expiresAt?: Date | null;
  }): Promise<
    | BaseResult.Success<number, "DB_INSERT">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const { sessionNumber, userId, refreshToken, expiresAt } = sessionData;

    const sessionHash = HashUtil.byCrypto(sessionNumber);
    const tokenHash = HashUtil.byCrypto(refreshToken);

    const now = new Date();
    const nowISO = now.toISOString();

    const userSession: InsertModels.UserSession = {
      userId,
      sessionHash,
      createdAt: nowISO,
      lastUsedAt: nowISO,
      expiresAt: expiresAt?.toISOString() ?? null,
    };

    const sessionRepo = this._userSessionRepository;
    const tokenRepo = this._sessionTokenRepository;

    try {
      const result = await sessionRepo.execTransaction(async (tx) => {
        const sessionId = await sessionRepo.tryInsertSession({
          dbOrTx: tx,
          userSession,
        });

        if (!sessionId) throw new Error("Failed creating session.");

        const sessionToken: InsertModels.SessionToken = {
          sessionId,
          tokenHash,
          createdAt: nowISO,
        };
        const tokenId = await tokenRepo.tryInsertToken({
          dbOrTx: tx,
          sessionToken,
        });

        if (!tokenId) throw new Error("Failed creating token.");

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
  public async tryUpdateSession(data: {
    sessionNumber: string;
    userId: number;
    oldToken: string;
    newToken: string;
  }): Promise<
    | BaseResult.Success<number, "DB_UPDATE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const { sessionNumber, userId, oldToken, newToken } = data;

    const sessionHash = HashUtil.byCrypto(sessionNumber);
    const oldTknHash = HashUtil.byCrypto(oldToken);
    const newTknHash = HashUtil.byCrypto(newToken);

    const sessionRepo = this._userSessionRepository;
    const tokenRepo = this._sessionTokenRepository;

    try {
      const updatedSessionId = await sessionRepo.execTransaction(async (tx) => {
        const sessionId = await sessionRepo.tryUpdateLastUsed({
          queryBy: "session_hash",
          sessionHash,
        });

        if (!sessionId) throw new Error("Failed updating session.");

        const invalidTknId = await tokenRepo.tryInvalidateTokens({
          queryBy: "token_hash",
          tokenHash: oldTknHash,
        });

        if (!invalidTknId) throw new Error("Failed invalidating old token.");

        const now = new Date();
        const nowISO = now.toISOString();
        const newTkn: InsertModels.SessionToken = {
          sessionId,
          tokenHash: newTknHash,
          createdAt: nowISO,
        };

        const newTknId = await tokenRepo.tryInsertToken({
          dbOrTx: tx,
          sessionToken: newTkn,
        });

        if (!newTknId) throw new Error("Failed creating new token.");

        return sessionId;
      });

      return ResultBuilder.success(updatedSessionId, "DB_UPDATE");
    } catch (err) {
      const error: DbAccess.ErrorClass = {
        name: "DB_ACCESS_INSERT_ERROR",
        message: "Failed updating session.",
        cause: err,
      };

      return ResultBuilder.fail(error);
    }

    // const updatedSessionId =
    //   await this._userSessionRepository.tryUpdateSessionToken({
    //     sessionNumberHash: HashUtil.byCrypto(sessionNumber),
    //     userId,
    //     oldTokenHash: HashService.cryptoHash(oldToken),
    //     newTokenHash: HashService.cryptoHash(newToken),
    //   });

    // return updatedSessionId;
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
  public async tryEndSession(
    sessionNumber: string
  ): Promise<
    | BaseResult.Success<number | undefined, "DB_DELETE">
    | BaseResult.Fail<DbAccess.ErrorClass>
  > {
    const sessionNumberHash = HashUtil.byCrypto(sessionNumber);

    try {
      const deleteResult = await this._userSessionRepository.tryDeleteSessions({
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
        await this._userSessionRepository.tryDeleteSessions({
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
        await this._userSessionRepository.tryDeleteSessions({
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
}
