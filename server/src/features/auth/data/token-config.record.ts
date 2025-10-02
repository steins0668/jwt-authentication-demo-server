import { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { AuthToken } from "../types";
import { getTknSecrets } from "./auth-env.constants";

export type CookieConfig = {
  cookieName: string;
  clearCookie: CookieOptions;
  persistentCookie: CookieOptions;
  sessionCookie: CookieOptions;
};
type TokenConfig = {
  secret: string;
  signOptions: jwt.SignOptions;
  cookieConfig?: CookieConfig;
};
type TokenConfigRecord = Record<AuthToken, TokenConfig>;

/**
 * @constant tokenConfigRecord
 * @description A {@link TokenConfigRecord} object containing config details about different
 * token types. It's key is of type {@link TokenType}.
 */
export const TOKEN_CONFIG_RECORD: TokenConfigRecord = {
  access: {
    secret: getTknSecrets().accessSecret,
    signOptions: {
      expiresIn: "5m",
    } as jwt.SignOptions,
  },
  refresh: {
    secret: getTknSecrets().refreshSecret,
    signOptions: {
      expiresIn: "30d",
    } as jwt.SignOptions,
    cookieConfig: {
      cookieName: "refresh_token",
      clearCookie: {
        httpOnly: true,
        sameSite: "none",
        secure: true, // *change to true in production/when not using thunderclient
      },
      persistentCookie: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
      sessionCookie: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
  },
} as const;
