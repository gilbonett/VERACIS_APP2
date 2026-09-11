import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { AlertRisk } from "@/domain/alerts/entities/alert-risk";
import { Prisma, AlertRisk as PrismaAlertRisk } from "@generated/client";

export class PrismaAlertRiskMapper {
  static toDomain(raw: PrismaAlertRisk): AlertRisk {
    return AlertRisk.create({
      alertId: new UniqueEntityID(raw.alertId),
      riskId: new UniqueEntityID(raw.riskId),
    });
  }

  static toPrisma(props: AlertRisk): Prisma.AlertRiskUncheckedCreateInput {
    return {
      alertId: props.alertId.toString(),
      riskId: props.riskId.toString(),
    };
  }
}
