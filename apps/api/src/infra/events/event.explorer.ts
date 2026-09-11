import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { EventHandlerRegistry } from "./event-handler-registry";
import { PgListenService } from "./pg-listen";
import { EventDispatcher } from "./shared";

/** Liga o registro de handlers aos canais pg-listen no boot da aplicação. */
@Injectable()
export class EventExplorer implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventExplorer.name);

  constructor(
    private registry: EventHandlerRegistry,
    private pgListenService: PgListenService,
    private dispatcher: EventDispatcher,
  ) {}

  async onApplicationBootstrap() {
    this.registry.discover();

    for (const eventName of this.registry.getEventNames()) {
      await this.pgListenService.listener(eventName);

      this.pgListenService.onNotification<
        Record<string, unknown> & { outboxId: string }
      >(eventName, ({ outboxId, ...payload }) =>
        this.dispatch(eventName, outboxId, payload),
      );

      this.logger.log(`Escutando eventos de outbox no canal "${eventName}"`);
    }
  }

  private async dispatch(
    eventName: string,
    outboxId: string,
    payload: unknown,
  ): Promise<void> {
    const handlers = this.registry.getHandlers(eventName);
    if (!handlers?.length) return;

    await this.dispatcher.dispatch(eventName, outboxId, payload, handlers);
  }
}
