import { EnvService } from "@/infra/env/env.service";
import { DatabaseMetricsService } from "@/infra/telemetry/services/database-metrics.service";
import { TelemetryRegistry } from "@/infra/telemetry/telemetry-registry";
import {
  DATABASE_ATTRS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { PrismaClient } from "@generated/client";
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { PrismaPg } from "@prisma/adapter-pg";
import { traceContext } from "@prisma/sqlcommenter-trace-context";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pgPool: Pool;
  private readonly dbName: string;
  private readonly dbHost: string;

  constructor(env: EnvService) {
    const isProduction = env.get("NODE_ENV") === "production";
    const connectionString = env.get("DATABASE_URL");
    const slowQueryThresholdMs =
      env.get("DB_SLOW_QUERY_THRESHOLD_MS") ?? (isProduction ? 250 : 100);

    const pgPool = new Pool({
      connectionString,
      max: env.get("DB_POOL_MAX"),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ...(isProduction && {
        ssl: {
          ca: readFileSync(
            "/app/apps/api/certs/sa-east-1-bundle.pem",
          ).toString(),
          rejectUnauthorized: true,
        },
      }),
    });

    const adapter = new PrismaPg(pgPool);
    super({ adapter, comments: [traceContext()] });
    this.pgPool = pgPool;
    const dbUrl = new URL(connectionString);
    this.dbName = dbUrl.pathname.replace(/^\//, "");
    this.dbHost = dbUrl.hostname;
    this.applyQueryMetrics(slowQueryThresholdMs);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    TelemetryRegistry.get(DatabaseMetricsService).registerPool(this.pgPool);
    this.logger.log("Database connected");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect().catch(() => {});
    await this.pgPool.end().catch(() => {});
  }

  /**
   * Envolve `run` num span CLIENT + registra duration/slow-query/erro.
   * Compartilhado entre $allOperations (queries via model) e
   * $queryRaw/$executeRaw (client-level, fora do $allModels).
   */
  private async traceQuery<T>(
    model: string,
    operation: string,
    slowQueryThresholdMs: number,
    run: () => Promise<T>,
    batchSize?: number,
  ): Promise<T> {
    const tracer = trace.getTracer(TRACER_NAMES.DATABASE);
    const start = performance.now();
    const span = tracer.startSpan(`db.query ${model}.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        [DATABASE_ATTRS.MODEL]: model,
        [DATABASE_ATTRS.OPERATION]: operation,
        "db.system": "postgresql",
        "db.name": this.dbName,
        "peer.service": "postgresql",
        "server.address": this.dbHost,
        ...(batchSize !== undefined && {
          "db.operation.batch_size": batchSize,
        }),
      },
    });

    let caughtError: Error | undefined;

    try {
      return await context.with(trace.setSpan(context.active(), span), run);
    } catch (err) {
      caughtError = err as Error;
      span.recordException(caughtError);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: caughtError.message,
      });
      throw err;
    } finally {
      const durationMs = performance.now() - start;
      span.end();

      const dbMetrics = TelemetryRegistry.get(DatabaseMetricsService);
      dbMetrics.recordQueryDuration(
        operation,
        model,
        durationMs / 1000,
        caughtError?.name,
      );

      if (durationMs > slowQueryThresholdMs) {
        dbMetrics.recordSlowQuery(operation, model);
        this.logger.warn("Slow query detected", {
          operation,
          model,
          duration_ms: Math.round(durationMs),
          threshold_ms: slowQueryThresholdMs,
        });
      }
    }
  }

  private applyQueryMetrics(slowQueryThresholdMs: number): void {
    Object.assign(
      this,
      this.$extends({
        query: {
          $allModels: {
            $allOperations: ({ model, operation, args, query }) =>
              this.traceQuery(
                model ?? "raw",
                operation,
                slowQueryThresholdMs,
                () => query(args),
                Array.isArray((args as { data?: unknown })?.data)
                  ? ((args as { data: unknown[] }).data.length)
                  : undefined,
              ),
          },
        },
      }),
    );

    // $queryRaw/$executeRaw are client-level methods not covered by
    // $allModels.$allOperations — wrap them to emit the same span/metrics.
    for (const method of ["$queryRaw", "$executeRaw"] as const) {
      const original = (this as any)[method].bind(this);
      const op = method.slice(1); // "queryRaw" | "executeRaw"
      (this as any)[method] = (...args: unknown[]) =>
        this.traceQuery("raw", op, slowQueryThresholdMs, () =>
          original(...args),
        );
    }
  }
}
