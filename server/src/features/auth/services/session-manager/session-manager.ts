import { createContext } from "../../../../db/createContext";
import { SessionTokenRepository, UserSessionRepository } from "../repositories";
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

  public async startSession(sessionData: {
    userId: number;
    refreshToken: string;
    expiresAt?: Date | null;
  }) {
    return await this._starter.newSession(sessionData);
  }

  public async updateSession(sessionData: {
    sessionNumber: string;
    oldToken: string;
    newToken: string;
  }) {
    return await this._rotator.rotate(sessionData);
  }

  public async endSession(sessionNumber: string) {
    return await this._cleanup.endSession(sessionNumber);
  }

  public async endIdleSessions() {
    return await this._cleanup.endIdleSessions();
  }

  public async endExpiredSessions() {
    return await this._cleanup.endExpiredSessions();
  }
}
