import { randomUUID } from "crypto";
import { createContext, TxContext } from "../../../../db/createContext";
import { DbAccess } from "../../../../error";
import { BaseResult } from "../../../../types";
import { HashUtil, ResultBuilder } from "../../../../utils";
import { SessionTokenRepository, UserSessionRepository } from "../repositories";

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
        const tknId = await this._sessionTokenRepository.insertToken({
          dbOrTx: tx,
          sessionToken: {
            sessionId,
            tokenHash: HashUtil.byCrypto(refreshToken),
            createdAt: new Date().toISOString(),
          },
        });

        if (tknId === undefined) throw new Error("Token creation failed.");

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
    try {
      const deleteResult = await this._userSessionRepository.deleteSessions({
        scope: "user_session",
        sessionNumberHash: HashUtil.byCrypto(sessionNumber),
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
}
