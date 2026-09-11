import { HTTP_ATTRS } from "@/shared/constants/telemetry.constants";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { HttpMetricsService } from "./services/http-metrics.service";

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(private readonly httpMetrics: HttpMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const span = trace.getActiveSpan();
    const startMs = performance.now();

    const route = request.route?.path ?? request.routerPath ?? "unknown";
    const method = request.method;
    const requestId = request.id ?? request.headers["x-request-id"];

    if (span) {
      span.setAttributes({
        [HTTP_ATTRS.ROUTE]: route,
        [HTTP_ATTRS.METHOD]: method,
        [HTTP_ATTRS.REQUEST_ID]: requestId,
        [HTTP_ATTRS.CONTROLLER]: context.getClass().name,
        [HTTP_ATTRS.HANDLER]: context.getHandler().name,
        "client.address": request.ip ?? "",
      });
    }

    this.httpMetrics.requestStarted({ route, method });

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const durationS = (performance.now() - startMs) / 1000;

        span?.setAttributes({
          [HTTP_ATTRS.STATUS_CODE]: statusCode,
          [HTTP_ATTRS.USER_ID]: request.session?.userId ?? "anonymous",
        });
        span?.setStatus({ code: SpanStatusCode.OK });

        this.httpMetrics.requestFinished(
          { route, method, statusCode },
          durationS,
        );
      }),
      catchError((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        const statusCode = response.statusCode ?? 500;
        const durationS = (performance.now() - startMs) / 1000;

        span?.setAttributes({
          [HTTP_ATTRS.STATUS_CODE]: statusCode,
          [HTTP_ATTRS.USER_ID]: request.session?.userId ?? "anonymous",
        });
        span?.recordException(err);
        span?.setStatus({ code: SpanStatusCode.ERROR, message: err.message });

        this.httpMetrics.requestFinished(
          { route, method, statusCode },
          durationS,
        );
        throw error;
      }),
    );
  }
}
