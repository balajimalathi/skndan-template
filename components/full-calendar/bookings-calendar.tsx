"use client";

import React, { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventClickArg, EventSourceInput } from "@fullcalendar/core";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/bookings/types";

export type BookingCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: BookingStatus;
  staffName?: string | null;
  serviceName?: string | null;
  customerName?: string | null;
};

const statusToClassName: Record<BookingStatus, string> = {
  PENDING: "bg-muted text-muted-foreground border border-border",
  CONFIRMED: "bg-primary text-primary-foreground",
  COMPLETED: "bg-emerald-500 text-emerald-50 dark:bg-emerald-600",
  CANCELLED: "bg-destructive text-destructive-foreground",
  NO_SHOW: "bg-amber-500 text-amber-50 dark:bg-amber-600",
};

type BookingsCalendarProps = {
  events: BookingCalendarEvent[];
  initialDate?: string;
  loading?: boolean;
  onRangeChange?: (args: { start: Date; end: Date }) => void;
  onEventClick?: (event: BookingCalendarEvent) => void;
  className?: string;
};

export function BookingsCalendar(props: BookingsCalendarProps) {
  const { events, initialDate, loading, onRangeChange, onEventClick, className } = props;

  const [currentDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined,
  );

  const handleDatesSet = useCallback(
    (arg: { start: Date; end: Date }) => {
      onRangeChange?.({ start: arg.start, end: arg.end });
    },
    [onRangeChange],
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const extended = clickInfo.event.extendedProps as Partial<BookingCalendarEvent> & {
        status?: BookingStatus;
      };
      const payload: BookingCalendarEvent = {
        id: String(clickInfo.event.id),
        title: clickInfo.event.title,
        start: clickInfo.event.start?.toISOString() ?? "",
        end: clickInfo.event.end?.toISOString() ?? "",
        status: extended.status ?? "PENDING",
        staffName: extended.staffName ?? null,
        serviceName: extended.serviceName ?? null,
        customerName: extended.customerName ?? null,
      };
      onEventClick?.(payload);
    },
    [onEventClick],
  );

  const eventSources: EventSourceInput = events.map((evt) => ({
    id: evt.id,
    title: evt.title,
    start: evt.start,
    end: evt.end,
    extendedProps: {
      status: evt.status,
      staffName: evt.staffName,
      serviceName: evt.serviceName,
      customerName: evt.customerName,
    },
    classNames: statusToClassName[evt.status],
  }));

  return (
    <div className={cn("relative rounded-md border bg-background p-2 sm:p-4", className)}>
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 text-xs text-muted-foreground">
          Loading bookings...
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
        nowIndicator
        selectable={false}
        events={eventSources}
        initialDate={currentDate}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        eventClassNames={(arg) => {
          const status = (arg.event.extendedProps.status ?? "PENDING") as BookingStatus;
          return [
            "border border-transparent text-[10px] sm:text-xs rounded-sm px-1 py-0.5 sm:px-1.5 sm:py-0.5 truncate",
            statusToClassName[status],
          ];
        }}
        eventContent={(arg) => {
          const status = (arg.event.extendedProps.status ?? "PENDING") as BookingStatus;
          const staffName = (arg.event.extendedProps.staffName as string | undefined) ?? "";
          const serviceName = (arg.event.extendedProps.serviceName as string | undefined) ?? "";

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-medium">{arg.event.title}</span>
                <span className="hidden rounded-sm bg-background/20 px-1 text-[9px] uppercase tracking-wide sm:inline">
                  {status}
                </span>
              </div>
              {serviceName && (
                <span className="truncate text-[9px] sm:text-[10px] opacity-90">
                  {serviceName}
                </span>
              )}
              {staffName && (
                <span className="truncate text-[9px] sm:text-[10px] opacity-80">
                  {staffName}
                </span>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

