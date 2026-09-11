import { AlertMetrics } from "@/domain/alerts/entities/alert-metrics";
import { AlertMetricsRepository } from "@/domain/alerts/repositories/alert-metrics-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class PrismaAlertMetricsRepository implements AlertMetricsRepository {
  constructor(private prisma: PrismaService) {}

  async findByCommunityId(communityId: string): Promise<AlertMetrics> {
    const where = { communityId };

    const [statusGroups, categoryGroups, eventGroups] = await Promise.all([
      this.prisma.alert.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      this.prisma.category.findMany({
        where: { alerts: { some: { communityId } } },
        select: {
          id: true,
          name: true,
          _count: {
            select: { alerts: { where: { communityId } } },
          },
        },
      }),
      this.prisma.event.findMany({
        where: { alerts: { some: { alert: { communityId } } } },
        select: {
          id: true,
          name: true,
          _count: {
            select: { alerts: { where: { alert: { communityId } } } },
          },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusGroups.map((g) => [g.status.toLowerCase(), g._count._all])
    );

    return AlertMetrics.reconstitute({
      status: {
        pending: statusMap["pending"] ?? 0,
        accepted: statusMap["accepted"] ?? 0,
        closed: statusMap["closed"] ?? 0,
        rejected: statusMap["rejected"] ?? 0,
        total: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
      },
      categories: categoryGroups.map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        count: c._count.alerts,
      })),
      events: eventGroups
        .map((e) => ({
          eventId: e.id,
          eventName: e.name,
          alertsCount: e._count.alerts,
        }))
        .sort((a, b) => b.alertsCount - a.alertsCount),
    });
  }
}
