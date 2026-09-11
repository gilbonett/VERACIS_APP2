import { Notification } from "../entities/notification";

export abstract class NotificationRepository {
  abstract findCountByRecipientId(recipientId: string): Promise<number>;
  abstract findManyByRecipientId(
    recipientId: string,
    params: { limit: number; cursor?: string },
  ): Promise<{ notifications: Notification[]; nextCursor: string | null }>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract create(notification: Notification): Promise<void>;
  abstract createMany(notifications: Notification[]): Promise<void>;
  abstract save(notification: Notification): Promise<void>;
}
