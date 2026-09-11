import { minutes } from "@/shared/constants/temporal.constants";
import type { Response } from "express";
import { COOKIE_NAMES, LOGIN_ATTEMPT_PATH } from "./cookie-options";
import { CookiesService } from "./cookie.service";

const LOGIN_ATTEMPT_MAX_AGE_MS = minutes(10);

export function setLoginAttemptCookie(
  res: Response,
  loginAttemptToken: string,
  domain?: string,
): void {
  CookiesService.set(res, COOKIE_NAMES.LOGIN_ATTEMPT_TOKEN, loginAttemptToken, {
    sameSite: "strict",
    path: LOGIN_ATTEMPT_PATH,
    maxAge: LOGIN_ATTEMPT_MAX_AGE_MS,
    domain,
  });
}

export function clearLoginAttemptCookie(res: Response, domain?: string): void {
  CookiesService.delete(res, COOKIE_NAMES.LOGIN_ATTEMPT_TOKEN, {
    path: LOGIN_ATTEMPT_PATH,
    domain,
  });
}
