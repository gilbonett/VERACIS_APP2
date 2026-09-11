import {
  NotificationByAlertJobPayload,
  NotificationByUserJobPayload,
  NotificationJobOptions,
} from "../types/notification-job.types";

export abstract class NotificationQueueGateway {
  abstract addNotificationByAlert(
    data: NotificationByAlertJobPayload,
    options?: NotificationJobOptions,
  ): Promise<void>;
  abstract addNotificationByUser(
    data: NotificationByUserJobPayload,
    options?: NotificationJobOptions,
  ): Promise<void>;
  abstract cancel(jobId: string): Promise<void>;
}
