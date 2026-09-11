import { Either, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { Notification, NotificationScope } from "../entities/notification";
import { NotificationRepository } from "../repositories/notification-repository";

export interface SendNotificationUseCaseRequest {
  scope: NotificationScope;
  title: string;
  content: string;
  alertId?: string | null;
  authorId: string;
  recipientId: string;
}

type SendNotificationUseCaseResponse = Either<
  never,
  { notification: Notification }
>;

@Injectable()
export class SendNotificationUseCase implements UseCase<
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse
> {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute({
    scope,
    title,
    content,
    alertId,
    authorId,
    recipientId,
  }: SendNotificationUseCaseRequest): Promise<SendNotificationUseCaseResponse> {
    const notification = Notification.create({
      scope,
      title,
      content,
      alertId: alertId ? new UniqueEntityID(alertId) : null,
      authorId: new UniqueEntityID(authorId),
      recipientId: new UniqueEntityID(recipientId),
    });

    await this.notificationRepository.create(notification);

    return right({ notification });
  }
}
