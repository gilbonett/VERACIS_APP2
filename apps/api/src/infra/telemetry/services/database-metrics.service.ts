import {
  DATABASE_ATTRS,
  DATABASE_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import {
  Counter,
  Histogram,
  ObservableGauge,
  ObservableResult,
} from "@opentelemetry/api";
import { Pool } from "pg";
// import { PrismaPg } from "@prisma/adapter-pg";
import { MetricsService } from "./metrics.service";

@Injectable()
export class DatabaseMetricsService extends MetricsService {
  readonly queryDuration: Histogram = this.histogram(
    DATABASE_METRICS.QUERY_DURATION,
    {
      description: "Duration of Prisma database operations in seconds",
      unit: "s",
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    },
  );

  readonly slowQueries: Counter = this.counter(
    DATABASE_METRICS.SLOW_QUERIES_TOTAL,
    {
      description: "Total queries exceeding slow-query threshold",
    },
  );

  readonly poolTotal: ObservableGauge = this.observableGauge(
    DATABASE_METRICS.POOL_TOTAL,
    {
      description: "Total connections in the PostgreSQL pool",
      unit: "connections",
    },
  );

  readonly poolIdle: ObservableGauge = this.observableGauge(
    DATABASE_METRICS.POOL_IDLE,
    {
      description: "Idle connections available in the PostgreSQL pool",
      unit: "connections",
    },
  );

  readonly poolWaiting: ObservableGauge = this.observableGauge(
    DATABASE_METRICS.POOL_WAITING,
    {
      description: "Requests waiting to acquire a connection",
      unit: "connections",
    },
  );

  readonly poolMax: ObservableGauge = this.observableGauge(
    DATABASE_METRICS.POOL_MAX,
    {
      description: "Maximum connections configured in the pool",
      unit: "connections",
    },
  );

  private readonly poolRemovers: Array<() => void> = [];

  constructor() {
    super(TRACER_NAMES.DATABASE);
  }

  registerPool(pool: Pool): void {
    const cbTotal = (r: ObservableResult) => r.observe(pool.totalCount);
    const cbIdle = (r: ObservableResult) => r.observe(pool.idleCount);
    const cbWaiting = (r: ObservableResult) => r.observe(pool.waitingCount);
    const cbMax = (r: ObservableResult) => r.observe(pool.options.max ?? 10);

    this.poolTotal.addCallback(cbTotal);
    this.poolIdle.addCallback(cbIdle);
    this.poolWaiting.addCallback(cbWaiting);
    this.poolMax.addCallback(cbMax);

    this.poolRemovers.push(
      () => this.poolTotal.removeCallback(cbTotal),
      () => this.poolIdle.removeCallback(cbIdle),
      () => this.poolWaiting.removeCallback(cbWaiting),
      () => this.poolMax.removeCallback(cbMax),
    );

    this.logger.log("DatabaseMetricsService: pool metrics registered");
  }

  recordQueryDuration(
    operation: string,
    model: string,
    durationS: number,
    errorType?: string,
  ): void {
    this.queryDuration.record(durationS, {
      [DATABASE_ATTRS.OPERATION]: operation,
      [DATABASE_ATTRS.MODEL]: model,
      ...(errorType && { [DATABASE_ATTRS.ERROR_TYPE]: errorType }),
    });
  }

  recordSlowQuery(operation: string, model: string): void {
    this.slowQueries.add(1, {
      [DATABASE_ATTRS.OPERATION]: operation,
      [DATABASE_ATTRS.MODEL]: model,
    });
  }

  async onModuleDestroy(): Promise<void> {
    for (const remove of this.poolRemovers) remove();
    await super.onModuleDestroy();
  }
}
