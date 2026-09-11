import { Notification } from "@/domain/notifications/entities/notification";
import { NotificationRepository } from "@/domain/notifications/repositories/notification-repository";
import { ObserveSpan } from "@/infra/telemetry/decorators/observe-span.decorator";
import { TRACER_NAMES } from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaNotificationMapper } from "../mappers/prisma-notification-mapper";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async findCountByRecipientId(recipientId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientId,
        readAt: null,
        OR: [
          { alertId: null },
          { alert: { is: { status: { notIn: ["CLOSED", "REJECTED"] } } } },
        ],
      },
    });
  }

  async findManyByRecipientId(
    recipientId: string,
    { cursor, limit }: { cursor?: string; limit: number },
  ): Promise<{ notifications: Notification[]; nextCursor: string | null }> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        recipientId,
        OR: [
          { alertId: null },
          { alert: { is: { status: { notIn: ["CLOSED", "REJECTED"] } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const hasMore = notifications.length > limit;
    const data = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      notifications: data.map(PrismaNotificationMapper.toDomain),
      nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
    };
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    return PrismaNotificationMapper.toDomain(notification);
  }

  async create(notification: Notification): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notification.create({
        data: PrismaNotificationMapper.toPrisma(notification),
      });
      await this.outboxRepository.create(notification, tx);
    });

    notification.clearEvents();
  }

  @ObserveSpan({
    tracer: TRACER_NAMES.DATABASE,
    name: `${PrismaNotificationRepository.name}.createMany`,
  })
  async createMany(notifications: Notification[]): Promise<void> {
    console.log("notifications", notifications);
    if (notifications.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.createMany({
        data: notifications.map(PrismaNotificationMapper.toPrisma),
      });
      await this.outboxRepository.createMany(notifications, tx);
    });

    notifications.forEach((notification) => {
      notification.clearEvents();
    });
  }

  async save(notification: Notification): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notification.update({
        where: { id: notification.id.toString() },
        data: PrismaNotificationMapper.toPrisma(notification),
      });
      await this.outboxRepository.create(notification, tx);
    });

    notification.clearEvents();
  }
}
