import { PasswordResetRequestedEvent } from "@/domain/auth/events/password-reset-requested-event";
import { AuthQueueGateway } from "@/infra/bullmq/queue/gateways";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnPasswordResetRequested {
  constructor(private readonly authQueueGateway: AuthQueueGateway) {}

  @OnEvent(PasswordResetRequestedEvent)
  async handle(event: PasswordResetRequestedEvent) {
    const { name, email, token, emailMasked } = event.payload;

    await this.authQueueGateway.sendPasswordReset({
      name,
      to: email,
      token,
      emailMasked,
    });
  }
}
