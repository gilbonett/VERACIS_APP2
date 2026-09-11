import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { AlertQueueGateway } from "../gateways";
import { JOB_NAMES, QUEUE_NAMES } from "../queue.constants";
import { AlertJobOptions, AlertJobPayload } from "../types/alert-job.types";

@Injectable()
export class AlertProducer implements AlertQueueGateway {
  constructor(@InjectQueue(QUEUE_NAMES.ALERT) private readonly queue: Queue) {}

  async schedulePending(
    data: AlertJobPayload,
    options?: AlertJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.EXPIRE_PENDING_ALERT, data, {
      ...options,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    });
  }

  async scheduleAccepted(
    data: AlertJobPayload,
    options?: AlertJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.EXPIRE_ACCEPTED_ALERT, data, {
      ...options,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    });
  }

  async cancel(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job && !(await job.isActive())) {
      await job.remove();
    }
  }
}
