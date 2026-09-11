import {
  PEER_SERVICE,
  REALTIME_ATTRS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { RealtimeMetricsService } from "../services/realtime-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

const REDIS_ADDRESS = process.env.REDIS_HOST ?? "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);

export interface ObserveRealtimePublishOptions {
  scope: string;
  /** Extrai o canal Redis do payload — apenas para atributo do span, não vira label de métrica. */
  channel: (...args: unknown[]) => string;
  /** Template de baixa cardinalidade do canal (ex: "notifications:{recipientId}") pro atributo semconv messaging.destination.name. */
  destinationTemplate: string;
}

export function ObserveRealtimePublish(
  opts: ObserveRealtimePublishOptions,
): MethodDecorator {
  return (target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(_key);
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.REALTIME);
    const spanName = `${className} [${methodName}]`;

    descriptor.value = function (...args: unknown[]) {
      const metrics = TelemetryRegistry.get(RealtimeMetricsService);
      const channel = opts.channel(...args);

      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.CLIENT,
          attributes: {
            "db.system": "redis",
            "db.operation": "publish",
            "peer.service": PEER_SERVICE.REDIS,
            "server.address": REDIS_ADDRESS,
            "server.port": REDIS_PORT,
            "messaging.system": "redis",
            "messaging.operation": "publish",
            // Baixa cardinalidade pro atributo semconv (o canal real, com
            // userId embutido, vai só no atributo customizado abaixo).
            "messaging.destination.name": opts.destinationTemplate,
            [REALTIME_ATTRS.SCOPE]: opts.scope,
            [REALTIME_ATTRS.CHANNEL]: channel,
          },
        },
        (span) => {
          const start = performance.now();
          try {
            const result = original.apply(this, args);
            const durationS = (performance.now() - start) / 1000;

            metrics.recordDuration(opts.scope, durationS);
            metrics.recordPublished(opts.scope);

            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            const durationS = (performance.now() - start) / 1000;
            const error = err instanceof Error ? err : new Error(String(err));
            metrics.recordDuration(opts.scope, durationS);
            metrics.recordError(opts.scope, error.name);
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttribute(REALTIME_ATTRS.ERROR_TYPE, error.name);
            logger.error(`✗ ${spanName}`, {
              channel,
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
