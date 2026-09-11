import {
  GUARD_ATTRS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import {
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

export interface ObserveGuardOptions {
  name?: string; // Se não passar, usa o nome da classe
}

export function ObserveGuard(opts?: ObserveGuardOptions): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const guardName = opts?.name ?? className;
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.GUARD);
    const methodName = String(propertyKey);
    const spanName = `${className} [${methodName}]`;

    descriptor.value = async function (...args: unknown[]) {
      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.INTERNAL,
          attributes: {
            [GUARD_ATTRS.NAME]: guardName,
          },
        },
        async (span) => {
          try {
            const result = await original.apply(this, args);
            span.setStatus({ code: SpanStatusCode.OK });

            const ctx = args[0] as ExecutionContext | undefined;
            const req = ctx?.switchToHttp?.()?.getRequest?.() as
              | {
                  session?: { userId?: string; currentUserRole?: string };
                }
              | undefined;
            const userId = req?.session?.userId;

            // app.user.id no span de request é responsabilidade do
            // TelemetryInterceptor (única fonte, evita atributo duplicado
            // com chave divergente no mesmo span).
            if (userId) {
              span.setAttribute(GUARD_ATTRS.USER_ID, userId);
            }

            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            if (
              error instanceof UnauthorizedException ||
              error instanceof ForbiddenException
            ) {
              logger.warn(`✗ ${spanName}`, {
                error: error.message,
                traceId: span.spanContext().traceId,
              });
            } else {
              logger.error(`✗ ${spanName}`, {
                error: error.message,
                traceId: span.spanContext().traceId,
              });
            }
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
