import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import {
  ThrottlerModule as ConfigThrottlerModule,
  minutes,
  seconds,
} from "@nestjs/throttler";
import { GlobalIpThrottlerGuard } from "./global-ip-throttler.guard";
import { ThrottlerLoggingFilter } from "./throttler-logger.filter";

const HOUR_IN_MS = 60 * 60 * 1000;

@Module({
  imports: [
    ConfigThrottlerModule.forRoot({
      throttlers: [
        {
          name: "short",
          ttl: seconds(10),
          limit: 15,
          blockDuration: minutes(5),
        },
        {
          name: "medium",
          ttl: minutes(1),
          limit: 60,
          blockDuration: minutes(15),
        },
        {
          name: "long",
          ttl: minutes(30),
          limit: 600,
          blockDuration: 2 * HOUR_IN_MS,
        },
      ],
      ignoreUserAgents: [/ELB-HealthChecker/i, /Datadog/i, /Pingdom/i],
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ThrottlerLoggingFilter,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalIpThrottlerGuard,
    },
  ],
})
export class ThrottlerModule {}
