import {
  CRYPTOGRAPHY_ATTRS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  CryptographyMetricsService,
  CryptographyOperation,
} from "../services/cryptography-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

export interface ObserveCryptographyOptions {
  operation: CryptographyOperation;
  /** `false` para métodos síncronos (ex: HMAC) — não força Promise no retorno. Default: `true`. */
  async?: boolean;
}

/**
 * Instrumenta operações de criptografia (hash, compare, hmac) com
 * span + métrica (duration/error) juntos.
 *
 * @example
 * // Assíncrono (default) — bcrypt
 * @ObserveCryptography({ operation: "hash" })
 * hash(plain: string): Promise<string> {
 *   return bcryptHash(plain, this.HASH_SALT_LENGTH);
 * }
 *
 * @example
 * // Síncrono — HMAC
 * @ObserveCryptography({ operation: "hmac", async: false })
 * generate(type: HmacTokenType): TokenOpaquePair { ... }
 */
export function ObserveCryptography(
  opts: ObserveCryptographyOptions,
): MethodDecorator {
  return (target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(_key);
    const isAsync = opts.async ?? true;

    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.CRYPTOGRAPHY);
    const spanName = `${className} [${methodName}]`;

    if (isAsync) {
      descriptor.value = async function (...args: unknown[]) {
        const metrics = TelemetryRegistry.get(CryptographyMetricsService);

        return tracer.startActiveSpan(
          spanName,
          {
            kind: SpanKind.INTERNAL,
            attributes: {
              [CRYPTOGRAPHY_ATTRS.OPERATION]: opts.operation,
            },
          },
          async (span) => {
            const start = performance.now();

            try {
              const result = await original.apply(this, args);
              const durationS = (performance.now() - start) / 1000;

              metrics.recordDuration(opts.operation, durationS);
              span.setStatus({ code: SpanStatusCode.OK });

              return result;
            } catch (err) {
              const durationS = (performance.now() - start) / 1000;
              const error =
                err instanceof Error ? err : new Error(String(err));

              metrics.recordDuration(opts.operation, durationS);
              metrics.recordError(opts.operation, error.name);

              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              span.setAttribute(CRYPTOGRAPHY_ATTRS.ERROR_TYPE, error.name);

              logger.error(`✗ ${spanName}`, {
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
      descriptor.value = function (...args: unknown[]) {
        const metrics = TelemetryRegistry.get(CryptographyMetricsService);

        return tracer.startActiveSpan(
          spanName,
          {
            kind: SpanKind.INTERNAL,
            attributes: {
              [CRYPTOGRAPHY_ATTRS.OPERATION]: opts.operation,
            },
          },
          (span) => {
            const start = performance.now();

            try {
              const result = original.apply(this, args);
              const durationS = (performance.now() - start) / 1000;

              metrics.recordDuration(opts.operation, durationS);
              span.setStatus({ code: SpanStatusCode.OK });

              return result;
            } catch (err) {
              const durationS = (performance.now() - start) / 1000;
              const error =
                err instanceof Error ? err : new Error(String(err));

              metrics.recordDuration(opts.operation, durationS);
              metrics.recordError(opts.operation, error.name);

              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              span.setAttribute(CRYPTOGRAPHY_ATTRS.ERROR_TYPE, error.name);

              logger.error(`✗ ${spanName}`, {
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
