import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { RedisService } from "@/infra/redis/redis.service";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HealthIndicatorService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../http/decorators/public.decorator";
import { SWAGGER_TAGS } from "../swagger/swagger-tags";

const BYTES_PER_MB = 1024 * 1024;
const HEAP_LIMIT_MB = 450;
const FAILED_JOBS_THRESHOLD = 100; // ajuste conforme o volume normal de cada fila

@Public()
@ApiTags(SWAGGER_TAGS.HEALTH)
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    // @InjectQueue(QUEUE_NAMES.MAIL)
    // private readonly mailQueue: Queue,
    // @InjectQueue(QUEUE_NAMES.ALERT_PENDING_EXPIRATION)
    // private readonly alertPendingQueue: Queue,
    // @InjectQueue(QUEUE_NAMES.ALERT_ACCEPTED_EXPIRATION)
    // private readonly alertAcceptedQueue: Queue,
  ) {}

  @SkipThrottle()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck("database", this.prisma),
      () => this.checkRedis(),
      // () => this.checkQueues(),
      // Heap V8 — não reflete RSS total do processo (ver memory_details)
      () =>
        this.memoryIndicator.checkHeap("memory", HEAP_LIMIT_MB * BYTES_PER_MB),
      // Diagnóstico: nunca falha, só expõe os números pra investigação de RSS
      () => this.checkMemoryDetails(),
    ]);
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const check = this.indicator.check("redis");
    try {
      const pong = await this.redis.ping();
      return pong === "PONG"
        ? check.up()
        : check.down({ reason: "ping_failed" });
    } catch (error) {
      return check.down({
        reason: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  // private async checkQueues(): Promise<HealthIndicatorResult> {
  //   const queues = [
  //     { name: QUEUE_NAMES.MAIL, queue: this.mailQueue },
  //     {
  //       name: QUEUE_NAMES.ALERT_PENDING_EXPIRATION,
  //       queue: this.alertPendingQueue,
  //     },
  //     {
  //       name: QUEUE_NAMES.ALERT_ACCEPTED_EXPIRATION,
  //       queue: this.alertAcceptedQueue,
  //     },
  //   ];

  //   const results = await Promise.allSettled(
  //     queues.map(({ queue }) =>
  //       queue.getJobCounts("waiting", "active", "failed"),
  //     ),
  //   );

  //   const details: Record<string, unknown> = {};
  //   let allHealthy = true;

  //   for (let i = 0; i < queues.length; i++) {
  //     const result = results[i];
  //     const queueName = queues[i].name;

  //     if (result.status === "rejected") {
  //       allHealthy = false;
  //       details[queueName] = {
  //         status: "down",
  //         reason: result.reason?.message ?? "unknown_error",
  //       };
  //       continue;
  //     }

  //     const counts = result.value;
  //     const tooManyFailed = (counts.failed ?? 0) > FAILED_JOBS_THRESHOLD;
  //     if (tooManyFailed) allHealthy = false;

  //     details[queueName] = {
  //       status: tooManyFailed ? "down" : "up",
  //       ...counts,
  //     };
  //   }

  //   const check = this.indicator.check("queues");
  //   return allHealthy ? check.up(details) : check.down(details);
  // }

  // Nunca derruba o health — apenas expõe a quebra real de memória pra
  // diferenciar leak de heap (JS) de crescimento de RSS fora do heap V8
  // (allocator nativo do musl/Alpine, buffers do Prisma/ioredis, etc).
  private checkMemoryDetails(): HealthIndicatorResult {
    const usage = process.memoryUsage();
    const toMB = (bytes: number) => Math.round(bytes / BYTES_PER_MB);

    const check = this.indicator.check("memory_details");
    return check.up({
      rss: `${toMB(usage.rss)}MB`,
      heapUsed: `${toMB(usage.heapUsed)}MB`,
      heapTotal: `${toMB(usage.heapTotal)}MB`,
      external: `${toMB(usage.external)}MB`,
      arrayBuffers: `${toMB(usage.arrayBuffers)}MB`,
    });
  }
}
