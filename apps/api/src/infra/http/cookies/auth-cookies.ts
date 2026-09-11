import { days, minutes } from "@/shared/constants/temporal.constants";
import type { Response } from "express";
import { COOKIE_NAMES, REFRESH_TOKEN_PATH } from "./cookie-options";
import { CookiesService } from "./cookie.service";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_MAX_AGE_MS = minutes(5);
const REFRESH_TOKEN_MAX_AGE_MS = days(30);

export function setAuthCookies(
  res: Response,
  tokens: AuthTokens,
  domain?: string,
): void {
  CookiesService.set(res, COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    domain,
  });

  CookiesService.set(res, COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    sameSite: "strict",
    path: REFRESH_TOKEN_PATH,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    domain,
  });
}

export function clearAuthCookies(res: Response, domain?: string): void {
  CookiesService.delete(res, COOKIE_NAMES.ACCESS_TOKEN, { domain });
  CookiesService.delete(res, COOKIE_NAMES.REFRESH_TOKEN, {
    path: REFRESH_TOKEN_PATH,
    domain,
  });
}
