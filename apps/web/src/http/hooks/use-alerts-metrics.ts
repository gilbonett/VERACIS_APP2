import { useQuery } from "@tanstack/react-query";
import { getAlertsMetrics } from "../queries/get-alerts-metrics";

export const ALERT_METRCIS_QUERY_KEY = ["alerts-metrics"];

export function useAlertsMetrics(enabled = true) {
  return useQuery({
    queryKey: [ALERT_METRCIS_QUERY_KEY],
    queryFn: () => getAlertsMetrics(),
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: false,
    enabled,
  });
}
