import { Transaction } from "@/core/repositories/transaction";
import { AlertEvent } from "@/domain/alerts/entities/alert-event";
import { AlertEventsRepository } from "@/domain/alerts/repositories/alert-events-repository";
import { TransactionClient } from "@generated/internal/prismaNamespace";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertEventsMapper } from "../mappers/prisma-alert-events-mapper";

@Injectable()
export class PrismaAlertEventsRepository implements AlertEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(events: AlertEvent[], tx?: Transaction): Promise<void> {
    if (events.length === 0) return;

    const client = (tx as TransactionClient) ?? this.prisma;
    const data = events.map(PrismaAlertEventsMapper.toPrisma);
    await client.alertEvent.createMany({ data });
  }

  async deleteMany(events: AlertEvent[], tx?: Transaction): Promise<void> {
    if (events.length === 0) return;

    const client = (tx as TransactionClient) ?? this.prisma;

    const data = events.map(PrismaAlertEventsMapper.toPrisma);
    await client.alertEvent.deleteMany({ where: { OR: data } });
  }
}
