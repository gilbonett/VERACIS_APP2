import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { CookiesService } from "../cookies/cookie.service";

export const Cookie = createParamDecorator(
  (cookieName: string, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();

    if (!cookieName) {
      throw new UnauthorizedException(
        "Cookie name must be provided to @Cookie decorator",
      );
    }

    const token = CookiesService.get(request, cookieName);

    if (!token) {
      throw new UnauthorizedException();
    }

    return token;
  },
);
