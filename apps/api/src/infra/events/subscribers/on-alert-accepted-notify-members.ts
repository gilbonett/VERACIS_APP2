import { AlertAcceptedEvent } from "@/domain/alerts/events/alert-accepted-event";
import { NotificationQueueGateway } from "@/infra/bullmq/queue/gateways/notification-queue.gateway";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnAlertAcceptedNotifyMembers {
  constructor(private notificationQueueGateway: NotificationQueueGateway) {}

  @OnEvent(AlertAcceptedEvent)
  async handle({ payload }: AlertAcceptedEvent, outboxId: string) {
    await this.notificationQueueGateway.addNotificationByAlert(payload, {
      jobId: outboxId,
    });
  }
}
