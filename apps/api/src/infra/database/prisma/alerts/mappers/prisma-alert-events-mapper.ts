import { AlertEvent } from "@/domain/alerts/entities/alert-event";
import { Prisma } from "@generated/client";

export class PrismaAlertEventsMapper {
  static toPrisma(raw: AlertEvent): Prisma.AlertEventUncheckedCreateInput {
    return {
      eventId: raw.eventId.toString(),
      alertId: raw.alertId.toString(),
    };
  }
}
