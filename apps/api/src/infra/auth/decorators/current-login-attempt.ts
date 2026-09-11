import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { LoginAttemptRequest } from "../guards/login-attempt.guard";

export const CurrentLoginAttempt = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<LoginAttemptRequest>();

    return request.loginAttemptToken;
  },
);
