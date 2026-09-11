import {
  STORAGE_ATTRS,
  STORAGE_METRICS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Injectable } from "@nestjs/common";
import { Counter, Histogram } from "@opentelemetry/api";
import { MetricsService } from "./metrics.service";

export type StorageOperation = "upload" | "get_file" | "delete";

@Injectable()
export class StorageMetricsService extends MetricsService {
  readonly operationDuration: Histogram = this.histogram(
    STORAGE_METRICS.OPERATION_DURATION,
    {
      description: "Duration of S3 storage operations in seconds",
      unit: "s",
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
    },
  );

  readonly operationSize: Histogram = this.histogram(
    STORAGE_METRICS.OPERATION_SIZE_BYTES,
    {
      description: "Size of objects transferred in S3 operations",
      unit: "bytes",
      buckets: [
        1_024, 10_240, 102_400, 512_000, 1_048_576, 5_242_880, 10_485_760,
        52_428_800, 104_857_600,
      ],
    },
  );

  readonly errors: Counter = this.counter(STORAGE_METRICS.ERROR_TOTAL, {
    description: "Total storage operation errors",
  });

  constructor() {
    super(TRACER_NAMES.STORAGE);
  }

  recordDuration(
    operation: StorageOperation,
    durationS: number,
    fileType: string,
  ): void {
    this.operationDuration.record(durationS, {
      [STORAGE_ATTRS.OPERATION]: operation,
      [STORAGE_ATTRS.FILE_TYPE]: fileType,
    });
  }

  recordSize(
    operation: StorageOperation,
    fileType: string,
    bytes: number,
  ): void {
    this.operationSize.record(bytes, {
      [STORAGE_ATTRS.OPERATION]: operation,
      [STORAGE_ATTRS.FILE_TYPE]: fileType,
    });
  }

  recordError(operation: StorageOperation, errorType: string): void {
    this.errors.add(1, {
      [STORAGE_ATTRS.OPERATION]: operation,
      [STORAGE_ATTRS.ERROR_TYPE]: errorType,
    });
  }
}
