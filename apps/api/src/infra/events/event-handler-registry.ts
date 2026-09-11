import { Injectable } from "@nestjs/common";
import { DiscoveryService, MetadataScanner } from "@nestjs/core";
import { EventHandler, EventsMetadataAccessor } from "./shared";

/**
 * Único dono do mapa evento -> handlers. Só sabe descobrir métodos
 * decorados com @OnEvent via reflection; não sabe nada de pg-listen nem de
 * como os handlers são disparados (quem chama decide isso).
 */
@Injectable()
export class EventHandlerRegistry {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(
    private discoveryService: DiscoveryService,
    private metadataScanner: MetadataScanner,
    private metadataAccessor: EventsMetadataAccessor,
  ) {}

  discover(): void {
    for (const wrapper of this.discoveryService.getProviders()) {
      const { instance } = wrapper;
      if (!instance || wrapper.isAlias) continue;

      const prototype = Object.getPrototypeOf(instance) || {};

      for (const methodKey of this.metadataScanner.getAllMethodNames(
        prototype,
      )) {
        this.registerHandler(instance, methodKey);
      }
    }
  }

  getEventNames(): string[] {
    return [...this.handlers.keys()];
  }

  getHandlers(eventName: string): EventHandler[] | undefined {
    return this.handlers.get(eventName);
  }

  private registerHandler(
    instance: Record<string, (...args: unknown[]) => unknown>,
    methodKey: string,
  ) {
    const eventName = this.metadataAccessor.getEventName(instance[methodKey]);
    if (!eventName) return;

    const handler: EventHandler = (event, outboxId) =>
      instance[methodKey].call(instance, event, outboxId);

    const list = this.handlers.get(eventName) ?? [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }
}
