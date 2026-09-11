import {
  EVENTS_ATTRS,
  EVENTS_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

@Injectable()
export class EventsMetricsService extends MetricsService {
  readonly handlerDuration: Histogram = this.histogram(
    EVENTS_METRICS.HANDLER_DURATION,
    {
      description: "Duration of domain event handlers in seconds",
      unit: "s",
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    },
  );

  readonly publishTotal: Counter = this.counter(EVENTS_METRICS.PUBLISH_TOTAL, {
    description: "Total domain events published",
  });

  readonly consumedTotal: Counter = this.counter(
    EVENTS_METRICS.CONSUMED_TOTAL,
    {
      description: "Total domain events consumed by handlers",
    },
  );

  readonly errors: Counter = this.counter(EVENTS_METRICS.ERROR_TOTAL, {
    description: "Total domain event errors",
  });

  constructor() {
    super(TRACER_NAMES.EVENTS);
  }

  recordPublished(topic: string): void {
    this.publishTotal.add(1, { [EVENTS_ATTRS.TOPIC]: topic });
  }

  recordConsumed(topic: string, durationS: number): void {
    this.handlerDuration.record(durationS, { [EVENTS_ATTRS.TOPIC]: topic });
    this.consumedTotal.add(1, { [EVENTS_ATTRS.TOPIC]: topic });
  }

  recordError(topic: string, errorType: string): void {
    this.errors.add(1, {
      [EVENTS_ATTRS.TOPIC]: topic,
      [EVENTS_ATTRS.ERROR_TYPE]: errorType,
    });
  }
}
