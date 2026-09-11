import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { envSchema } from "./env/env";
import { EnvModule } from "./env/env.module";
import { EventsModule } from "./events/event.module";
import { HealthModule } from "./health/health.module";
import { HttpModule } from "./http/http.module";
import { JobModule } from "./job/job.module";
import { LoggerModule } from "./logger/logger.module";
import { TelemetryModule } from "./telemetry/telemetry.module";
import { ThrottlerModule } from "./throttler/throttler.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    EnvModule,
    TelemetryModule,
    ThrottlerModule,
    HttpModule,
    JobModule,
    LoggerModule,
    EventsModule,
    AuthModule,
    HealthModule,
  ],
  providers: [],
})
export class AppModule {}
