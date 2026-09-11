import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { SessionRequest } from "../guards/session.guard";

export const CurrentRefreshToken = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<SessionRequest>();

    return request.refreshToken;
  },
);
