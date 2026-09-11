import {
  REALTIME_ATTRS,
  REALTIME_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

@Injectable()
export class RealtimeMetricsService extends MetricsService {
  readonly duration: Histogram = this.histogram(
    REALTIME_METRICS.PUBLISH_DURATION,
    {
      description: "Duration of realtime publish operations in seconds",
      unit: "s",
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    },
  );

  readonly publishTotal: Counter = this.counter(
    REALTIME_METRICS.PUBLISH_TOTAL,
    {
      description: "Total realtime notifications published",
    },
  );

  readonly errors: Counter = this.counter(REALTIME_METRICS.ERROR_TOTAL, {
    description: "Total realtime publish errors",
  });

  constructor() {
    super(TRACER_NAMES.REALTIME);
  }

  recordDuration(scope: string, durationS: number): void {
    this.duration.record(durationS, {
      [REALTIME_ATTRS.SCOPE]: scope,
    });
  }

  recordPublished(scope: string): void {
    this.publishTotal.add(1, {
      [REALTIME_ATTRS.SCOPE]: scope,
    });
  }

  recordError(scope: string, errorType: string): void {
    this.errors.add(1, {
      [REALTIME_ATTRS.SCOPE]: scope,
      [REALTIME_ATTRS.ERROR_TYPE]: errorType,
    });
  }
}
