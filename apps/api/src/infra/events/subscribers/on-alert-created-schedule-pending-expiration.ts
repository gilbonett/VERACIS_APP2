import { AlertCreatedEvent } from "@/domain/alerts/events/alert-created-event";
import { AlertQueueGateway } from "@/infra/bullmq/queue/gateways/alert-queue.gateway";
import { minutes } from "@/shared/constants/temporal.constants";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

const PENDING_TTL_MS = minutes(45);

@Injectable()
export class OnAlertCreatedSchedulePendingExpiration {
  constructor(private alertQueueGateway: AlertQueueGateway) {}

  @OnEvent(AlertCreatedEvent, (event) => event.status === "PENDING")
  async handle({ payload }: AlertCreatedEvent, outboxId: string) {
    await this.alertQueueGateway.schedulePending(payload, {
      jobId: outboxId,
      delay: PENDING_TTL_MS,
    });
  }
}
