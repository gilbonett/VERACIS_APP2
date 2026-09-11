import { AggregateRoot } from "@/core/entities/aggregate-root";
import {
  PEER_SERVICE,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { EventsMetricsService } from "../services/events-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

const logger = new Logger("ObserveDispatchEvents");

interface ObserveDispatchEventProps {
  name?: string;
}
/**
 * Abre UM span guarda-chuva, nomeado com o próprio nome do método
 * decorado (ex: "dispatchEventsForAggregate"). Qualquer span aberto
 * dentro dele — incluindo os abertos por @ObserveEvent nos handlers —
 * fica automaticamente aninhado como filho.
 *
 * Não precisa de nenhuma opção — funciona em qualquer repository,
 * qualquer domínio, sem repetir nome manualmente.
 *
 * @example
 * @ObserveDispatchEvent()
 * dispatchEventsForAggregate(aggregate: AggregateRoot<unknown>): void {
 *   DomainEvents.dispatchEventsForAggregate(aggregate.id);
 * }
 */
export function ObserveDispatchEvent({
  name,
}: ObserveDispatchEventProps = {}): MethodDecorator {
  return (_target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const spanName = String(propertyKey);
    const tracer = trace.getTracer(TRACER_NAMES.EVENTS);

    const resolvedName = name ?? spanName;

    descriptor.value = function (aggregate: AggregateRoot<unknown>) {
      const eventNames = aggregate.domainEvents.map((e) => e.constructor.name);

      if (eventNames.length === 0) {
        return original.call(this, aggregate);
      }

      const metrics = TelemetryRegistry.get(EventsMetricsService);

      return tracer.startActiveSpan(
        resolvedName,
        {
          kind: SpanKind.PRODUCER,
          attributes: {
            "peer.service": PEER_SERVICE.DOMAIN_EVENTS,
            "messaging.system": "domain-events",
            "messaging.operation": "publish",
            "domain_event.aggregate_id": aggregate.id.toString(),
            "domain_event.names": eventNames.join(","),
            "domain_event.count": eventNames.length,
          },
        },
        (span) => {
          const traceId = span.spanContext().traceId;

          try {
            // original() roda DENTRO deste contexto — subscribers
            // disparados aqui dentro (via @ObserveEvent) ficam
            // automaticamente aninhados como filhos deste span.
            const result = original.call(this, aggregate);

            for (const eventName of eventNames) {
              metrics.recordPublished(eventName);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));

            for (const eventName of eventNames) {
              metrics.recordError(eventName, error.name);
            }

            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });

            logger.error(`✗ ${resolvedName}`, {
              aggregateId: aggregate.id.toString(),
              events: eventNames,
              error: error.message,
              traceId,
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
