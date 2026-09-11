import { OnWorkerEvent, Processor } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { BaseQueueProcessor, JobHandler } from "../../shared";
import { NotificationDlqQueueGateway } from "../gateways/notification-dlq-queue.gateway";
import { NOTIFICATION_JOB_HANDLERS } from "../handlers";
import { QUEUE_NAMES } from "../queue.constants";

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends BaseQueueProcessor {
  constructor(
    @Inject(NOTIFICATION_JOB_HANDLERS) handlers: JobHandler[],
    private readonly notificationDlqQueueGateway: NotificationDlqQueueGateway,
  ) {
    super(handlers);
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job, error: Error): Promise<void> {
    await this.sendToDlq(this.notificationDlqQueueGateway, job, error);
  }
}
