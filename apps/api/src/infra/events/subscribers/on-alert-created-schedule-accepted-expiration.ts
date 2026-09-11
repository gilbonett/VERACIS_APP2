import { AlertCreatedEvent } from "@/domain/alerts/events/alert-created-event";
import { AlertQueueGateway } from "@/infra/bullmq/queue/gateways/alert-queue.gateway";
import { minutes } from "@/shared/constants/temporal.constants";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

const ACCEPTED_TTL_MS = minutes(30);

@Injectable()
export class OnAlertCreatedScheduleAcceptedExpiration {
  constructor(private alertQueueGateway: AlertQueueGateway) {}

  @OnEvent(AlertCreatedEvent, (event) => event.status === "ACCEPTED")
  async handle({ payload }: AlertCreatedEvent, outboxId: string) {
    await this.alertQueueGateway.scheduleAccepted(payload, {
      jobId: outboxId,
      delay: ACCEPTED_TTL_MS,
    });
  }
}
