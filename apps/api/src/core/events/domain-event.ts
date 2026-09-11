import { UniqueEntityID } from "../entities/unique-entity-id";

type TPayload = Record<string, UniqueEntityID | string | number | boolean>;

export interface DomainEvent<T = TPayload> {
  ocurredAt: Date;
  payload: T;
  getAggregateId(): UniqueEntityID;
  getName(): string;
}
