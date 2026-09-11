import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { NotificationQueueGateway } from "../gateways/notification-queue.gateway";
import { JOB_NAMES, QUEUE_NAMES } from "../queue.constants";
import {
  NotificationByAlertJobPayload,
  NotificationByUserJobPayload,
  NotificationJobOptions,
} from "../types/notification-job.types";

@Injectable()
export class NotificationProducer implements NotificationQueueGateway {
  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly queue: Queue,
  ) {}

  async addNotificationByUser(
    data: NotificationByUserJobPayload,
    options?: NotificationJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.NOTIFY_MEMBERS_BY_USER, data, {
      ...options,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    });
  }

  async addNotificationByAlert(
    data: NotificationByAlertJobPayload,
    options?: NotificationJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.NOTIFY_MEMBERS_BY_ALERT, data, {
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
