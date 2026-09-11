import { Provider } from "@nestjs/common";
import {
  AlertDlqQueueGateway,
  AlertQueueGateway,
  AuthDlqQueueGateway,
  AuthQueueGateway,
} from "../gateways";
import { NotificationDlqQueueGateway } from "../gateways/notification-dlq-queue.gateway";
import { NotificationQueueGateway } from "../gateways/notification-queue.gateway";
import { AlertDlqProducer } from "./alert-dlq.producer";
import { AlertProducer } from "./alert.producer";
import { AuthDlqProducer } from "./auth-dlq.producer";
import { AuthProducer } from "./auth.producer";
import { NotificationDlqProducer } from "./notification-dlq.producer";
import { NotificationProducer } from "./notification.producer";

export const ALERT_PRODUCERS_PROVIDERS: Provider[] = [
  { provide: AlertQueueGateway, useClass: AlertProducer },
  { provide: AlertDlqQueueGateway, useClass: AlertDlqProducer },
];

export const ALERT_PRODUCERS_EXPORTS = [
  AlertQueueGateway,
  AlertDlqQueueGateway,
];

export const NOTIFICATION_PRODUCERS_PROVIDERS: Provider[] = [
  { provide: NotificationQueueGateway, useClass: NotificationProducer },
  { provide: NotificationDlqQueueGateway, useClass: NotificationDlqProducer },
];

export const NOTIFICATION_PRODUCERS_EXPORTS = [
  NotificationQueueGateway,
  NotificationDlqQueueGateway,
];

export const AUTH_PRODUCERS_PROVIDERS: Provider[] = [
  { provide: AuthQueueGateway, useClass: AuthProducer },
  { provide: AuthDlqQueueGateway, useClass: AuthDlqProducer },
];

export const AUTH_PRODUCERS_EXPORTS = [AuthQueueGateway, AuthDlqQueueGateway];
