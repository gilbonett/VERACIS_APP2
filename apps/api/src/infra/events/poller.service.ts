import { OutboxRepository } from "@/infra/database/prisma/outbox/outbox-repository";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventHandlerRegistry } from "./event-handler-registry";
import {
  POLLER_BATCH_SIZE,
  POLLER_MAX_ATTEMPTS,
  POLLER_STALE_AFTER_MS,
} from "./poller.constants";
import { EventDispatcher } from "./shared";

@Injectable()
export class PollerService {
  private readonly logger = new Logger(PollerService.name);

  constructor(
    private outboxRepository: OutboxRepository,
    private handlerRegistry: EventHandlerRegistry,
    private eventDispatcher: EventDispatcher,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async poll() {
    const { processed, failed } = await this.outboxRepository.claimAndProcess(
      {
        limit: POLLER_BATCH_SIZE,
        staleMs: POLLER_STALE_AFTER_MS,
        maxAttempts: POLLER_MAX_ATTEMPTS,
      },
      async (row) => {
        const handlers = this.handlerRegistry.getHandlers(row.eventName);
        if (!handlers?.length) {
          throw new Error(`Nenhum handler registrado para "${row.eventName}"`);
        }

        await this.eventDispatcher.runHandlers(handlers, row.id, row.payload);
      },
    );

    if (processed > 0 || failed > 0) {
      this.logger.warn(
        `Reprocessamento: ${processed} evento(s) recuperado(s), ${failed} falha(s)`,
      );
    }
  }
}
