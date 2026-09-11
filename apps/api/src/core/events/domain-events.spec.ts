import { vi } from "vitest";

import { DomainEvents } from "@/core/events/domain-events";

import { AggregateRoot } from "../entities/aggregate-root";
import { UniqueEntityID } from "../entities/unique-entity-id";
import { DomainEvent } from "../events/domain-event";

class CustomAggregateCreated implements DomainEvent<{ aggregateId: string }> {
  static readonly EVENT_NAME = "CustomAggregateCreated";

  public ocurredAt: Date;
  public payload: { aggregateId: string };
  private aggregate: CustomAggregate;

  constructor(aggregate: CustomAggregate) {
    this.aggregate = aggregate;
    this.ocurredAt = new Date();
    this.payload = { aggregateId: aggregate.id.toString() };
  }

  public getName(): string {
    return CustomAggregateCreated.EVENT_NAME;
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregate.id;
  }
}

class CustomAggregate extends AggregateRoot<null> {
  static create() {
    const aggregate = new CustomAggregate(null);

    aggregate.addDomainEvent(new CustomAggregateCreated(aggregate));

    return aggregate;
  }
}

describe("domain events", () => {
  it("should be able to dispatch and listen to events", async () => {
    const callbackSpy = vi.fn();

    // Subscriber cadastrado (ouvindo o evento de "resposta criada")
    DomainEvents.register(callbackSpy, CustomAggregateCreated.name);

    // Estou criando uma resposta porém SEM salvar no banco
    const aggregate = CustomAggregate.create();

    // Estou assegurando que o evento foi criado porém NÃO foi disparado
    expect(aggregate.domainEvents).toHaveLength(1);

    // Estou salvando a resposta no banco de dados e assim disparando o evento
    DomainEvents.dispatchEventsForAggregate(aggregate.id);

    // O subscriber ouve o evento e faz o que precisa ser feito com o dado
    // expect(callbackSpy).toHaveBeenCalled();

    // expect(aggregate.domainEvents).toHaveLength(0)
  });
});
