import { env } from "@/public-env";
import z from "zod";

const alertsMetricsSchema = z.object({
  status: z.object({
    pending: z.number(),
    accepted: z.number(),
    closed: z.number(),
    rejected: z.number(),
    total: z.number(),
  }),
  categories: z.array(
    z.object({
      categoryId: z.string(),
      categoryName: z.string(),
      count: z.number(),
    }),
  ),
  events: z.array(
    z.object({
      eventId: z.string(),
      eventName: z.string(),
      count: z.number(),
    }),
  ),
});

export async function getAlertsMetrics() {
  const url = new URL("alerts/metrics", env.API_URL);

  const response = await fetch(url, {
    credentials: "include",
  });

  const data = await response.json();

  return alertsMetricsSchema.parse(data);
}
