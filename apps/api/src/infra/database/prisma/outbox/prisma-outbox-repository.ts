import { AggregateRoot } from "@/core/entities/aggregate-root";
import { Transaction } from "@/core/repositories/transaction";
import {
  InputJsonValue,
  TransactionClient,
} from "@generated/internal/prismaNamespace";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  ClaimAndProcessOptions,
  ClaimAndProcessResult,
  ClaimedOutboxRow,
  OutboxRepository,
} from "./outbox-repository";

@Injectable()
export class PrismaOutboxRepository implements OutboxRepository {
  constructor(private prisma: PrismaService) {}

  async createMany(
    aggregates: AggregateRoot<unknown>[],
    tx?: Transaction,
  ): Promise<void> {
    const domainEvents = aggregates.flatMap(
      (aggregate) => aggregate.domainEvents,
    );

    if (domainEvents.length === 0) return;

    const client = (tx as TransactionClient) ?? this.prisma;

    await client.outbox.createMany({
      data: domainEvents.map((event) => ({
        eventName: event.getName(),
        payload: event.payload as InputJsonValue,
        ocurredAt: event.ocurredAt,
        aggregateId: event.getAggregateId().toString(),
      })),
    });
  }

  async create(
    aggregate: AggregateRoot<unknown>,
    tx?: Transaction,
  ): Promise<void> {
    if (aggregate.domainEvents.length === 0) return;

    const client = (tx as TransactionClient) ?? this.prisma;

    await client.outbox.createMany({
      data: aggregate.domainEvents.map((event) => ({
        eventName: event.getName(),
        payload: event.payload as InputJsonValue,
        ocurredAt: event.ocurredAt,
        aggregateId: event.getAggregateId().toString(),
      })),
    });
  }

  async markProcessed(outboxId: string): Promise<void> {
    await this.prisma.outbox.update({
      where: { id: outboxId },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  }

  async markFailed(outboxId: string, error: string): Promise<void> {
    await this.prisma.outbox.update({
      where: { id: outboxId },
      data: { status: "FAILED", error, attempts: { increment: 1 } },
    });
  }

  async claimAndProcess(
    { limit, staleMs, maxAttempts }: ClaimAndProcessOptions,
    handle: (row: ClaimedOutboxRow) => Promise<void>,
  ): Promise<ClaimAndProcessResult> {
    const staleBefore = new Date(Date.now() - staleMs);

    return this.prisma.$transaction(
      async (tx) => {
        const rows = await this.selectClaimable(tx, {
          staleBefore,
          maxAttempts,
          limit,
        });

        const result: ClaimAndProcessResult = { processed: 0, failed: 0 };

        for (const row of rows) {
          const outcome = await this.processRow(tx, row, handle);
          result[outcome]++;
        }

        return result;
      },
      { timeout: 15_000 },
    );
  }

  private async selectClaimable(
    tx: TransactionClient,
    {
      staleBefore,
      maxAttempts,
      limit,
    }: { staleBefore: Date; maxAttempts: number; limit: number },
  ): Promise<ClaimedOutboxRow[]> {
    const rows = await tx.$queryRaw<
      { id: string; event_name: string; payload: unknown }[]
    >`
      SELECT id, event_name, payload FROM outbox
      WHERE (status = 'PENDING' AND created_at < ${staleBefore})
         OR (status = 'FAILED' AND attempts < ${maxAttempts})
      ORDER BY created_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    return rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      payload: row.payload,
    }));
  }

  private async processRow(
    tx: TransactionClient,
    row: ClaimedOutboxRow,
    handle: (row: ClaimedOutboxRow) => Promise<void>,
  ): Promise<"processed" | "failed"> {
    try {
      await handle(row);
      await tx.outbox.update({
        where: { id: row.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      return "processed";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await tx.outbox.update({
        where: { id: row.id },
        data: { status: "FAILED", error: message, attempts: { increment: 1 } },
      });
      return "failed";
    }
  }
}
