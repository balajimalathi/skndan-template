"use client";

import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUpcomingBlackouts, createBlackoutDates, deleteBlackoutDate } from "./actions";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

export default function BlackoutsSettingsPage() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 0),
  });
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [blackouts, setBlackouts] = useState<
    {
      id: string;
      date: Date;
      reason: string | null;
    }[]
  >([]);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await listUpcomingBlackouts();
        setBlackouts(
          rows.map((row) => ({
            id: row.id,
            date: row.date,
            reason: row.reason ?? null,
          })),
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load blackout dates");
      } finally {
        setIsLoadingList(false);
      }
    })();
  }, []);

  async function handleCreate() {
    if (!range?.from) {
      toast.error("Please select at least one date");
      return;
    }

    setIsSubmitting(true);
    try {
      const fromIso = format(range.from, "yyyy-MM-dd");
      const toIso = range.to ? format(range.to, "yyyy-MM-dd") : fromIso;

      await createBlackoutDates({
        from: fromIso,
        to: toIso,
        staffId: null,
        reason: reason.trim() || undefined,
      });

      toast.success("Blackout dates added");

      // Refresh list
      const rows = await listUpcomingBlackouts();
      setBlackouts(
        rows.map((row) => ({
          id: row.id,
          date: row.date,
          reason: row.reason ?? null,
        })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to create blackout dates");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBlackoutDate(id);
      setBlackouts((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blackout removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete blackout");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blackout dates</h1>
        <p className="text-sm text-muted-foreground">
          Block out dates when you or your team are unavailable. Customers will not be able to book
          appointments on these days.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <h2 className="mb-2 text-sm font-medium">Select dates</h2>
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Input
              placeholder="Holiday, maintenance, team offsite..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          <Button onClick={handleCreate} disabled={isSubmitting}>
            Save blackout dates
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium">Upcoming blackouts</h2>
          <div className="rounded-md border">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Date</span>
              <span>Reason</span>
              <span className="text-right">Actions</span>
            </div>
            {isLoadingList ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">Loading...</div>
            ) : blackouts.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">No upcoming blackouts</div>
            ) : (
              <ul className="divide-y">
                {blackouts.map((b) => (
                  <li key={b.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-4 px-4 py-3 text-sm">
                    <span>{format(b.date, "EEE, MMM d, yyyy")}</span>
                    <span className="truncate text-muted-foreground">{b.reason || "—"}</span>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

