import { SendNotificationsByAlertUseCase } from "@/domain/notifications/use-cases/send-notifications-by-alert.use-case";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobHandler } from "../../shared";
import { JOB_NAMES } from "../queue.constants";
import { NotificationByAlertJobPayload } from "../types/notification-job.types";

@Injectable()
export class NotifyMemberByAlertHandler implements JobHandler<NotificationByAlertJobPayload> {
  readonly jobName = JOB_NAMES.NOTIFY_MEMBERS_BY_ALERT;

  constructor(
    private readonly sendNotificationsByAlertUseCase: SendNotificationsByAlertUseCase,
  ) {}

  async handle(job: Job<NotificationByAlertJobPayload>): Promise<void> {
    console.log("job.data", job.data);

    await this.sendNotificationsByAlertUseCase.execute(job.data);
  }
}
