import { days, minutes } from "@/shared/constants/temporal.constants";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
  domain?: string;
}

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const COOKIE_NAMES = {
  SESSION_TOKEN: "veracis.session_token",
  CHAGELLE_TOKEN: "veracis.challenge_token",
  PASSWORD_RESET_TOKEN: "veracis.password_reset_token",
  ACCESS_TOKEN: "veracis.access_token",
  REFRESH_TOKEN: "veracis.refresh_token",
  LOGIN_ATTEMPT_TOKEN: "veracis.login_attempt_token",
  FEDERATED_LOGIN_ATTEMPT_TOKEN: "veracis.federated_login_attempt_token",
} as const;

export const REFRESH_TOKEN_PATH = "/session/refresh";
export const LOGIN_ATTEMPT_PATH = "/session";
export const FEDERATED_LOGIN_ATTEMPT_PATH = "/session/federated";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const ACCESS_TOKEN_MAX_AGE_MS = minutes(5);
export const REFRESH_TOKEN_MAX_AGE_MS = days(30);
export const LOGIN_ATTEMPT_MAX_AGE_MS = minutes(10);
