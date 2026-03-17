"use client";

import { useEffect, useState } from "react";
import { subMonths, addMonths } from "date-fns";

import { BookingsCalendar } from "@/components/full-calendar/bookings-calendar";
import type { BookingCalendarEventDto } from "@/lib/bookings/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  organizationId: string;
};

export function CalendarClient({ organizationId }: Props) {
  const [events, setEvents] = useState<BookingCalendarEventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(() => {
    const now = new Date();
    return { start: subMonths(now, 1), end: addMonths(now, 1) };
  });
  const [selected, setSelected] = useState<BookingCalendarEventDto | null>(null);

  useEffect(() => {
    if (!range) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          orgId: organizationId,
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        });
        const res = await fetch(`/api/admin/bookings/calendar?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Failed to load bookings");
        }
        const data = (await res.json()) as { events: BookingCalendarEventDto[] };
        setEvents(data.events);
      } catch (error) {
        if ((error as any)?.name === "AbortError") return;
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [organizationId, range?.start, range?.end]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            View bookings by day and quickly inspect details.
          </p>
        </div>
      </div>

      <BookingsCalendar
        events={events}
        loading={loading}
        onRangeChange={(next) => setRange(next)}
        onEventClick={(evt) => setSelected(evt as BookingCalendarEventDto)}
      />

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full max-w-md space-y-4">
          <SheetHeader>
            <SheetTitle>Booking details</SheetTitle>
          </SheetHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{selected.customerName}</p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {selected.status}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium">{selected.serviceName ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Staff</p>
                  <p className="font-medium">{selected.staffName ?? "—"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium">
                  {new Date(selected.start).toLocaleString()} –{" "}
                  {new Date(selected.end).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" disabled>
                  View booking (coming soon)
                </Button>
                <Button size="sm" variant="outline" disabled>
                  Change status (coming soon)
                </Button>
                <Button size="sm" variant="outline" disabled>
                  Refund (coming soon)
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

