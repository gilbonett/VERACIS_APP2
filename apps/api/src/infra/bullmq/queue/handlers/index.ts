import { Provider, Type } from "@nestjs/common";
import { createJobHandlersProvider, JobHandler } from "../../shared";
import { ExpireAcceptedAlertHandler } from "./expire-accepted-alert.handler";
import { ExpirePendingAlertHandler } from "./expire-pending-alert.handler";
import { NotifyMemberByAlertHandler } from "./send-notifications-by-alert.handler";
import { NotifyMemberByUserHandler } from "./send-notifications-by-user.handler";
import { SendOtpCodeHandler } from "./send-otp-code-handler";
import { SendPasswordResetJobPayloadHandler } from "./send-password-reset.handler";
import { SendWelcomeEmailHandler } from "./send-welcome-email.handler";

export const ALERT_JOB_HANDLERS = Symbol("ALERT_JOB_HANDLERS");

const ALERT_HANDLER_CLASSES: Type<JobHandler>[] = [
  ExpirePendingAlertHandler,
  ExpireAcceptedAlertHandler,
];

export const ALERT_HANDLERS_PROVIDERS: Provider[] = [
  ...ALERT_HANDLER_CLASSES,
  createJobHandlersProvider(ALERT_JOB_HANDLERS, ALERT_HANDLER_CLASSES),
];

export const NOTIFICATION_JOB_HANDLERS = Symbol("NOTIFICATION_JOB_HANDLERS");

export const NOTIFICATION_HANDLER_CLASSES: Type<JobHandler>[] = [
  NotifyMemberByAlertHandler,
  NotifyMemberByUserHandler,
];

export const NOTIFICATION_HANDLERS_PROVIDERS: Provider[] = [
  ...NOTIFICATION_HANDLER_CLASSES,
  createJobHandlersProvider(
    NOTIFICATION_JOB_HANDLERS,
    NOTIFICATION_HANDLER_CLASSES,
  ),
];

export const AUTH_JOB_HANDLERS = Symbol("AUTH_JOB_HANDLERS");

export const AUTH_HANDLER_CLASSES: Type<JobHandler>[] = [
  SendOtpCodeHandler,
  SendPasswordResetJobPayloadHandler,
  SendWelcomeEmailHandler,
];

export const AUTH_HANDLERS_PROVIDERS: Provider[] = [
  ...AUTH_HANDLER_CLASSES,
  createJobHandlersProvider(AUTH_JOB_HANDLERS, AUTH_HANDLER_CLASSES),
];
