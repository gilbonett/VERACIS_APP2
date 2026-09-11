// import { QUEUE_NAMES } from "@/infra/queue/queue.constants";
import { Global, Module, OnModuleInit } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { BusinessMetricsService } from "./services/business-metrics.service";
import { CacheMetricsService } from "./services/cache-metrics.service";
import { CryptographyMetricsService } from "./services/cryptography-metrics.service";
import { DatabaseMetricsService } from "./services/database-metrics.service";
import { EventsMetricsService } from "./services/events-metrics.service";
import { HttpMetricsService } from "./services/http-metrics.service";
import { MailMetricsService } from "./services/mail-metrics.service";
import { RateLimitMetricsService } from "./services/rate-limit-metrics.service";
import { RealtimeMetricsService } from "./services/realtime-metrics.service";
import { StorageMetricsService } from "./services/storage-metrics.service";
import { TelemetryInterceptor } from "./telemetry-interceptor";
import { TelemetryRegistry } from "./telemetry-registry";
import { TelemetryService } from "./telemetry.service";

@Global()
@Module({
  imports: [
    // BullModule.registerQueue(
    //   { name: QUEUE_NAMES.MAIL },
    //   { name: QUEUE_NAMES.MAIL_DLQ },
    //   { name: QUEUE_NAMES.ALERT_PENDING_EXPIRATION },
    //   { name: QUEUE_NAMES.ALERT_PENDING_EXPIRATION_DLQ },
    //   { name: QUEUE_NAMES.ALERT_ACCEPTED_EXPIRATION },
    //   { name: QUEUE_NAMES.ALERT_ACCEPTED_EXPIRATION_DLQ },
    // ),
  ],
  providers: [
    TelemetryService,
    TelemetryInterceptor,
    CacheMetricsService,
    DatabaseMetricsService,
    // QueueMetricsService,
    MailMetricsService,
    StorageMetricsService,
    HttpMetricsService,
    BusinessMetricsService,
    EventsMetricsService,
    CryptographyMetricsService,
    RateLimitMetricsService,
    RealtimeMetricsService,

    // Factories
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
  exports: [
    TelemetryService,
    TelemetryInterceptor,
    CacheMetricsService,
    DatabaseMetricsService,
    // QueueMetricsService,
    MailMetricsService,
    StorageMetricsService,
    HttpMetricsService,
    BusinessMetricsService,
    EventsMetricsService,
    CryptographyMetricsService,
    RateLimitMetricsService,
    RealtimeMetricsService,
  ],
})
export class TelemetryModule implements OnModuleInit {
  constructor(
    private readonly cacheMetrics: CacheMetricsService,
    private readonly databaseMetrics: DatabaseMetricsService,
    // private readonly queueMetrics: QueueMetricsService,
    private readonly mailMetrics: MailMetricsService,
    private readonly storageMetrics: StorageMetricsService,
    private readonly httpMetrics: HttpMetricsService,
    private readonly businessMetrics: BusinessMetricsService,
    private readonly eventsMetrics: EventsMetricsService,
    private readonly cryptographyMetrics: CryptographyMetricsService,
    private readonly rateLimitMetrics: RateLimitMetricsService,
    private readonly realtimeMetrics: RealtimeMetricsService,
  ) {}

  onModuleInit(): void {
    TelemetryRegistry.register(CacheMetricsService, this.cacheMetrics);
    TelemetryRegistry.register(DatabaseMetricsService, this.databaseMetrics);
    // TelemetryRegistry.register(QueueMetricsService, this.queueMetrics);
    TelemetryRegistry.register(MailMetricsService, this.mailMetrics);
    TelemetryRegistry.register(StorageMetricsService, this.storageMetrics);
    TelemetryRegistry.register(HttpMetricsService, this.httpMetrics);
    TelemetryRegistry.register(
      CryptographyMetricsService,
      this.cryptographyMetrics,
    );
    TelemetryRegistry.register(BusinessMetricsService, this.businessMetrics);
    TelemetryRegistry.register(EventsMetricsService, this.eventsMetrics);
    TelemetryRegistry.register(RateLimitMetricsService, this.rateLimitMetrics);
    TelemetryRegistry.register(RealtimeMetricsService, this.realtimeMetrics);
  }
}
