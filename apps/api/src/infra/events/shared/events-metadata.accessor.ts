import { Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EVENT_METADATA } from "./on-event.decorator";

@Injectable()
export class EventsMetadataAccessor {
  constructor(private reflector: Reflector) {}

  getEventName(target: (...args: unknown[]) => unknown): string | undefined {
    return this.reflector.get(EVENT_METADATA, target);
  }
}
