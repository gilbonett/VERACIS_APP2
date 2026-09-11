import { TRACER_NAMES } from "@/shared/constants/telemetry.constants";
import { Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  Counter,
  Histogram,
  MetricOptions,
  metrics,
  ObservableGauge,
  UpDownCounter,
} from "@opentelemetry/api";

type TracerName = (typeof TRACER_NAMES)[keyof typeof TRACER_NAMES];

/**
 * Classe base para todos os *MetricsService.
 * Gerencia ciclo de vida dos instruments e expõe factory methods
 * para que cada subclasse declare apenas o que é específico seu.
 *
 * @example
 * export class CacheMetricsService extends BaseMetricsService {
 *   readonly duration = this.histogram(CACHE_METRICS.OPERATION_DURATION, { ... })
 *   readonly hits    = this.counter(CACHE_METRICS.HIT_TOTAL)
 * }
 */
export abstract class MetricsService implements OnModuleInit, OnModuleDestroy {
  protected readonly logger: Logger;
  private readonly meterName: TracerName;
  // private readonly instruments: Array<{
  //   name: string;
  //   ref: { [key: string]: unknown };
  // }> = [];

  constructor(meterName: TracerName) {
    this.meterName = meterName;
    this.logger = new Logger(this.constructor.name);
  }

  protected histogram(
    name: string,
    options?: Omit<MetricOptions, "advice"> & {
      buckets: number[];
    },
  ): Histogram {
    const { buckets, ...rest } = options ?? { buckets: [] };
    return metrics.getMeter(this.meterName).createHistogram(name, {
      ...rest,
      advice: { explicitBucketBoundaries: buckets },
    });
  }

  protected counter(name: string, options?: MetricOptions): Counter {
    return metrics.getMeter(this.meterName).createCounter(name, options);
  }

  protected upDownCounter(
    name: string,
    options?: MetricOptions,
  ): UpDownCounter {
    return metrics.getMeter(this.meterName).createUpDownCounter(name, options);
  }

  protected observableGauge(
    name: string,
    options?: MetricOptions,
  ): ObservableGauge {
    return metrics
      .getMeter(this.meterName)
      .createObservableGauge(name, options);
  }

  onModuleInit(): void {
    this.logger.log(`${this.constructor.name}: instruments initialized`);
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log(`${this.constructor.name}: instruments released`);
  }
}
