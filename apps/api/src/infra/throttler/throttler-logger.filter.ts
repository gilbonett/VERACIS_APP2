import {
  RateLimitMetricsService,
  ThrottlerName,
} from "@/infra/telemetry/services/rate-limit-metrics.service";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { trace } from "@opentelemetry/api";
import { Request, Response } from "express";

@Injectable()
@Catch(ThrottlerException)
export class ThrottlerLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger("RateLimit");

  constructor(private readonly rateLimitMetrics: RateLimitMetricsService) {}

  catch(_: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const ip = req.ips?.length ? req.ips[0] : req.ip;
    const route = req.originalUrl;
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const userId = (req as any).session?.userId ?? undefined;

    const throttlerName: ThrottlerName | "unknown" =
      (req as any).throttlerName ?? "unknown";

    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId ?? "unknown";

    span?.setAttributes({
      "rate_limit.blocked": true,
      "rate_limit.throttler_name": throttlerName,
      "rate_limit.client_ip": ip,
    });
    span?.addEvent("throttled");

    this.logger.warn("blocked_by_rate_limit", {
      message: "blocked_by_rate_limit",
      "client.address": ip,
      method: req.method,
      route,
      userAgent,
      throttlerName,
      traceId,
      ...(userId ? { userId } : {}),
    });

    this.rateLimitMetrics.recordThrottled({ throttlerName, route });

    res.status(429).json({
      statusCode: 429,
      message: "Too many requests",
      error: "TOO_MANY_REQUESTS",
      timestamp: new Date().toISOString(),
      path: route,
    });
  }
}
