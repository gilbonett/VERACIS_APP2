import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FederatedAttemptRequest } from "../guards/federated-attempt.guard";

export const CurrentFederatedAttempt = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<FederatedAttemptRequest>();

    return request.federatedAttemptId;
  },
);
