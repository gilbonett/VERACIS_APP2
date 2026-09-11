import { ReadNotificationUseCase } from "@/domain/notifications/use-cases/read-notification.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Patch,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { ReadNotificationDoc } from "../../docs/notifications/read-notification.doc";

@ApiTags(SWAGGER_TAGS.NOTIFICATIONS)
@Controller("notifications/:notificationId/read")
export class ReadNotificationController {
  constructor(private readNotification: ReadNotificationUseCase) {}

  @Patch()
  @HttpCode(204)
  @ReadNotificationDoc()
  async handle(
    @Param("notificationId") notificationId: string,
    @CurrentSession() { userId }: ICurrentSession,
  ) {
    const result = await this.readNotification.execute({
      notificationId,
      recipientId: userId,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }
  }
}
