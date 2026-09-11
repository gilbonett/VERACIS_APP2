import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { RedisModule } from "../redis/redis.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    TerminusModule,
    DatabaseModule,
    RedisModule,
    // Importa apenas as filas principais — DLQs não precisam de health check
    // BullModule.registerQueue(
    //   { name: QUEUE_NAMES.MAIL },
    //   { name: QUEUE_NAMES.ALERT_PENDING_EXPIRATION },
    //   { name: QUEUE_NAMES.ALERT_ACCEPTED_EXPIRATION },
    // ),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
