import { Logger } from "@nestjs/common";
import { context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { SpanConfig } from "../config/observe";
import { injectCurrentSpan } from "./current-span.decorator";

/**
 * Method decorator que abre um span para o método decorado.
 * Suporta @CurrentSpan nos parâmetros — injeta o span aberto automaticamente.
 *
 * `async: true` (default) — usa startActiveSpan + await, para métodos
 * que retornam Promise. `async: false` — não força await nem Promise
 * no retorno, para métodos síncronos (ex: HMAC).
 *
 * @example
 * // Assíncrono (default)
 * @ObserveSpan({ tracer: TRACER_NAMES.CACHE, name: "cache.get", kind: SpanKind.CLIENT })
 * async findById(id: string, @CurrentSpan() span?: Span) {
 *   span?.setAttribute("alert.id", id);
 *   return this.redis.get(`alert:${id}`);
 * }
 *
 * // Síncrono
 * @ObserveSpan({ tracer: TRACER_NAMES.CRYPTOGRAPHY, name: "cryptography.hmac", async: false })
 * generate(type: HmacTokenType): TokenOpaquePair {
 *   // retorno permanece síncrono — sem Promise
 * }
 */
export function ObserveSpan(config: SpanConfig): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const logger = new Logger(className);
    const tracer = trace.getTracer(config.tracer);
    const isAsync = config.async ?? true;

    if (isAsync) {
      descriptor.value = async function (...args: unknown[]) {
        return tracer.startActiveSpan(
          config.name,
          {
            kind: config.kind ?? SpanKind.INTERNAL,
            attributes: config.attributes ?? {},
          },
          async (span) => {
            const injectedArgs = injectCurrentSpan(
              target,
              methodName,
              args,
              span,
            );

            logger.debug(`▶ ${config.name}`, {
              traceId: span.spanContext().traceId,
              ...config.attributes,
            });

            try {
              const result = await original.apply(this, injectedArgs);
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              logger.error(`✗ ${config.name}`, {
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
    } else {
      // Versão síncrona — sem await, sem Promise no retorno.
      // Usa startSpan + context.with para parentear spans filhos corretamente.
      descriptor.value = function (...args: unknown[]) {
        const span = tracer.startSpan(config.name, {
          kind: config.kind ?? SpanKind.INTERNAL,
          attributes: config.attributes ?? {},
        });

        const injectedArgs = injectCurrentSpan(target, methodName, args, span);

        logger.debug(`▶ ${config.name}`, {
          traceId: span.spanContext().traceId,
          ...config.attributes,
        });

        try {
          const result = context.with(
            trace.setSpan(context.active(), span),
            () => original.apply(this, injectedArgs),
          );
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          logger.error(`✗ ${config.name}`, {
            error: error.message,
            traceId: span.spanContext().traceId,
          });
          throw err;
        } finally {
          span.end();
        }
      };
    }

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
