import { Alert, AlertStatus } from "@/domain/alerts/entities/alert";
import { AlertAttachmentsRepository } from "@/domain/alerts/repositories/alert-attachments-repository";
import { AlertEventsRepository } from "@/domain/alerts/repositories/alert-events-repository";
import { AlertRepository } from "@/domain/alerts/repositories/alert-repository";
import { AlertRiskRepository } from "@/domain/alerts/repositories/alert-risk-repository";
import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertMapper } from "../mappers/prisma-alert-mapper";

@Injectable()
export class PrismaAlertRepository implements AlertRepository {
  constructor(
    private prisma: PrismaService,
    private alertEventsRepository: AlertEventsRepository,
    private alertAttachmentsRepository: AlertAttachmentsRepository,
    private alertRiskRepository: AlertRiskRepository,
    private outboxRepository: OutboxRepository,
  ) {}

  async updateStatus(alertId: string, status: AlertStatus): Promise<void> {
    await this.prisma.alert.update({
      where: { id: alertId },
      data: { status },
    });
  }

  async create(alert: Alert): Promise<void> {
    const data = PrismaAlertMapper.toPrisma(alert);

    await this.prisma.$transaction(async (tx) => {
      await tx.alert.create({ data });

      await this.alertEventsRepository.createMany(alert.events.getItems(), tx);
      await this.alertAttachmentsRepository.createMany(
        alert.attachments.getItems(),
        tx,
      );
      await this.alertRiskRepository.createMany(alert.risks.getItems(), tx);
      await this.outboxRepository.create(alert, tx);
    });

    alert.clearEvents();
  }

  async findById(id: string): Promise<Alert | null> {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        events: true,
        attachments: true,
      },
    });

    if (!alert) return null;

    return PrismaAlertMapper.toDomain(alert);
  }

  async findAll(): Promise<Alert[]> {
    const alerts = await this.prisma.alert.findMany({
      include: {
        events: true,
        attachments: true,
      },
    });

    return alerts.map(PrismaAlertMapper.toDomain);
  }

  async save(alert: Alert): Promise<void> {
    const data = PrismaAlertMapper.toPrisma(alert);

    await this.prisma.$transaction(async (tx) => {
      await tx.alert.update({
        where: { id: data.id },
        data,
      });

      await this.alertEventsRepository.createMany(
        alert.events.getNewItems(),
        tx,
      );
      await this.alertEventsRepository.deleteMany(
        alert.events.getRemovedItems(),
        tx,
      );

      await this.alertAttachmentsRepository.createMany(
        alert.attachments.getNewItems(),
        tx,
      );
      await this.alertAttachmentsRepository.deleteMany(
        alert.attachments.getRemovedItems(),
        tx,
      );

      await this.alertRiskRepository.createMany(alert.risks.getNewItems(), tx);
      await this.alertRiskRepository.deleteMany(
        alert.risks.getRemovedItems(),
        tx,
      );

      await this.outboxRepository.create(alert, tx);
    });

    alert.clearEvents();
  }

  async delete(alert: Alert): Promise<void> {
    await this.prisma.alert.delete({
      where: {
        id: alert.id.toString(),
      },
    });
  }
}
