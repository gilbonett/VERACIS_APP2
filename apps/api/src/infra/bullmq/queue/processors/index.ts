import { Provider } from "@nestjs/common";
import { AlertProcessor } from "./alert.processor";
import { AuthProcessor } from "./auth.processor";
import { NotificationProcessor } from "./notification.processor";

export const QUEUE_PROCESSORS_PROVIDERS: Provider[] = [
  AlertProcessor,
  NotificationProcessor,
  AuthProcessor,
];
