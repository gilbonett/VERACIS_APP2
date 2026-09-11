import { UserCreatedEvent } from "@/domain/users/events/user-created-event";
import { NotificationQueueGateway } from "@/infra/bullmq/queue/gateways";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnUserCreated {
  constructor(private notificationQueueGateway: NotificationQueueGateway) {}

  @OnEvent(UserCreatedEvent)
  async handle({ payload }: UserCreatedEvent, outboxId: string) {
    await this.notificationQueueGateway.addNotificationByUser(payload, {
      jobId: outboxId,
    });
  }
}
