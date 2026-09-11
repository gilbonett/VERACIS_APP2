import { Notification } from "@/domain/notifications/entities/notification";
import { Observable } from "rxjs";

export abstract class NotificationProvider {
  abstract publish(notification: Notification): void;
  abstract observable(recipientId: string): Observable<Notification>;
}
