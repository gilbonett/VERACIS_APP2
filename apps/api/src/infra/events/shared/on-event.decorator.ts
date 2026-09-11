import { DomainEvent } from "@/core/events/domain-event";
import { SetMetadata } from "@nestjs/common";

export const EVENT_METADATA = "event-metadata";

type EventConstructor<TPayload> = (new (...args: never[]) => DomainEvent<TPayload>) & {
  EVENT_NAME?: string;
};

export function OnEvent<TPayload, TInstance = unknown>(
  event: EventConstructor<TPayload>,
  condition?: (
    payload: TPayload,
    self: TInstance,
  ) => boolean | Promise<boolean>,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = async function (
      this: TInstance,
      event: { payload: TPayload },
      ...rest: unknown[]
    ) {
      if (condition && !(await condition(event.payload, this))) return;

      return original.apply(this, [event, ...rest]);
    };

    const eventName = event.EVENT_NAME ?? event.name;

    SetMetadata(EVENT_METADATA, eventName)(target, propertyKey, descriptor);

    return descriptor;
  };
}
