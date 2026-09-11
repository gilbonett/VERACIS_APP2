import {
  BUSINESS_ATTRS,
  BUSINESS_METRICS,
  BusinessAction,
  BusinessFlow,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export type BusinessResult = "success" | "error";

@Injectable()
export class BusinessMetricsService extends MetricsService {
  readonly flowDuration: Histogram = this.histogram(
    BUSINESS_METRICS.FLOW_DURATION,
    {
      description: "Duration of business flows in seconds",
      unit: "s",
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
    },
  );

  readonly actionTotal: Counter = this.counter(BUSINESS_METRICS.ACTION_TOTAL, {
    description: "Total business actions executed",
  });

  constructor() {
    super(TRACER_NAMES.BUSINESS);
  }

  recordFlow(
    flow: BusinessFlow,
    action: BusinessAction,
    result: BusinessResult,
    durationS: number,
  ): void {
    const attrs = {
      [BUSINESS_ATTRS.FLOW]: flow,
      [BUSINESS_ATTRS.ACTION]: action,
      [BUSINESS_ATTRS.RESULT]: result,
    };
    this.flowDuration.record(durationS, attrs);
    this.actionTotal.add(1, attrs);
  }
}
