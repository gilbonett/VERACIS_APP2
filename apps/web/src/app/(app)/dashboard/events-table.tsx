"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";

type Event = {
  eventId: string;
  eventName: string;
  count: number;
};

type EventsTableProps = {
  events: Event[];
};

export function EventsTable({ events }: EventsTableProps) {
  const maxCount = Math.max(...events.map((e) => e.count), 1);

  return (
    <Card className="rounded-sm shadow-sm border border-[#E0E0E0] bg-white flex flex-col">
      <CardHeader className="border-b border-[#E0E0E0] px-5 py-4 shrink-0">
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[#1351B4]">
          Eventos por tipo
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 overflow-auto max-h-[50vh] lg:max-h-[calc(100vh-380px)]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow className="border-b border-[#E0E0E0] hover:bg-transparent">
              <TableHead className="pl-5 py-3 text-xs font-bold uppercase tracking-widest text-[#636363]">
                Nome
              </TableHead>
              <TableHead className="pr-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-[#636363]">
                Total de eventos
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map(({ eventId, eventName, count }) => {
              const pct = (count / maxCount) * 100;

              return (
                <TableRow
                  key={eventId}
                  className="border-b border-[#E0E0E0] last:border-0 hover:bg-[#EAF0FB] transition-colors"
                >
                  <TableCell className="pl-5 py-3 relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#1351B4]/8 pointer-events-none"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative text-sm text-[#1C1C1C]">
                      {eventName}
                    </span>
                  </TableCell>

                  {/* Contagem */}
                  <TableCell className="pr-5 py-3 text-right tabular-nums text-sm font-semibold text-[#1351B4]">
                    {count}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
