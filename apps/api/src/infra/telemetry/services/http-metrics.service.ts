import {
  HTTP_ATTRS,
  HTTP_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Histogram, UpDownCounter } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export interface HttpRequestLabels {
  route: string;
  method: string;
  statusCode: number;
}

@Injectable()
export class HttpMetricsService extends MetricsService {
  readonly requestDuration: Histogram = this.histogram(
    HTTP_METRICS.REQUEST_DURATION,
    {
      description: "Duration of HTTP requests in seconds",
      unit: "s",
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    },
  );

  readonly requestActive: UpDownCounter = this.upDownCounter(
    HTTP_METRICS.REQUEST_ACTIVE,
    {
      description: "Number of HTTP requests currently in flight",
    },
  );

  constructor() {
    super(TRACER_NAMES.HTTP);
  }

  requestStarted(labels: Pick<HttpRequestLabels, "route" | "method">): void {
    this.requestActive.add(1, {
      [HTTP_ATTRS.ROUTE]: labels.route,
      [HTTP_ATTRS.METHOD]: labels.method,
    });
  }

  requestFinished(labels: HttpRequestLabels, durationS: number): void {
    this.requestActive.add(-1, {
      [HTTP_ATTRS.ROUTE]: labels.route,
      [HTTP_ATTRS.METHOD]: labels.method,
    });
    this.requestDuration.record(durationS, {
      [HTTP_ATTRS.ROUTE]: labels.route,
      [HTTP_ATTRS.METHOD]: labels.method,
      [HTTP_ATTRS.STATUS_CODE]: labels.statusCode,
    });
  }
}
