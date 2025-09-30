import { randomUUID } from "crypto";
import { DbAccess } from "../../../../error";
import { BaseResult } from "../../../../types";
import { HashUtil, ResultBuilder } from "../../../../utils";
import { SessionTokenRepository, UserSessionRepository } from "../repositories";
import { SessionResult } from "../../types";
import { Session } from "../../error";

/**
 * @class
 * @description Handles user session management from starting sessions, modifying
 * existing sessions, as well as ending sessions.
 */
export class SessionStarter {
  private readonly _sessionTokenRepository: SessionTokenRepository;
  private readonly _userSessionRepository: UserSessionRepository;

  public constructor(
    sessionTokenRepository: SessionTokenRepository,
    userSessionRepository: UserSessionRepository
  ) {
    this._sessionTokenRepository = sessionTokenRepository;
    this._userSessionRepository = userSessionRepository;
  }

  //  todo: add docs
  public async newSession(sessionData: {
    userId: number;
    refreshToken: string;
    expiresAt?: Date | null;
  }): Promise<SessionResult.Success<string> | SessionResult.Fail> {
    const { userId, refreshToken, expiresAt } = sessionData;

    const now = new Date();
    const nowISO = now.toISOString();
    const sessionRepo = this._userSessionRepository;

    try {
      const result = await sessionRepo.execTransaction(async (tx) => {
        //  create session
        const sessionNumber = this.generateSessionNumber(userId);
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

        return sessionNumber;
      });

      return ResultBuilder.success(result, "SESSION");
    } catch (err) {
      const error = Session.normalizeError({
        name: "SESSION_START_ERROR",
        message:
          "An error occured while creating session. Please try again later.",
        err,
      });

      return ResultBuilder.fail(error);
    }
  }

  /**
   * @public
   * @function generateSessionNumber
   * @description Generates a session number for the provided `userId`.
   * Uses the `userId`, current date and a random generated `UUID`.
   * @param userId The `id` of the user.
   * @returns A string representing the generated session number.
   */
  private generateSessionNumber(userId: number): string {
    const sessionNumber = `${userId}-${Date.now()}-${randomUUID()}`;
    return sessionNumber;
  }
}
