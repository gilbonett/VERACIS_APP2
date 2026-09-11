import { WatchedList } from "@/core/entities/watched-list";
import { AlertEvent } from "./alert-event";

export class AlertEventList extends WatchedList<AlertEvent> {
  compareItems(a: AlertEvent, b: AlertEvent): boolean {
    return a.eventId.equals(b.eventId);
  }
}
