import { UserRegistered } from "@/domain/users/events/user-registered-event";
import { AuthQueueGateway } from "@/infra/bullmq/queue/gateways";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnUserRegistered {
  constructor(private authQueueGateway: AuthQueueGateway) {}

  @OnEvent(UserRegistered)
  async handle(event: UserRegistered) {
    const { email, name } = event.payload;

    await this.authQueueGateway.sendWelcomeEmail({ to: email, name });
  }
}
