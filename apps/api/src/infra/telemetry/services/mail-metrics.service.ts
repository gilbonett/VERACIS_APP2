import {
  MAIL_ATTRS,
  MAIL_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export type MailTemplate = "welcome" | "verify-code" | "password-reset";

@Injectable()
export class MailMetricsService extends MetricsService {
  readonly sendDuration: Histogram = this.histogram(
    MAIL_METRICS.SEND_DURATION,
    {
      description: "Duration of mail send operations in seconds",
      unit: "s",
      buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
    },
  );

  readonly sendTotal: Counter = this.counter(MAIL_METRICS.SEND_TOTAL, {
    description: "Total emails sent successfully",
  });

  readonly errors: Counter = this.counter(MAIL_METRICS.ERROR_TOTAL, {
    description: "Total mail send errors",
  });

  constructor() {
    super(TRACER_NAMES.MAIL);
  }

  recordSent(template: MailTemplate, durationS: number): void {
    this.sendDuration.record(durationS, { [MAIL_ATTRS.TEMPLATE]: template });
    this.sendTotal.add(1, { [MAIL_ATTRS.TEMPLATE]: template });
  }

  recordError(template: MailTemplate, errorType: string): void {
    this.errors.add(1, {
      [MAIL_ATTRS.TEMPLATE]: template,
      [MAIL_ATTRS.ERROR_TYPE]: errorType,
    });
  }
}
