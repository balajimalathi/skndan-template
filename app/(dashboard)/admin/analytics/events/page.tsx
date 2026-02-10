"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type EventRow = {
  id: string;
  userId: string | null;
  anonymousId: string | null;
  eventName: string;
  properties: Record<string, unknown> | null;
  createdAt: string;
};

const LIMIT = 50;

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

function lastWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAnalyticsEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [eventNames, setEventNames] = useState<{ eventName: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({
    eventName: "",
    startDate: lastWeek(),
    endDate: today(),
  });

  useEffect(() => {
    setOffset(0);
  }, [filters.eventName, filters.startDate, filters.endDate]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(LIMIT));
      params.set("offset", String(offset));
      if (filters.eventName) params.set("eventName", filters.eventName);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      const res = await fetch(`/api/admin/analytics/events?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to load events");
        return;
      }
      const data = await res.json();
      setEvents(data.events ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [offset, filters.eventName, filters.startDate, filters.endDate]);

  const fetchAggregations = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    const res = await fetch(`/api/admin/analytics/aggregations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEventNames(data.byEvent ?? []);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchAggregations();
  }, [fetchAggregations]);

  function exportCsv() {
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }
    const headers = ["Event", "User ID", "Anonymous ID", "Properties", "Timestamp"];
    const rows = events.map((e) => [
      e.eventName,
      e.userId ?? "",
      e.anonymousId ?? "",
      e.properties ? JSON.stringify(e.properties) : "",
      e.createdAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${filters.startDate}-${filters.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Events
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Explore and filter analytics events. Use date range and event name to narrow results.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Event name</Label>
          <Select
            value={filters.eventName || "all"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, eventName: v === "all" ? "" : v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {eventNames.map((n) => (
                <SelectItem key={n.eventName} value={n.eventName}>
                  {n.eventName} ({n.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, startDate: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, endDate: e.target.value }))
            }
          />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={exportCsv} disabled={events.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event list</CardTitle>
          <CardDescription>
            {total} event{total !== 1 ? "s" : ""} (showing up to {LIMIT} per page)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events match the filters.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Anonymous ID</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.eventName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.userId ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.anonymousId ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                        {e.properties
                          ? JSON.stringify(e.properties)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(e.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + LIMIT >= total}
                  onClick={() => setOffset((o) => o + LIMIT)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
