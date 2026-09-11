import { RedisModule } from "@/infra/redis/redis.module";
import { Module } from "@nestjs/common";
import { NotificationProvider } from "./notification/notification-provider";
import { RedisNotificationProvider } from "./notification/redis-notification.provider";
import { ConnectionRegistry } from "./presence/connection-registry";
import { RedisConnectionRegistry } from "./presence/redis-connection-registry";

@Module({
  imports: [RedisModule.forRoot({ prefix: "realtime" })],
  providers: [
    {
      provide: NotificationProvider,
      useClass: RedisNotificationProvider,
    },
    {
      provide: ConnectionRegistry,
      useClass: RedisConnectionRegistry,
    },
  ],
  exports: [NotificationProvider, ConnectionRegistry],
})
export class RealtimeModule {}
