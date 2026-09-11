"use client";

import { useAlertsMetrics } from "@/http/hooks/use-alerts-metrics";
import { Fragment } from "react/jsx-runtime";
import { CategoryChart } from "./category-chart";
import { EventsTable } from "./events-table";
import { OverviewSkeleton } from "./loading-skeleton";
import { StatusCard } from "./status-card";

export function Overview() {
  const { data, isLoading } = useAlertsMetrics();

  if (!data || isLoading) return <OverviewSkeleton />;

  return (
    <Fragment>
      <StatusCard status={data.status} />
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <CategoryChart categories={data.categories} />
        <EventsTable events={data.events} />
      </div>
    </Fragment>
  );
}
