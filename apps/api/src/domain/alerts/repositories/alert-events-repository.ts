import { Transaction } from "@/core/repositories/transaction";
import { AlertEvent } from "../entities/alert-event";

export abstract class AlertEventsRepository {
  abstract createMany(events: AlertEvent[], tx?: Transaction): Promise<void>;
  abstract deleteMany(events: AlertEvent[], tx?: Transaction): Promise<void>;
}
