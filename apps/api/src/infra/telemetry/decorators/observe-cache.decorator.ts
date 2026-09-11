import "dotenv/config";

import { envSchema } from "@/infra/env/env";
import {
  CACHE_ATTRS,
  PEER_SERVICE,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  CacheMetricsService,
  CacheOperation,
} from "../services/cache-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

const env = envSchema.parse(process.env);

const REDIS_ADDRESS = env.REDIS_HOST ?? "127.0.0.1";
const REDIS_PORT = env.REDIS_PORT ?? 6379;

export interface ObserveCacheOptions {
  operation: CacheOperation;
  keyPrefix: string;
  isHit?: (result: unknown) => boolean;
}

export function ObserveCache(opts: ObserveCacheOptions): MethodDecorator {
  return (target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(_key);
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.CACHE);
    const spanName = `${className} [${methodName}]`;

    descriptor.value = async function (...args: unknown[]) {
      const metrics = TelemetryRegistry.get(CacheMetricsService);

      // CLIENT: sem IORedisInstrumentation (removido — instrumentação
      // manual cobre o Redis), este é o ÚNICO span que representa o hop
      // real de rede pro Redis. peer.service/db.system alimentam o nó
      // "redis" no node/service graph do Tempo.
      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.CLIENT,
          attributes: {
            "peer.service": PEER_SERVICE.REDIS,
            "db.system": "redis",
            "db.operation": opts.operation,
            "server.address": REDIS_ADDRESS,
            "server.port": REDIS_PORT,
            [CACHE_ATTRS.OPERATION]: opts.operation,
            [CACHE_ATTRS.KEY_PREFIX]: opts.keyPrefix,
          },
        },
        async (span) => {
          const start = performance.now();
          try {
            const result = await original.apply(this, args);
            const durationS = (performance.now() - start) / 1000;

            metrics.recordDuration(opts.operation, durationS, opts.keyPrefix);

            if (opts.operation === "get") {
              const isHitFn =
                opts.isHit ?? ((r) => r !== null && r !== undefined);
              const hit = isHitFn(result);
              hit
                ? metrics.recordHit(opts.keyPrefix)
                : metrics.recordMiss(opts.keyPrefix);
              span.setAttribute(CACHE_ATTRS.HIT, hit);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            const durationS = (performance.now() - start) / 1000;
            const error = err instanceof Error ? err : new Error(String(err));
            metrics.recordDuration(opts.operation, durationS, opts.keyPrefix);
            metrics.recordError(opts.operation, error.name, opts.keyPrefix);
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttribute(CACHE_ATTRS.ERROR_TYPE, error.name);
            logger.error(`✗ ${spanName}`, {
              keyPrefix: opts.keyPrefix,
              error: error.message,
              traceId: span.spanContext().traceId,
            });
            throw err;
          } finally {
            span.end();
          }
        },
      );
    };

    Reflect.getMetadataKeys(original).forEach((key) => {
      Reflect.defineMetadata(
        key,
        Reflect.getMetadata(key, original),
        descriptor.value,
      );
    });
    return descriptor;
  };
}
