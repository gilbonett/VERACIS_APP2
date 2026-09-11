import { Either, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { Notification, NotificationScope } from "../entities/notification";
import { NotificationRepository } from "../repositories/notification-repository";

export interface SendManyNotificationUseCaseRequest {
  scope: NotificationScope;
  title: string;
  content: string;
  alertId?: string | null;
  authorId: string;
  recipientId: string;
}

type SendManyNotificationUseCaseResponse = Either<
  never,
  { notifications: Notification[] }
>;

@Injectable()
export class SendManyNotificationUseCase implements UseCase<
  SendManyNotificationUseCaseRequest[],
  SendManyNotificationUseCaseResponse
> {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(
    data: SendManyNotificationUseCaseRequest[],
  ): Promise<SendManyNotificationUseCaseResponse> {
    const notifications = data.map((notification) =>
      Notification.create({
        scope: notification.scope,
        title: notification.title,
        content: notification.content,
        alertId: notification.alertId
          ? new UniqueEntityID(notification.alertId)
          : null,
        authorId: new UniqueEntityID(notification.authorId),
        recipientId: new UniqueEntityID(notification.recipientId),
      }),
    );

    await this.notificationRepository.createMany(notifications);

    return right({ notifications });
  }
}
