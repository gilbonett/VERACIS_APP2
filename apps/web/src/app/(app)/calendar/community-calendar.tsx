"use client";

import { Button } from "@/components/button";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildMockEventsForMonth,
  type MockCalendarEvent,
  toIsoDateLocal,
} from "./mock-calendar-events";

// Mobile: abreviações de 1 letra; desktop: 3 letras
const WEEK_DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"] as const;
const WEEK_DAYS_LONG = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;
const kindStyles: Record<
  MockCalendarEvent["kind"],
  { dot: string; badge: string; label: string }
> = {
  reuniao: {
    dot: "bg-[#1351B4]",
    badge: "bg-[#1351B4] text-white",
    label: "Reunião",
  },
  oficina: {
    dot: "bg-[#168821]",
    badge: "bg-[#168821] text-white",
    label: "Oficina",
  },
  acao: {
    dot: "bg-[#FFCD07]",
    badge: "bg-[#FFCD07] text-[#4A3800]",
    label: "Ação",
  },
};

function formatMonthTitle(year: number, monthIndex: number) {
  const raw = new Date(year, monthIndex, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildCalendarCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: ({ day: number } | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CommunityCalendar() {
  const { user } = useUser();
  const communities = user?.communities ?? [];

  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const today = useMemo(() => {
    const n = new Date();
    return toIsoDateLocal(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const events = useMemo(
    () => buildMockEventsForMonth(cursor.year, cursor.month, communities),
    [cursor.year, cursor.month, communities],
  );

  const eventsByDate = useMemo(() => {
    const m = new Map<string, MockCalendarEvent[]>();
    for (const e of events) {
      const list = m.get(e.isoDate) ?? [];
      list.push(e);
      m.set(e.isoDate, list);
    }
    return m;
  }, [events]);

  const cells = useMemo(
    () => buildCalendarCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedIso(null);
  }

  const selectedDayEvents = selectedIso
    ? (eventsByDate.get(selectedIso) ?? [])
    : [];

  return (
    <div className="flex w-full flex-col">
      {/* ── Corpo ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 bg-white p-3 sm:p-6 lg:flex-row lg:items-start">
        {/* ── Calendário ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden rounded-sm border border-[#E0E0E0] bg-white shadow-sm">
          {/* Navegação de mês */}
          <div className="flex items-center justify-between bg-[#1351B4] px-3 py-3 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => shiftMonth(-1)}
              aria-label="Mês anterior"
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <p className="font-[family-name:Rawline] text-sm font-bold tracking-wide text-white sm:text-base">
              {formatMonthTitle(cursor.year, cursor.month)}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => shiftMonth(1)}
              aria-label="Próximo mês"
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          {/* Dias da semana — 1 letra no mobile, 3 no sm+ */}
          <div className="grid grid-cols-7 border-b border-[#E0E0E0] bg-[#F0F4FB]">
            {WEEK_DAYS_SHORT.map((short, i) => (
              <div
                key={i}
                className="py-2 text-center text-xs font-bold text-[#1351B4]"
              >
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline uppercase tracking-widest">
                  {WEEK_DAYS_LONG[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Células dos dias */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="border-b border-r border-[#F0F0F0] bg-[#FAFAFA]"
                    style={{ aspectRatio: "1" }}
                  />
                );
              }

              const iso = toIsoDateLocal(cursor.year, cursor.month, cell.day);
              const dayEvents = eventsByDate.get(iso) ?? [];
              const isSelected = selectedIso === iso;
              const isToday = iso === today;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() =>
                    setSelectedIso((prev) => (prev === iso ? null : iso))
                  }
                  style={{ aspectRatio: "1" }}
                  className={cn(
                    "group flex flex-col items-center justify-start border-b border-r border-[#E8E8E8] p-0.5 transition-colors sm:p-1",
                    dayEvents.length > 0
                      ? "bg-[#EAF0FB] hover:bg-[#D5E3F7]"
                      : "bg-white hover:bg-[#F0F4FB]",
                    isSelected && "bg-[#1351B4] hover:bg-[#1351B4]",
                  )}
                >
                  {/* Número do dia */}
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold sm:size-6 sm:text-sm",
                      isToday && !isSelected
                        ? "bg-[#1351B4] text-white"
                        : isSelected
                          ? "text-white"
                          : "text-[#1C1C1C]",
                    )}
                  >
                    {cell.day}
                  </span>

                  {/* Dots — só no sm+ para não sufocar o mobile */}
                  <div className="mt-auto hidden w-full flex-wrap justify-center gap-0.5 pb-0.5 sm:flex">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        title={`${e.title} — ${e.communityName}`}
                        className={cn(
                          "size-1.5 rounded-full sm:size-2",
                          isSelected ? "bg-white/80" : kindStyles[e.kind].dot,
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span
                        className={cn(
                          "text-[10px] leading-none",
                          isSelected ? "text-white/80" : "text-[#636363]",
                        )}
                      >
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>

                  {/* No mobile: só um ponto único se tiver evento */}
                  {dayEvents.length > 0 && (
                    <div className="mt-auto pb-0.5 sm:hidden">
                      <span
                        className={cn(
                          "block size-1 rounded-full",
                          isSelected ? "bg-white/80" : "bg-[#1351B4]",
                        )}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 border-t border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 text-xs text-[#636363]">
            {(Object.keys(kindStyles) as MockCalendarEvent["kind"][]).map(
              (k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", kindStyles[k].dot)}
                  />
                  {kindStyles[k].label}
                </span>
              ),
            )}
          </div>
        </div>

        {/* ── Painel de eventos ────────────────────────────────────────────
            Mobile: aparece como painel fixo na parte inferior quando um dia
            está selecionado. Desktop: coluna lateral fixa.
        ─────────────────────────────────────────────────────────────────── */}

        {/* Desktop sidebar */}
        <div className="hidden w-72 shrink-0 overflow-hidden rounded-sm border border-[#E0E0E0] bg-white shadow-sm lg:block xl:w-80">
          <PanelContent
            selectedIso={selectedIso}
            selectedDayEvents={selectedDayEvents}
          />
        </div>

        {/* Mobile: sheet deslizante de baixo quando um dia é selecionado */}
        {selectedIso && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-t-[#1351B4] bg-white shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] bg-[#F0F4FB] px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-[#1351B4]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#1351B4]">
                  {selectedIso.split("-").reverse().join("/")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIso(null)}
                className="rounded p-1 text-[#636363] hover:bg-[#E0E0E0]"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-auto p-4">
              <EventList events={selectedDayEvents} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function PanelContent({
  selectedIso,
  selectedDayEvents,
}: {
  selectedIso: string | null;
  selectedDayEvents: MockCalendarEvent[];
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b-4 border-b-[#1351B4] bg-[#F0F4FB] px-4 py-3">
        <CalendarDays className="size-4 text-[#1351B4]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#1351B4]">
          {selectedIso
            ? selectedIso.split("-").reverse().join("/")
            : "Eventos do dia"}
        </span>
      </div>
      <div className="p-4">
        {!selectedIso ? (
          <p className="text-sm text-[#636363]">
            Selecione um dia no calendário para ver os eventos.
          </p>
        ) : selectedDayEvents.length === 0 ? (
          <p className="text-sm text-[#636363]">
            Nenhum evento neste dia para o filtro atual.
          </p>
        ) : (
          <EventList events={selectedDayEvents} />
        )}
      </div>
    </>
  );
}

function EventList({ events }: { events: MockCalendarEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {events.map((e) => (
        <li
          key={e.id}
          className="border border-[#E0E0E0] bg-white p-3 shadow-sm"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <span className="text-sm font-semibold text-[#071D41]">
              {e.title}
            </span>
            <span className="text-xs font-medium text-[#636363]">
              {e.timeLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#636363]">{e.communityName}</p>
          <span
            className={cn(
              "mt-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
              kindStyles[e.kind].badge,
            )}
          >
            {kindStyles[e.kind].label}
          </span>
        </li>
      ))}
    </ul>
  );
}
