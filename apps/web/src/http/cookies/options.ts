export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
  domain?: string;
  expires?: Date;
}

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

export const COOKIE_NAMES = {
  SESSION_TOKEN: "veracis.session_token",
  CHAGELLE_TOKEN: "veracis.challenge_token",
  PASSWORD_RESET_TOKEN: "veracis.password_reset_token",
} as const;

export type CookieName = (typeof COOKIE_NAMES)[keyof typeof COOKIE_NAMES];
