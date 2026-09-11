import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedRequest, AuthSession } from "../guards/session-guard";

export interface ICurrentSession extends AuthSession {}

export const CurrentSession = createParamDecorator(
  (_: never, context: ExecutionContext): ICurrentSession => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.session satisfies ICurrentSession;
  },
);
