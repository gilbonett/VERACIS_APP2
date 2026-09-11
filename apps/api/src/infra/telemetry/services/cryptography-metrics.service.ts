import {
  CRYPTOGRAPHY_ATTRS,
  CRYPTOGRAPHY_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export type CryptographyOperation = "hash" | "compare" | "hmac";

@Injectable()
export class CryptographyMetricsService extends MetricsService {
  readonly operationDuration: Histogram = this.histogram(
    CRYPTOGRAPHY_METRICS.OPERATION_DURATION,
    {
      description: "Duration of hash/compare operations in seconds (bcrypt)",
      unit: "s",
      // Bcrypt com salt 8 leva ~100ms — buckets focados nessa faixa
      buckets: [0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 1, 2],
    },
  );

  // HMAC é síncrono e ordens de magnitude mais rápido que bcrypt
  // (~0.3ms vs ~100ms) — histograma separado pra não perder resolução
  // (tudo cairia no bucket mínimo do operationDuration).
  readonly hmacDuration: Histogram = this.histogram(
    CRYPTOGRAPHY_METRICS.HMAC_DURATION,
    {
      description: "Duration of HMAC sign operations in seconds",
      unit: "s",
      buckets: [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.05],
    },
  );

  readonly errors: Counter = this.counter(CRYPTOGRAPHY_METRICS.ERROR_TOTAL, {
    description: "Total number of cryptography operation errors",
  });

  constructor() {
    super(TRACER_NAMES.CRYPTOGRAPHY);
  }

  recordDuration(operation: CryptographyOperation, durationS: number): void {
    const histogram =
      operation === "hmac" ? this.hmacDuration : this.operationDuration;
    histogram.record(durationS, {
      [CRYPTOGRAPHY_ATTRS.OPERATION]: operation,
    });
  }

  recordError(operation: CryptographyOperation, errorType: string): void {
    this.errors.add(1, {
      [CRYPTOGRAPHY_ATTRS.OPERATION]: operation,
      [CRYPTOGRAPHY_ATTRS.ERROR_TYPE]: errorType,
    });
  }
}
