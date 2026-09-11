import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { DlqPayload } from "../../shared";
import { AlertDlqQueueGateway, AlertQueueGateway } from "../gateways";
import { JOB_NAMES, QUEUE_NAMES } from "../queue.constants";
import { AlertJobPayload } from "../types/alert-job.types";

@Injectable()
export class AlertDlqProducer implements AlertDlqQueueGateway {
  constructor(
    @InjectQueue(QUEUE_NAMES.ALERT_DLQ) private readonly dlq: Queue,
    private readonly alertQueueGateway: AlertQueueGateway,
  ) {}

  async send(payload: DlqPayload<AlertJobPayload>): Promise<void> {
    await this.dlq.add(payload.originalJobName, payload, {
      removeOnComplete: true,
    });
  }

  async retry(jobId: string): Promise<void> {
    const job = await this.dlq.getJob(jobId);

    if (!job) return;

    const dlqEntry = job.data as DlqPayload<AlertJobPayload>;

    if (job.name === JOB_NAMES.EXPIRE_PENDING_ALERT) {
      await this.alertQueueGateway.schedulePending(dlqEntry.data);
    } else if (job.name === JOB_NAMES.EXPIRE_ACCEPTED_ALERT) {
      await this.alertQueueGateway.scheduleAccepted(dlqEntry.data);
    }

    await job.remove();
  }

  async discard(jobId: string): Promise<void> {
    const job = await this.dlq.getJob(jobId);
    if (job) await job.remove();
  }
}
