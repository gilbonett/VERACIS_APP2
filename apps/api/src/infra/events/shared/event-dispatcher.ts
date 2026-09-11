import { OutboxRepository } from "@/infra/database/prisma/outbox/outbox-repository";
import { Injectable, Logger } from "@nestjs/common";
import { EventHandler } from "./event-handler.type";

@Injectable()
export class EventDispatcher {
  private readonly logger = new Logger(EventDispatcher.name);

  constructor(private outboxRepository: OutboxRepository) {}

  async runHandlers(
    handlers: EventHandler[],
    outboxId: string,
    payload: unknown,
  ): Promise<void> {
    const results = await Promise.allSettled(
      handlers.map((handler) => handler({ payload }, outboxId)),
    );
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (!failure) return;

    throw failure.reason instanceof Error
      ? failure.reason
      : new Error(String(failure.reason));
  }

  async dispatch(
    eventName: string,
    outboxId: string,
    payload: unknown,
    handlers: EventHandler[],
  ): Promise<void> {
    try {
      await this.runHandlers(handlers, outboxId, payload);
      await this.outboxRepository.markProcessed(outboxId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Falha ao processar outbox ${outboxId} (${eventName})`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.outboxRepository.markFailed(outboxId, message);
    }
  }
}
