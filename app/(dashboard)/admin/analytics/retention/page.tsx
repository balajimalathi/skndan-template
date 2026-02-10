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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type MatrixRow = {
  cohortPeriod: string;
  total: number;
  buckets: { period: string; count: number; rate: number }[];
};

function lastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAnalyticsRetentionPage() {
  const [eventNames, setEventNames] = useState<{ eventName: string; count: number }[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    cohortEvent: "",
    returnEvent: "",
    startDate: lastMonth(),
    endDate: today(),
    period: "week" as "day" | "week",
  });

  const fetchEventNames = useCallback(async () => {
    const res = await fetch(
      `/api/admin/analytics/aggregations?startDate=${filters.startDate}&endDate=${filters.endDate}`
    );
    if (res.ok) {
      const data = await res.json();
      setEventNames(data.byEvent ?? []);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchEventNames();
  }, [fetchEventNames]);

  async function loadRetention() {
    if (!filters.cohortEvent || !filters.returnEvent) {
      toast.error("Select cohort and return events");
      return;
    }
    setLoading(true);
    setMatrix(null);
    try {
      const params = new URLSearchParams({
        cohortEvent: filters.cohortEvent,
        returnEvent: filters.returnEvent,
        startDate: filters.startDate,
        endDate: filters.endDate,
        period: filters.period,
      });
      const res = await fetch(`/api/admin/analytics/retention?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to load retention");
        return;
      }
      const data = await res.json();
      setMatrix(data.matrix ?? []);
    } finally {
      setLoading(false);
    }
  }

  const periodColumns =
    matrix?.flatMap((r) => r.buckets.map((b) => b.period)) ?? [];
  const uniquePeriods = Array.from(new Set(periodColumns)).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Retention
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cohort retention: users who did the cohort event in a period, and % who did the return event in subsequent periods.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            Choose cohort event (e.g. signup) and return event (e.g. feature_used). Results show % of each cohort that returned in each period.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Cohort event</Label>
            <Select
              value={filters.cohortEvent || "__none__"}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, cohortEvent: v === "__none__" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {eventNames.map((n) => (
                  <SelectItem key={n.eventName} value={n.eventName}>
                    {n.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Return event</Label>
            <Select
              value={filters.returnEvent || "__none__"}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, returnEvent: v === "__none__" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {eventNames.map((n) => (
                  <SelectItem key={n.eventName} value={n.eventName}>
                    {n.eventName}
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
          <div className="space-y-2">
            <Label>Period</Label>
            <Select
              value={filters.period}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, period: v as "day" | "week" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button onClick={loadRetention} disabled={loading}>
            {loading ? "Loading…" : "Compute retention"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention matrix</CardTitle>
          <CardDescription>
            Rows = cohort periods, columns = subsequent periods. Values = % of cohort who did return event in that period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : matrix && matrix.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort period</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    {uniquePeriods.map((col) => (
                      <TableHead key={col} className="text-right text-muted-foreground text-xs">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.map((row) => {
                    const rateByPeriod = Object.fromEntries(
                      row.buckets.map((b) => [b.period, b.rate])
                    );
                    return (
                      <TableRow key={row.cohortPeriod}>
                        <TableCell className="font-medium">{row.cohortPeriod}</TableCell>
                        <TableCell className="text-right">{row.total}</TableCell>
                        {uniquePeriods.map((p) => (
                          <TableCell key={p} className="text-right text-muted-foreground text-sm">
                            {p in rateByPeriod ? `${Math.round(rateByPeriod[p] as number)}%` : "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : matrix && matrix.length === 0 ? (
            <p className="text-muted-foreground text-sm">No cohort data in the selected range.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
