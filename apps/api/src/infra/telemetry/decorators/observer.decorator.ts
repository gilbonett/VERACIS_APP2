import { metrics } from "@opentelemetry/api";
import { MetricConfig } from "../config/observe";

/**
 * Registra duração, chamadas e erros sem abrir span.
 * Use quando o span já existe no contexto (ex: aberto pelo interceptor HTTP)
 * e você só quer adicionar métricas ao método.
 *
 * @example
 * @Observer({
 *   meter: TRACER_NAMES.CRYPTOGRAPHY,
 *   duration: CRYPTOGRAPHY_METRICS.OPERATION_DURATION,
 *   errors: CRYPTOGRAPHY_METRICS.ERROR_TOTAL,
 *   labels: { [CRYPTOGRAPHY_ATTRS.OPERATION]: "compare" },
 *   buckets: [0.1, 0.5, 1, 2, 5, 10],
 * })
 * async comparePassword(plain: string, hash: string): Promise<boolean> { ... }
 */
export function Observer(config: MetricConfig): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    const meter = metrics.getMeter(config.meter);
    const durationHist = meter.createHistogram(config.duration, {
      unit: "s",
      advice: { explicitBucketBoundaries: config.buckets },
    });
    const callCounter = config.count ? meter.createCounter(config.count) : null;
    const errorCounter = config.errors
      ? meter.createCounter(config.errors)
      : null;

    descriptor.value = async function (...args: unknown[]) {
      const start = performance.now();

      try {
        const result = await original.apply(this, args);
        const durationS = (performance.now() - start) / 1000;

        durationHist.record(durationS, { ...config.labels, status: "success" });
        callCounter?.add(1, config.labels);

        return result;
      } catch (err) {
        const durationS = (performance.now() - start) / 1000;
        const error = err instanceof Error ? err : new Error(String(err));

        durationHist.record(durationS, { ...config.labels, status: "error" });
        errorCounter?.add(1, { ...config.labels, error_type: error.name });

        throw err;
      }
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
