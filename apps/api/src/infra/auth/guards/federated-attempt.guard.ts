import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { COOKIE_NAMES } from "../../http/cookies/cookie-options";
import { extractTokenFromCookies } from "../extracts/extract-token-from-cookies";

export type FederatedAttemptRequest = Request & {
  federatedAttemptId: string;
};

@Injectable()
export class FederatedAttemptGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FederatedAttemptRequest>();

    const federatedAttemptId = extractTokenFromCookies(
      request,
      COOKIE_NAMES.FEDERATED_LOGIN_ATTEMPT_TOKEN,
    );

    if (!federatedAttemptId) {
      throw new UnauthorizedException();
    }

    request.federatedAttemptId = federatedAttemptId;

    return true;
  }
}
