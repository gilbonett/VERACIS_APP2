import { SendNotificationsByUserUseCase } from "@/domain/notifications/use-cases/send-notifications-by-user.use-case";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobHandler } from "../../shared";
import { JOB_NAMES } from "../queue.constants";
import { NotificationByUserJobPayload } from "../types/notification-job.types";

@Injectable()
export class NotifyMemberByUserHandler implements JobHandler<NotificationByUserJobPayload> {
  readonly jobName = JOB_NAMES.NOTIFY_MEMBERS_BY_USER;

  constructor(
    private readonly sendNotificationsByUserUseCase: SendNotificationsByUserUseCase,
  ) {}

  async handle(job: Job<NotificationByUserJobPayload>): Promise<void> {
    await this.sendNotificationsByUserUseCase.execute(job.data);
  }
}
