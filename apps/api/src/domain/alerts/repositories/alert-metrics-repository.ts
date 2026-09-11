import { AlertMetrics } from "../entities/alert-metrics";

export abstract class AlertMetricsRepository {
  abstract findByCommunityId(communityId: string): Promise<AlertMetrics>;
}
