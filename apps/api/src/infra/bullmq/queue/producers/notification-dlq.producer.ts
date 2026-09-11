import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { DlqPayload } from "../../shared";
import { NotificationDlqQueueGateway } from "../gateways/notification-dlq-queue.gateway";
import { NotificationQueueGateway } from "../gateways/notification-queue.gateway";
import { QUEUE_NAMES } from "../queue.constants";
import { NotificationByAlertJobPayload } from "../types/notification-job.types";

@Injectable()
export class NotificationDlqProducer implements NotificationDlqQueueGateway {
  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION_DLQ) private readonly dlq: Queue,
    private readonly notificationQueueGateway: NotificationQueueGateway,
  ) {}

  async send(
    payload: DlqPayload<NotificationByAlertJobPayload>,
  ): Promise<void> {
    await this.dlq.add(payload.originalJobName, payload, {
      removeOnComplete: true,
    });
  }

  async retry(jobId: string): Promise<void> {
    const job = await this.dlq.getJob(jobId);

    if (!job) return;

    const dlqEntry = job.data as DlqPayload<NotificationByAlertJobPayload>;

    await this.notificationQueueGateway.addNotificationByAlert(dlqEntry.data);

    await job.remove();
  }

  async discard(jobId: string): Promise<void> {
    const job = await this.dlq.getJob(jobId);
    if (job) await job.remove();
  }
}
