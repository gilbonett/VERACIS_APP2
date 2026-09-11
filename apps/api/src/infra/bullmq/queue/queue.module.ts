import { CloseExpiredAlertUseCase } from "@/domain/alerts/use-cases/close-expired-alert";
import { SendNotificationsByAlertUseCase } from "@/domain/notifications/use-cases/send-notifications-by-alert.use-case";
import { SendNotificationsByUserUseCase } from "@/domain/notifications/use-cases/send-notifications-by-user.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { MailModule } from "@/infra/mail/mail.module";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import {
  ALERT_HANDLERS_PROVIDERS,
  AUTH_HANDLERS_PROVIDERS,
  NOTIFICATION_HANDLERS_PROVIDERS,
} from "./handlers";
import { QUEUE_PROCESSORS_PROVIDERS } from "./processors";
import {
  ALERT_PRODUCERS_EXPORTS,
  ALERT_PRODUCERS_PROVIDERS,
  AUTH_PRODUCERS_EXPORTS,
  AUTH_PRODUCERS_PROVIDERS,
  NOTIFICATION_PRODUCERS_EXPORTS,
  NOTIFICATION_PRODUCERS_PROVIDERS,
} from "./producers";
import { QUEUE_NAMES } from "./queue.constants";

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ALERT,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.ALERT_DLQ,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.NOTIFICATION,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.NOTIFICATION_DLQ,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.AUTH,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.AUTH_DLQ,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
  ],
  providers: [
    // Use Cases
    CloseExpiredAlertUseCase,
    SendNotificationsByAlertUseCase,
    SendNotificationsByUserUseCase,

    ...QUEUE_PROCESSORS_PROVIDERS,

    ...ALERT_PRODUCERS_PROVIDERS,
    ...ALERT_HANDLERS_PROVIDERS,

    ...NOTIFICATION_PRODUCERS_PROVIDERS,
    ...NOTIFICATION_HANDLERS_PROVIDERS,

    ...AUTH_PRODUCERS_PROVIDERS,
    ...AUTH_HANDLERS_PROVIDERS,
  ],
  exports: [
    ...ALERT_PRODUCERS_EXPORTS,
    ...NOTIFICATION_PRODUCERS_EXPORTS,
    ...AUTH_PRODUCERS_EXPORTS,
  ],
})
export class QueueModule {}
