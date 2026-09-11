import {
  PEER_SERVICE,
  STORAGE_ATTRS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  StorageMetricsService,
  StorageOperation,
} from "../services/storage-metrics.service";
import { TelemetryRegistry } from "../telemetry-registry";

type DynamicOrStatic =
  | string
  | ((args: unknown[], instance: unknown) => string);

export interface ObserveStorageOptions {
  operation: StorageOperation;
  bucket: DynamicOrStatic;
  fileType: DynamicOrStatic;
  /** Extrai o tamanho em bytes do payload transferido — recebe args e o retorno do método. */
  size?: (args: unknown[], result: unknown) => number;
  /** Host real do backend (S3 real em prod, MinIO em dev) — default "s3.amazonaws.com". */
  serverAddress?: DynamicOrStatic;
}

const RPC_METHOD: Record<StorageOperation, string> = {
  upload: "PutObject",
  get_file: "GetObject",
  delete: "DeleteObject",
};

function resolve(
  value: DynamicOrStatic,
  args: unknown[],
  instance: unknown,
): string {
  return typeof value === "function" ? value(args, instance) : value;
}

export function ObserveStorage(opts: ObserveStorageOptions): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.STORAGE);
    const spanName = `${className} [${methodName}]`;

    descriptor.value = async function (...args: unknown[]) {
      const metrics = TelemetryRegistry.get(StorageMetricsService);
      const bucket = resolve(opts.bucket, args, this);
      const fileType = resolve(opts.fileType, args, this);
      const serverAddress = resolve(
        opts.serverAddress ?? "s3.amazonaws.com",
        args,
        this,
      );

      return tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.CLIENT,
          attributes: {
            "peer.service": PEER_SERVICE.S3,
            "rpc.system": "aws-api",
            "rpc.service": "S3",
            "rpc.method": RPC_METHOD[opts.operation],
            "server.address": serverAddress,
            [STORAGE_ATTRS.OPERATION]: opts.operation,
            [STORAGE_ATTRS.BUCKET]: bucket,
            [STORAGE_ATTRS.FILE_TYPE]: fileType,
          },
        },
        async (span) => {
          const start = performance.now();
          try {
            const result = await original.apply(this, args);
            metrics.recordDuration(
              opts.operation,
              (performance.now() - start) / 1000,
              fileType,
            );
            if (opts.size) {
              metrics.recordSize(
                opts.operation,
                fileType,
                opts.size(args, result),
              );
            }
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            const durationS = (performance.now() - start) / 1000;
            const error = err instanceof Error ? err : new Error(String(err));
            metrics.recordDuration(opts.operation, durationS, fileType);
            metrics.recordError(opts.operation, error.name);
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttribute(STORAGE_ATTRS.ERROR_TYPE, error.name);
            logger.error(`✗ ${spanName}`, {
              bucket,
              fileType,
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
