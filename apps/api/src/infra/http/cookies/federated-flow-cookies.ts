import { minutes } from "@/shared/constants/temporal.constants";
import type { Response } from "express";
import { COOKIE_NAMES, FEDERATED_FLOW_PATH } from "./cookie-options";
import { CookiesService } from "./cookie.service";

const FEDERATED_ATTEMPT_MAX_AGE_MS = minutes(10);

export function setFederatedAttemptCookie(
  res: Response,
  attemptId: string,
  domain?: string,
): void {
  CookiesService.set(
    res,
    COOKIE_NAMES.FEDERATED_LOGIN_ATTEMPT_TOKEN,
    attemptId,
    {
      sameSite: "lax",
      path: FEDERATED_FLOW_PATH,
      maxAge: FEDERATED_ATTEMPT_MAX_AGE_MS,
      domain,
    },
  );
}

export function clearFederatedAttemptCookie(
  res: Response,
  domain?: string,
): void {
  CookiesService.delete(res, COOKIE_NAMES.FEDERATED_LOGIN_ATTEMPT_TOKEN, {
    path: FEDERATED_FLOW_PATH,
    domain,
  });
}
