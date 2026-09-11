import {
  EVENTS_ATTRS,
  PEER_SERVICE,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import {
  Attributes,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { EventsMetricsService } from "../services/events-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

export interface ObserveEventOptions {
  /** Nome do domain event que disparou este handler — ex: "AlertCreatedEvent" */
  name: string;
  /** Atributos extras derivados do próprio evento — ex: tamanho de um lote. */
  attributes?: (event: any) => Attributes;
}

/**
 * Instrumenta handlers de domain event (pub/sub).
 * Nome do span: "PubEvent -> SubscriberName" — ex:
 * "AlertCreatedEvent -> OnAlertCreatedScheduleExpiration".
 * O nome do subscriber é capturado automaticamente da classe.
 *
 * @example
 * @ObserveEvent({ name: "AlertCreatedEvent" })
 * private async handle(event: AlertCreatedEvent) { ... }
 */
export function ObserveEvent(opts: ObserveEventOptions): MethodDecorator {
  return (target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const spanName = className;
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.EVENTS);

    descriptor.value = async function (...args: unknown[]) {
      const metrics = TelemetryRegistry.get(EventsMetricsService);

      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.CONSUMER,
          attributes: {
            "peer.service": PEER_SERVICE.DOMAIN_EVENTS,
            "messaging.system": "domain-events",
            "messaging.operation": "process",
            [EVENTS_ATTRS.TOPIC]: opts.name,
            [EVENTS_ATTRS.HANDLER]: className,

            ...opts.attributes?.(args[0]),
          },
        },
        async (span) => {
          const start = performance.now();
          logger.log(`▶ ${spanName}`, {
            handler: className,
            traceId: span.spanContext().traceId,
          });
          try {
            const result = await original.apply(this, args);
            metrics.recordConsumed(
              opts.name,
              (performance.now() - start) / 1000,
            );
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            metrics.recordError(opts.name, error.name);
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttribute(EVENTS_ATTRS.ERROR_TYPE, error.name);
            logger.error(`✗ ${spanName}`, {
              handler: className,
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
