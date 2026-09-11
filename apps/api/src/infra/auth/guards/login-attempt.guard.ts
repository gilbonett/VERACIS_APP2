import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { COOKIE_NAMES } from "../../http/cookies/cookie-options";
import { extractTokenFromCookies } from "../extracts/extract-token-from-cookies";

export type LoginAttemptRequest = Request & {
  loginAttemptToken: string;
};

@Injectable()
export class LoginAttemptGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginAttemptRequest>();

    const loginAttemptToken = extractTokenFromCookies(
      request,
      COOKIE_NAMES.LOGIN_ATTEMPT_TOKEN,
    );

    if (!loginAttemptToken) {
      throw new UnauthorizedException();
    }

    request.loginAttemptToken = loginAttemptToken;

    return true;
  }
}
