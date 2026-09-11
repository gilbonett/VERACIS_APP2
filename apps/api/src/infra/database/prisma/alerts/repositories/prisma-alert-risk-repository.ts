import { Transaction } from "@/core/repositories/transaction";
import { AlertRisk } from "@/domain/alerts/entities/alert-risk";
import { AlertRiskRepository } from "@/domain/alerts/repositories/alert-risk-repository";
import { TransactionClient } from "@generated/internal/prismaNamespace";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertRiskMapper } from "../mappers/prisma-alert-risk-mapper";

@Injectable()
export class PrismaAlertRiskRepository implements AlertRiskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(risks: AlertRisk[], tx?: Transaction): Promise<void> {
    if (risks.length === 0) return;

    const data = risks.map(PrismaAlertRiskMapper.toPrisma);
    const client = (tx as TransactionClient) ?? this.prisma;

    await client.alertRisk.createMany({ data });
  }

  async deleteMany(risks: AlertRisk[], tx?: Transaction): Promise<void> {
    if (risks.length === 0) return;

    const alertIds = risks.map((risk) => {
      return risk.alertId.toString();
    });

    const client = (tx as TransactionClient) ?? this.prisma;

    await client.alertRisk.deleteMany({
      where: {
        alertId: {
          in: alertIds,
        },
      },
    });
  }
}
