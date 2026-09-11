"use client";

import { Card, CardContent, CardHeader } from "@/components/card";
import { Skeleton } from "@/components/skeleton";
import { Fragment } from "react";

function StatusCardsSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card
          key={i}
          className="rounded-none shadow-sm border border-[#E0E0E0] border-t-4 border-t-[#E0E0E0] bg-white"
        >
          <CardHeader className="pb-4 pt-5 px-5 gap-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-16 mt-1" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function CategoryChartSkeleton() {
  return (
    <Card className="rounded-none shadow-sm border border-[#E0E0E0] bg-white">
      <CardHeader className="border-b border-[#E0E0E0] px-5 py-4">
        <Skeleton className="h-3 w-40" />
      </CardHeader>
      <CardContent className="pt-6 flex flex-col items-center gap-5">
        {/* Círculo do pie */}
        <Skeleton className="rounded-full h-52 w-52" />
        {/* Legendas */}
        <div className="flex flex-wrap gap-3 justify-center w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-sm" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventsTableSkeleton() {
  return (
    <Card className="rounded-none shadow-sm border border-[#E0E0E0] bg-white">
      <CardHeader className="border-b border-[#E0E0E0] px-5 py-4">
        <Skeleton className="h-3 w-36" />
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Cabeçalho da tabela */}
        <div className="flex justify-between px-5 py-3 border-b border-[#E0E0E0]">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-28" />
        </div>
        {/* Linhas — largura decrescente para simular dados reais */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center px-5 py-3 border-b border-[#E0E0E0] last:border-0"
          >
            <Skeleton className="h-3" style={{ width: `${58 - i * 4}%` }} />
            <Skeleton className="h-3 w-5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <Fragment>
      <StatusCardsSkeleton />
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <CategoryChartSkeleton />
        <EventsTableSkeleton />
      </div>
    </Fragment>
  );
}
