import {
  BUSINESS_ATTRS,
  BusinessAction,
  BusinessFlow,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  BusinessMetricsService,
  BusinessResult,
} from "../services/business-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

export interface ObserveBusinessOptions {
  flow: BusinessFlow;
  action: BusinessAction;
}

export function ObserveBusiness(opts: ObserveBusinessOptions): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const spanName = `${className} [${methodName}]`;
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.BUSINESS);

    descriptor.value = async function (...args: unknown[]) {
      const metrics = TelemetryRegistry.get(BusinessMetricsService);

      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.INTERNAL,
          attributes: {
            [BUSINESS_ATTRS.FLOW]: opts.flow,
            [BUSINESS_ATTRS.ACTION]: opts.action,
          },
        },
        async (span) => {
          const start = performance.now();
          let result: BusinessResult = "success";
          try {
            const value = await original.apply(this, args);
            span.setStatus({ code: SpanStatusCode.OK });
            return value;
          } catch (err) {
            result = "error";
            const error = err instanceof Error ? err : new Error(String(err));
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            logger.error(`✗ ${spanName}`, {
              error: error.message,
              traceId: span.spanContext().traceId,
            });
            throw err;
          } finally {
            const durationS = (performance.now() - start) / 1000;
            span.setAttribute(BUSINESS_ATTRS.RESULT, result);
            span.end();
            metrics.recordFlow(opts.flow, opts.action, result, durationS);
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
