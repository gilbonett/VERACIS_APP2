import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { Notification } from "../entities/notification";
import { NotificationNotFoundError } from "../errors/notification-not-found-error";
import { NotificationRepository } from "../repositories/notification-repository";

interface ReadNotificationUseCaseRequest {
  recipientId: string;
  notificationId: string;
}

type ReadNotificationUseCaseResponse = Either<
  NotificationNotFoundError,
  {
    notification: Notification;
  }
>;

@Injectable()
export class ReadNotificationUseCase implements UseCase<
  ReadNotificationUseCaseRequest,
  ReadNotificationUseCaseResponse
> {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute({
    notificationId,
    recipientId,
  }: ReadNotificationUseCaseRequest): Promise<ReadNotificationUseCaseResponse> {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      return left(new NotificationNotFoundError());
    }

    notification.read(recipientId);

    await this.notificationRepository.save(notification);

    return right({ notification });
  }
}
