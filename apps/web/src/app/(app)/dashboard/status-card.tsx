"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { cn } from "@/lib/utils";

type Status = {
  pending: number;
  accepted: number;
  closed: number;
  rejected: number;
  total: number;
};

const CARDS = [
  {
    key: "pending" as const,
    label: "Alertas Pendentes",
    borderColor: "border-t-4 border-t-[#FFCD07]",
    valueColor: "text-[#BC9B00]",
    iconBg: "bg-[#FFFAE6]",
    icon: "⏳",
  },
  {
    key: "accepted" as const,
    label: "Alertas Aceitos",
    borderColor: "border-t-4 border-t-[#168821]",
    valueColor: "text-[#168821]",
    iconBg: "bg-[#EAF6EC]",
    icon: "✓",
  },
  {
    key: "closed" as const,
    label: "Alertas Fechados",
    borderColor: "border-t-4 border-t-[#636363]",
    valueColor: "text-[#636363]",
    iconBg: "bg-[#F0F0F0]",
    icon: "✕",
  },
  {
    key: "rejected" as const,
    label: "Alertas Rejeitados",
    borderColor: "border-t-4 border-t-[#E52207]",
    valueColor: "text-[#E52207]",
    iconBg: "bg-[#FDECEA]",
    icon: "!",
  },
  {
    key: "total" as const,
    label: "Total de Alertas",
    borderColor: "border-t-4 border-t-[#1351B4]",
    valueColor: "text-[#1351B4]",
    iconBg: "bg-[#EAF0FB]",
    icon: "#",
  },
];

export function StatusCard({ status }: { status: Status }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map(({ key, label, borderColor, valueColor, iconBg, icon }) => (
        <Card
          key={key}
          className={cn(
            "rounded-sm shadow-sm border border-[#E0E0E0] bg-white",
            borderColor,
          )}
        >
          <CardHeader className="pb-4 pt-5 px-5 gap-3">
            <div className="flex items-start justify-between">
              <CardDescription className="font-semibold text-xs uppercase tracking-widest text-[#636363] leading-tight">
                {label}
              </CardDescription>
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                  iconBg,
                  valueColor,
                )}
              >
                {icon}
              </span>
            </div>
            <CardTitle
              className={cn("text-4xl font-bold tabular-nums mt-1", valueColor)}
            >
              {status[key].toLocaleString("pt-BR")}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
