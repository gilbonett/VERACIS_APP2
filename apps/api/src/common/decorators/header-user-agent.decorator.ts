import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";

export const HeaderUserAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    const userAgent = request.headers["user-agent"] as string | undefined;

    if (typeof userAgent !== "string" || !userAgent.trim()) {
      throw new BadRequestException("User agent is required");
    }

    return userAgent as string;
  },
);
