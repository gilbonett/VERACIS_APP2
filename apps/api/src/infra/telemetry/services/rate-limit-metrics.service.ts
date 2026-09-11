import {
  RATE_LIMIT_ATTRS,
  RATE_LIMIT_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export type ThrottlerName = "short" | "medium" | "long" | "unknown";

@Injectable()
export class RateLimitMetricsService extends MetricsService {
  readonly throttled: Counter = this.counter(
    RATE_LIMIT_METRICS.THROTTLED_TOTAL,
    {
      description: "Total de requisições bloqueadas por rate limit",
    },
  );

  constructor() {
    super(TRACER_NAMES.RATE_LIMIT);
  }

  recordThrottled(opts: { throttlerName: ThrottlerName; route: string }): void {
    this.throttled.add(1, {
      [RATE_LIMIT_ATTRS.THROTTLER_NAME]: opts.throttlerName,
      [RATE_LIMIT_ATTRS.ROUTE]: opts.route,
    });
  }
}
