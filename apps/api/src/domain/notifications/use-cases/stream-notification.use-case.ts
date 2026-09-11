import { NotificationProvider } from "@/infra/realtime/notification/notification-provider";
import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Notification } from "../entities/notification";

@Injectable()
export class StreamNotificationUseCase {
  constructor(private readonly notificationProvider: NotificationProvider) {}

  execute(recipientId: string): Observable<Notification> {
    return this.notificationProvider.observable(recipientId);
  }
}
