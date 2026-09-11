import { AggregateRoot } from "@/core/entities/aggregate-root";
import { Transaction } from "@/core/repositories/transaction";

export interface ClaimedOutboxRow {
  id: string;
  eventName: string;
  payload: unknown;
}

export interface ClaimAndProcessOptions {
  limit: number;
  staleMs: number;
  maxAttempts: number;
}

export interface ClaimAndProcessResult {
  processed: number;
  failed: number;
}

export abstract class OutboxRepository {
  abstract create(
    aggregate: AggregateRoot<unknown>,
    tx?: Transaction,
  ): Promise<void>;
  abstract createMany(
    aggregates: AggregateRoot<unknown>[],
    tx?: Transaction,
  ): Promise<void>;
  abstract markProcessed(outboxId: string): Promise<void>;
  abstract markFailed(outboxId: string, error: string): Promise<void>;
  abstract claimAndProcess(
    options: ClaimAndProcessOptions,
    handle: (row: ClaimedOutboxRow) => Promise<void>,
  ): Promise<ClaimAndProcessResult>;
}
