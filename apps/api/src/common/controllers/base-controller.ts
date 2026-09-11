import { EnvService } from "@/infra/env/env.service";
import { Response } from "express";
import { clearAuthCookies, setAuthCookies } from "../cookies/auth-cookies";
import { AuthTokens } from "../cookies/cookie-options";
import {
  clearLoginAttemptCookie,
  setLoginAttemptCookie,
} from "../cookies/login-attempt-cookies";

export abstract class BaseController {
  constructor(protected env: EnvService) {}

  protected get cookieDomain(): string {
    return this.env.get("COOKIE_DOMAIN");
  }

  protected setAuthCookies(res: Response, tokens: AuthTokens) {
    setAuthCookies(res, tokens, this.cookieDomain);
  }
  protected clearAuthCookies(res: Response) {
    clearAuthCookies(res, this.cookieDomain);
  }

  protected setLoginAttemptCookie(res: Response, token: string) {
    setLoginAttemptCookie(res, token, this.cookieDomain);
  }
  protected clearLoginAttemptCookie(res: Response) {
    clearLoginAttemptCookie(res, this.cookieDomain);
  }
}
