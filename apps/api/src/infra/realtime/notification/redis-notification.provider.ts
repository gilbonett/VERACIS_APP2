import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/notifications/entities/notification";
import { RedisService } from "@/infra/redis/redis.service";
import { ObserveRealtimePublish } from "@/infra/telemetry/decorators/observe-realtime-publish.decorator";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import type Redis from "ioredis";
import { Observable } from "rxjs";
import { NotificationProvider } from "./notification-provider";

const CHANNEL_PREFIX = "notifications:";

interface NotificationPayload {
  id: string;
  scope: Notification["scope"];
  title: string;
  content: string;
  readAt: string | null;
  alertId: string | null;
  authorId: string;
  recipientId: string;
  createdAt: string;
}

@Injectable()
export class RedisNotificationProvider
  implements NotificationProvider, OnModuleDestroy
{
  private readonly subscriber: Redis;

  constructor(private readonly redis: RedisService) {
    this.subscriber = this.redis.duplicate({
      connectionName: "api:realtime-sse-sub",
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
  }

  @ObserveRealtimePublish({
    scope: "notification",
    channel: (notification: unknown) =>
      CHANNEL_PREFIX + (notification as Notification).recipientId.toString(),
    destinationTemplate: `${CHANNEL_PREFIX}{recipientId}`,
  })
  publish(notification: Notification): void {
    const channel = CHANNEL_PREFIX + notification.recipientId.toString();
    this.redis.publish(channel, this.serialize(notification));
  }

  observable(recipientId: string): Observable<Notification> {
    const channel = CHANNEL_PREFIX + recipientId;

    return new Observable<Notification>((subscriber) => {
      const listener = (receivedChannel: string, payload: string) => {
        if (receivedChannel === channel) {
          subscriber.next(this.deserialize(payload));
        }
      };

      this.subscriber.subscribe(channel);
      this.subscriber.on("message", listener);

      return () => {
        this.subscriber.off("message", listener);
        this.subscriber.unsubscribe(channel);
      };
    });
  }

  private serialize(notification: Notification): string {
    const payload: NotificationPayload = {
      id: notification.id.toString(),
      scope: notification.scope,
      title: notification.title,
      content: notification.content,
      readAt: notification.readAt?.toISOString() ?? null,
      alertId: notification.alertId?.toString() ?? null,
      authorId: notification.authorId.toString(),
      recipientId: notification.recipientId.toString(),
      createdAt: notification.createdAt.toISOString(),
    };

    return JSON.stringify(payload);
  }

  private deserialize(raw: string): Notification {
    const payload = JSON.parse(raw) as NotificationPayload;

    return Notification.reconstitute(
      {
        scope: payload.scope,
        title: payload.title,
        content: payload.content,
        readAt: payload.readAt ? new Date(payload.readAt) : null,
        alertId: payload.alertId ? new UniqueEntityID(payload.alertId) : null,
        authorId: new UniqueEntityID(payload.authorId),
        recipientId: new UniqueEntityID(payload.recipientId),
        createdAt: new Date(payload.createdAt),
      },
      new UniqueEntityID(payload.id),
    );
  }
}
