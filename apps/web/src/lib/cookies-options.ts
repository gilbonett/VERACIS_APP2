export const COOKIE_NAMES = {
  ACCESS_TOKEN: "veracis.at",
  REFRESH_TOKEN: "veracis.rt",
  STEP_TOKEN: "veracis.st",
} as const;

export type CookieName = (typeof COOKIE_NAMES)[keyof typeof COOKIE_NAMES];

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
  domain?: string;
  expires?: Date;
}
