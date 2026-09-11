import { OtpCodeRequestedEvent } from "@/domain/auth/events/otp-code-requested-event";
import { AuthQueueGateway } from "@/infra/bullmq/queue/gateways";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnOtpCodeRequested {
  constructor(private readonly authQueueGateway: AuthQueueGateway) {}

  @OnEvent(OtpCodeRequestedEvent)
  async handle(event: OtpCodeRequestedEvent) {
    const { code, email, name } = event.payload;

    await this.authQueueGateway.sendOtpCode({ to: email, name, code });
  }
}
