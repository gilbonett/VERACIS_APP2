import {
  CACHE_ATTRS,
  CACHE_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export type CacheOperation = "get" | "set" | "delete";

@Injectable()
export class CacheMetricsService extends MetricsService {
  readonly duration: Histogram = this.histogram(
    CACHE_METRICS.OPERATION_DURATION,
    {
      description: "Duration of cache operations in seconds",
      unit: "s",
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    },
  );

  readonly hits: Counter = this.counter(CACHE_METRICS.HIT_TOTAL, {
    description: "Total cache hits",
  });

  readonly misses: Counter = this.counter(CACHE_METRICS.MISS_TOTAL, {
    description: "Total cache misses",
  });

  readonly errors: Counter = this.counter(CACHE_METRICS.ERROR_TOTAL, {
    description: "Total cache errors",
  });

  constructor() {
    super(TRACER_NAMES.CACHE);
  }

  recordDuration(
    operation: CacheOperation,
    durationS: number,
    keyPrefix: string,
  ): void {
    this.duration.record(durationS, {
      [CACHE_ATTRS.OPERATION]: operation,
      [CACHE_ATTRS.KEY_PREFIX]: keyPrefix,
    });
  }

  recordHit(keyPrefix: string): void {
    this.hits.add(1, {
      [CACHE_ATTRS.OPERATION]: "get",
      [CACHE_ATTRS.KEY_PREFIX]: keyPrefix,
    });
  }

  recordMiss(keyPrefix: string): void {
    this.misses.add(1, {
      [CACHE_ATTRS.OPERATION]: "get",
      [CACHE_ATTRS.KEY_PREFIX]: keyPrefix,
    });
  }

  recordError(
    operation: CacheOperation,
    errorType: string,
    keyPrefix: string,
  ): void {
    this.errors.add(1, {
      [CACHE_ATTRS.OPERATION]: operation,
      [CACHE_ATTRS.ERROR_TYPE]: errorType,
      [CACHE_ATTRS.KEY_PREFIX]: keyPrefix,
    });
  }
}
