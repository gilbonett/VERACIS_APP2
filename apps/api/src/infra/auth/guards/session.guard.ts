import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { COOKIE_NAMES } from "../../http/cookies/cookie-options";
import { extractTokenFromCookies } from "../extracts/extract-token-from-cookies";
import { extractTokenFromHeader } from "../extracts/extract-token-from-header";

export type SessionRequest = Request & {
  refreshToken: string;
};

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();

    const refreshToken =
      extractTokenFromHeader(request) ??
      extractTokenFromCookies(request, COOKIE_NAMES.REFRESH_TOKEN);

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    request.refreshToken = refreshToken;

    return true;
  }
}
