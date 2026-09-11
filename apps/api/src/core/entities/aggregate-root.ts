import { DomainEvent } from "../events/domain-event";
import { Entity } from "./entity";

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent<unknown>[] = [];

  get domainEvents(): DomainEvent<unknown>[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: DomainEvent<unknown>): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents() {
    this._domainEvents = [];
  }
}
