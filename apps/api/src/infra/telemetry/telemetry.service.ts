import { TRACER_NAMES } from "@/shared/constants/telemetry.constants";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Meter, metrics, trace, Tracer } from "@opentelemetry/api";

type TracerName = (typeof TRACER_NAMES)[keyof typeof TRACER_NAMES];

@Injectable()
export class TelemetryService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);

  getTracer(name: TracerName): Tracer {
    return trace.getTracer(name);
  }

  getMeter(name: TracerName): Meter {
    return metrics.getMeter(name);
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log("TelemetryService: module destroyed, SDK shutdown pending");
  }
}
