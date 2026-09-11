import { StreamNotificationUseCase } from "@/domain/notifications/use-cases/stream-notification.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, MessageEvent, Sse } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { map, Observable } from "rxjs";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { SkipTimeout } from "../../decorators/skip-timeout.decorator";
import { TrackConnection } from "../../decorators/track-connection.decorator";
import { SteamNotificationsDoc } from "../../docs/notifications/steam-notifications.doc";
import { NotificationPresenter } from "../../presenters/notifications/notification-presenter";

@ApiTags(SWAGGER_TAGS.NOTIFICATIONS)
@Controller("notifications")
export class SteamNotificationsController {
  constructor(private streamNotificationUseCase: StreamNotificationUseCase) {}

  @Sse("stream")
  @SkipTimeout()
  @TrackConnection("notifications")
  @SteamNotificationsDoc()
  handle(
    @CurrentSession() { userId }: ICurrentSession,
  ): Observable<MessageEvent> {
    return this.streamNotificationUseCase.execute(userId).pipe(
      map((notification) => ({
        data: NotificationPresenter.toHTTP(notification),
        type: "notifications",
      })),
    );
  }
}
