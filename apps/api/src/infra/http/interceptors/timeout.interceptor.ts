import { EnvService } from "@/infra/env/env.service";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, throwError } from "rxjs";
import { timeout } from "rxjs/operators";
import { SKIP_TIMEOUT_KEY } from "../decorators/skip-timeout.decorator";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(
    private readonly env: EnvService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipTimeout = this.reflector.getAllAndOverride<boolean>(
      SKIP_TIMEOUT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTimeout) {
      return next.handle();
    }

    const timeoutMs = this.env.get("REQUEST_TIMEOUT_MS");

    return next.handle().pipe(
      timeout({
        each: timeoutMs,
        with: () => throwError(() => new RequestTimeoutException()),
      }),
    );
  }
}
