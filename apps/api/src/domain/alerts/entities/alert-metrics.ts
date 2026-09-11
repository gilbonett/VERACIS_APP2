import { Entity } from "@/core/entities/entity";

type AlertMetricsProps = {
  status: {
    pending: number;
    accepted: number;
    closed: number;
    rejected: number;
    total: number;
  };
  categories: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  events: Array<{
    eventId: string;
    eventName: string;
    alertsCount: number;
  }>;
};

export class AlertMetrics extends Entity<AlertMetricsProps> {
  get status() {
    return this.props.status;
  }

  get categories() {
    return this.props.categories;
  }

  get events() {
    return this.props.events;
  }

  static reconstitute(props: AlertMetricsProps) {
    return new AlertMetrics(props);
  }
}
