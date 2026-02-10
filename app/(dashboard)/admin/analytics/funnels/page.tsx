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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type FunnelRow = {
  id: string;
  name: string;
  steps: Array<{ event_name: string; filter?: Record<string, unknown> }>;
  createdAt: string;
};

type FunnelResultStep = {
  eventName: string;
  count: number;
  conversionRate: number;
};

function lastWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAnalyticsFunnelsPage() {
  const [funnels, setFunnels] = useState<FunnelRow[]>([]);
  const [eventNames, setEventNames] = useState<{ eventName: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resultFunnelId, setResultFunnelId] = useState<string | null>(null);
  const [resultDates, setResultDates] = useState({ startDate: lastWeek(), endDate: today() });
  const [result, setResult] = useState<{
    steps: FunnelResultStep[];
    funnelName: string;
  } | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [form, setForm] = useState({ name: "", steps: [{ event_name: "" }] });

  const fetchFunnels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/funnels");
      if (res.ok) {
        const data = await res.json();
        setFunnels(data.funnels ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventNames = useCallback(async () => {
    const res = await fetch(
      `/api/admin/analytics/aggregations?startDate=${resultDates.startDate}&endDate=${resultDates.endDate}`
    );
    if (res.ok) {
      const data = await res.json();
      setEventNames(data.byEvent ?? []);
    }
  }, [resultDates.startDate, resultDates.endDate]);

  useEffect(() => {
    fetchFunnels();
  }, [fetchFunnels]);

  useEffect(() => {
    fetchEventNames();
  }, [fetchEventNames]);

  async function loadResult(id: string) {
    setResultFunnelId(id);
    setResultLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({
        startDate: resultDates.startDate,
        endDate: resultDates.endDate,
      });
      const res = await fetch(`/api/admin/analytics/funnels/${id}/result?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to load result");
        return;
      }
      const data = await res.json();
      setResult({
        steps: data.steps ?? [],
        funnelName: data.funnelName ?? "",
      });
    } finally {
      setResultLoading(false);
    }
  }

  async function createFunnel() {
    const steps = form.steps.filter((s) => s.event_name.trim());
    if (steps.length === 0) {
      toast.error("Add at least one step with an event name");
      return;
    }
    const res = await fetch("/api/admin/analytics/funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || "New funnel",
        steps: steps.map((s) => ({ event_name: s.event_name.trim() })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create funnel");
      return;
    }
    toast.success("Funnel created");
    setCreateOpen(false);
    setForm({ name: "", steps: [{ event_name: "" }] });
    fetchFunnels();
  }

  async function deleteFunnel(id: string) {
    const res = await fetch(`/api/admin/analytics/funnels/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Funnel deleted");
    if (resultFunnelId === id) setResultFunnelId(null);
    setResult(null);
    fetchFunnels();
  }

  const chartData = result?.steps.map((s, i) => ({
    name: `Step ${i + 1}: ${s.eventName}`,
    count: s.count,
    rate: Math.round(s.conversionRate),
  })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Funnels
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Define multi-step funnels and view conversion counts and rates.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saved funnels</CardTitle>
            <CardDescription>Create a funnel by adding ordered event steps.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>New funnel</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New funnel</DialogTitle>
                <DialogDescription>
                  Add steps in order. Each step is an event name; users are counted if they complete steps in sequence within the date range.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Signup funnel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Steps (event names)</Label>
                  {form.steps.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <Select
                        value={step.event_name || "__none__"}
                        onValueChange={(v) =>
                          setForm((f) => {
                            const next = [...f.steps];
                            next[i] = { ...next[i]!, event_name: v === "__none__" ? "" : v };
                            return { ...f, steps: next };
                          })
                        }
                      >
                        <SelectTrigger className="flex-1">
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
                      {form.steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              steps: f.steps.filter((_, j) => j !== i),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        steps: [...f.steps, { event_name: "" }],
                      }))
                    }
                  >
                    Add step
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createFunnel()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : funnels.length === 0 ? (
            <p className="text-muted-foreground text-sm">No funnels yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnels.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {f.steps.map((s) => s.event_name).join(" → ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadResult(f.id)}
                        >
                          View result
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteFunnel(f.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {resultFunnelId && (
        <Card>
          <CardHeader>
            <CardTitle>Funnel result: {result?.funnelName ?? "…"}</CardTitle>
            <CardDescription>
              Date range for computation. Update and click View result to refresh.
            </CardDescription>
            <div className="flex flex-wrap items-end gap-4 pt-2">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="date"
                  value={resultDates.startDate}
                  onChange={(e) =>
                    setResultDates((d) => ({ ...d, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="date"
                  value={resultDates.endDate}
                  onChange={(e) =>
                    setResultDates((d) => ({ ...d, endDate: e.target.value }))
                  }
                />
              </div>
              <Button
                onClick={() => loadResult(resultFunnelId)}
                disabled={resultLoading}
              >
                {resultLoading ? "Loading…" : "Refresh result"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {resultLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : result && result.steps.length > 0 ? (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Conversion %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.steps.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.eventName}</TableCell>
                        <TableCell>{s.count}</TableCell>
                        <TableCell>{Math.round(s.conversionRate)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : result ? (
              <p className="text-muted-foreground text-sm">No data for this funnel in the selected date range.</p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
