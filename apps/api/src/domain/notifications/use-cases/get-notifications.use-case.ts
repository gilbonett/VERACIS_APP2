import { Injectable } from "@nestjs/common";
import { Notification } from "../entities/notification";
import { NotificationRepository } from "../repositories/notification-repository";

type GetNotificationsUseCaseRequest = {
  recipientId: string;
  limit?: number;
  cursor?: string;
};

type GetNotificationsUseCaseResponse = {
  count: number;
  notifications: Notification[];
  nextCursor: string | null;
};

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute({
    recipientId,
    limit = 10,
    cursor,
  }: GetNotificationsUseCaseRequest): Promise<GetNotificationsUseCaseResponse> {
    const [count, notifications] = await Promise.all([
      this.notificationRepository.findCountByRecipientId(recipientId),
      this.notificationRepository.findManyByRecipientId(recipientId, {
        limit,
        cursor,
      }),
    ]);

    return {
      count,
      notifications: notifications.notifications,
      nextCursor: notifications.nextCursor,
    };
  }
}
