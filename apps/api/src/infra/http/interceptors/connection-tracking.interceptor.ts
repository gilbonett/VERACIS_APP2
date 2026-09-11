import { ConnectionRegistry } from "@/infra/realtime/presence/connection-registry";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { finalize, Observable } from "rxjs";
import { AuthenticatedRequest } from "../guards/session-guard";
import { TRACK_CONNECTION_KEY } from "../decorators/track-connection.decorator";

@Injectable()
export class ConnectionTrackingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly connectionRegistry: ConnectionRegistry,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const channel = this.reflector.get<string | undefined>(
      TRACK_CONNECTION_KEY,
      context.getHandler(),
    );

    if (!channel) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.session.userId;

    this.connectionRegistry.register(channel, userId);

    return next
      .handle()
      .pipe(finalize(() => this.connectionRegistry.unregister(channel, userId)));
  }
}
