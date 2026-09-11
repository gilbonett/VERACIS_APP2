import {
  MAIL_ATTRS,
  PEER_SERVICE,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  MailMetricsService,
  MailTemplate,
} from "../services/mail-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

export interface ObserveMailOptions {
  template: MailTemplate;
}

export function ObserveMail(opts: ObserveMailOptions): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.MAIL);
    const methodName = String(propertyKey);
    const spanName = `${className} [${methodName}]`;

    descriptor.value = async function (...args: unknown[]) {
      const metrics = TelemetryRegistry.get(MailMetricsService);

      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.CLIENT,
          attributes: {
            "peer.service": PEER_SERVICE.SMTP,
            "messaging.system": "smtp",
            "messaging.operation": "send",
            [MAIL_ATTRS.TEMPLATE]: opts.template,
          },
        },
        async (span) => {
          const start = performance.now();
          try {
            const result = await original.apply(this, args);
            metrics.recordSent(
              opts.template,
              (performance.now() - start) / 1000,
            );
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            metrics.recordError(opts.template, error.name);
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttribute(MAIL_ATTRS.ERROR_TYPE, error.name);
            logger.error("✗ mail.send", {
              template: opts.template,
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
