import { GetNotificationsUseCase } from "@/domain/notifications/use-cases/get-notifications.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { GetNotificationsDoc } from "../../docs/notifications/get-notifications.doc";
import { GetNotificationsQueryDto } from "../../dtos/notifications/get-notifications.dto";
import { NotificationPresenter } from "../../presenters/notifications/notification-presenter";

@ApiTags(SWAGGER_TAGS.NOTIFICATIONS)
@Controller("notifications")
export class GetNotificationsController {
  constructor(private getNotifications: GetNotificationsUseCase) {}

  @Get()
  @GetNotificationsDoc()
  async handle(
    @Query() query: GetNotificationsQueryDto,
    @CurrentSession() { userId }: ICurrentSession,
  ) {
    const result = await this.getNotifications.execute({
      recipientId: userId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return {
      count: result.count,
      nextCursor: result.nextCursor,
      items: result.notifications.map(NotificationPresenter.toHTTP),
    };
  }
}
