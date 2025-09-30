import { createContext } from "../../../../db/createContext";
import { SessionTokenRepository, UserSessionRepository } from "../repositories";
import { SessionResult } from "../../types";
import { SessionCleanupService } from "./session-cleanup.service";
import { SessionStarter } from "./session-starter";
import { SessionTokenRotator } from "./session-token-rotator";

export async function createSessionManager() {
  const dbContext = await createContext();
  const sessionTokenRepository = new SessionTokenRepository(dbContext);
  const userSessionRepository = new UserSessionRepository(dbContext);

  return new SessionManager(sessionTokenRepository, userSessionRepository);
}

export class SessionManager {
  private readonly _cleanup: SessionCleanupService;
  private readonly _starter: SessionStarter;
  private readonly _rotator: SessionTokenRotator;

  constructor(
    sessionTokenRepository: SessionTokenRepository,
    userSessionRepository: UserSessionRepository
  ) {
    this._cleanup = new SessionCleanupService(userSessionRepository);
    this._starter = new SessionStarter(
      sessionTokenRepository,
      userSessionRepository
    );
    this._rotator = new SessionTokenRotator(
      sessionTokenRepository,
      userSessionRepository
    );
  }

  /**
   * Creates a new session based on the provided session data.
   *
   * @param sessionData
   * @returns Returns a result object containing the session number on success.
   * Otherwise return a result object containing the error class.
   */
  public async startSession(sessionData: {
    userId: number;
    refreshToken: string;
    expiresAt?: Date | null;
  }): Promise<SessionResult.Success<string> | SessionResult.Fail> {
    return await this._starter.newSession(sessionData);
  }

  /**
   * Finds the session associated with the provided `sessionNumber`,
   * then rotates the tokens by invalidating the old token (setting
   * the `isUsed` field to `true`) and storing the new token to the
   * `session_tokens` table.
   * @param sessionData
   * @returns A result object containing the `id` of the updated
   * `UserSession` if the operation is successful. Otherwise return a
   * result object containing the error class.
   */
  public async rotateTokens(sessionData: {
    sessionNumber: string;
    oldToken: string;
    newToken: string;
  }): Promise<SessionResult.Success<number> | SessionResult.Fail> {
    return await this._rotator.rotate(sessionData);
  }

  /**
   * Ends the session associated with the `sessionNumber` by deleting
   * it from the `user_sessions` table.
   * @param sessionNumber
   * @returns A result object containing the `sessionId` of the deleted
   * `UserSession`. If the operation fails, a result object containing the
   * error class is returend.
   */
  public async endSession(
    sessionNumber: string
  ): Promise<SessionResult.Success<number | undefined> | SessionResult.Fail> {
    return await this._cleanup.endSession(sessionNumber);
  }

  /**
   * Ends/deletes all idle sessions by checking if the `expiresAt` field
   * of the session is set to null (non-expiring tokens) and if it has been
   * idle for more than 1 day.
   * @returns A result object containing the list of `number`s representing
   * the deleted idle sessions. if the operation fails, a result object containing
   * the error class is returned.
   */
  public async endIdleSessions(): Promise<
    SessionResult.Success<number[]> | SessionResult.Fail
  > {
    return await this._cleanup.endIdleSessions();
  }

  /**
   * Ends/deletes all expired sessions by checking if the `expiresAt` field
   * (an ISO date) is less than the ISO string of the current date and time.
   * @returns A result object containing the list of `number`s representing the
   * id of the deleted expired sessions. If the operation fails, a result object
   * containing the error class is returned.
   */
  public async endExpiredSessions(): Promise<
    SessionResult.Success<number[]> | SessionResult.Fail
  > {
    return await this._cleanup.endExpiredSessions();
  }
}
