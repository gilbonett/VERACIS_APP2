import { AlertMetrics } from "@/domain/alerts/entities/alert-metrics";

export class AlertMetricsPresenter {
  static toHTTP(value: AlertMetrics) {
    return {
      status: {
        pending: value.status.pending,
        accepted: value.status.accepted,
        closed: value.status.closed,
        rejected: value.status.rejected,
        total: value.status.total,
      },
      categories: value.categories.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        count: item.count,
      })),
      events: value.events.map((item) => ({
        eventId: item.eventId,
        eventName: item.eventName,
        count: item.alertsCount,
      })),
    };
  }
}
