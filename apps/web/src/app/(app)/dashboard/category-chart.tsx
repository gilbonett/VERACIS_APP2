"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/chart";
import { Pie, PieChart } from "recharts";

type Category = {
  categoryId: string;
  categoryName: string;
  count: number;
};

type CategoryChartProps = {
  categories: Category[];
};

const PALETTE = ["#1351B4", "#168821", "#FFCD07", "#E52207", "#071D41"];

function toKey(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

export function CategoryChart({ categories }: CategoryChartProps) {
  const chartConfig: ChartConfig = Object.fromEntries(
    categories.map(({ categoryName }, index) => [
      toKey(categoryName),
      {
        label: categoryName,
        color: PALETTE[index % PALETTE.length],
      },
    ]),
  );

  const chartData = categories.map(({ categoryName, count }) => {
    const key = toKey(categoryName);
    return {
      key,
      label: categoryName,
      count,
      fill: `var(--color-${key})`,
    };
  });

  return (
    <Card className="rounded-sm shadow-sm border border-[#E0E0E0] bg-white">
      <CardHeader className="border-b border-[#E0E0E0] px-5 py-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[#1351B4]">
          Alertas por categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-75"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="label" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="key"
              strokeWidth={2}
              stroke="#fff"
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="key" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
