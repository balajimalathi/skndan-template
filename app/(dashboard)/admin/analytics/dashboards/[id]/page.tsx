"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type Widget = {
  id: string;
  dashboardId: string;
  type: string;
  config: Record<string, unknown> | null;
  position: Record<string, number> | null;
  createdAt: string;
};

type Dashboard = {
  id: string;
  name: string;
  layout: Record<string, unknown> | null;
  createdAt: string;
};

function lastWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAnalyticsDashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [funnels, setFunnels] = useState<{ id: string; name: string }[]>([]);
  const [eventNames, setEventNames] = useState<{ eventName: string }[]>([]);
  const [newWidget, setNewWidget] = useState({
    type: "line_chart" as "funnel" | "retention" | "line_chart",
    funnelId: "",
    startDate: lastWeek(),
    endDate: today(),
    cohortEvent: "",
    returnEvent: "",
    period: "week" as "day" | "week",
    eventName: "",
  });

  const fetchDashboard = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/dashboards/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.replace("/dashboard/admin/analytics/dashboards");
          return;
        }
        toast.error("Failed to load dashboard");
        return;
      }
      const data = await res.json();
      setDashboard(data.dashboard ?? null);
      setWidgets(data.widgets ?? []);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetch("/api/admin/analytics/funnels")
      .then((r) => r.json())
      .then((d) => setFunnels(d.funnels ?? []))
      .catch(() => {});
    fetch(
      `/api/admin/analytics/aggregations?startDate=${newWidget.startDate}&endDate=${newWidget.endDate}`
    )
      .then((r) => r.json())
      .then((d) => setEventNames(d.byEvent ?? []))
      .catch(() => {});
  }, [newWidget.startDate, newWidget.endDate]);

  async function addWidget() {
    const config: Record<string, unknown> = {
      startDate: newWidget.startDate,
      endDate: newWidget.endDate,
    };
    if (newWidget.type === "funnel") config.funnelId = newWidget.funnelId || undefined;
    if (newWidget.type === "retention") {
      config.cohortEvent = newWidget.cohortEvent;
      config.returnEvent = newWidget.returnEvent;
      config.period = newWidget.period;
    }
    if (newWidget.type === "line_chart") config.eventName = newWidget.eventName || undefined;
    const res = await fetch(`/api/admin/analytics/dashboards/${id}/widgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newWidget.type, config }),
    });
    if (!res.ok) {
      toast.error("Failed to add widget");
      return;
    }
    toast.success("Widget added");
    setAddOpen(false);
    fetchDashboard();
  }

  async function removeWidget(widgetId: string) {
    const res = await fetch(
      `/api/admin/analytics/dashboards/${id}/widgets/${widgetId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Failed to remove widget");
      return;
    }
    toast.success("Widget removed");
    fetchDashboard();
  }

  if (loading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/admin/analytics/dashboards"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dashboards
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            {dashboard.name}
          </h1>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>Add widget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add widget</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={newWidget.type}
                  onValueChange={(v) =>
                    setNewWidget((w) => ({ ...w, type: v as typeof newWidget.type }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line_chart">Event trend (line chart)</SelectItem>
                    <SelectItem value="funnel">Funnel</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={newWidget.startDate}
                    onChange={(e) =>
                      setNewWidget((w) => ({ ...w, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={newWidget.endDate}
                    onChange={(e) =>
                      setNewWidget((w) => ({ ...w, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              {newWidget.type === "funnel" && (
                <div className="space-y-2">
                  <Label>Funnel</Label>
                  <Select
                    value={newWidget.funnelId || "__none__"}
                    onValueChange={(v) =>
                      setNewWidget((w) => ({ ...w, funnelId: v === "__none__" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select funnel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {funnels.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newWidget.type === "retention" && (
                <>
                  <div className="space-y-2">
                    <Label>Cohort event</Label>
                    <Select
                      value={newWidget.cohortEvent || "__none__"}
                      onValueChange={(v) =>
                        setNewWidget((w) => ({
                          ...w,
                          cohortEvent: v === "__none__" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                      value={newWidget.returnEvent || "__none__"}
                      onValueChange={(v) =>
                        setNewWidget((w) => ({
                          ...w,
                          returnEvent: v === "__none__" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>Period</Label>
                    <Select
                      value={newWidget.period}
                      onValueChange={(v) =>
                        setNewWidget((w) => ({ ...w, period: v as "day" | "week" }))
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
                </>
              )}
              {newWidget.type === "line_chart" && (
                <div className="space-y-2">
                  <Label>Event name</Label>
                  <Select
                    value={newWidget.eventName || "__none__"}
                    onValueChange={(v) =>
                      setNewWidget((w) => ({
                        ...w,
                        eventName: v === "__none__" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All events</SelectItem>
                      {eventNames.map((n) => (
                        <SelectItem key={n.eventName} value={n.eventName}>
                          {n.eventName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => addWidget()}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {widgets.map((w) => (
          <WidgetCard
            key={w.id}
            widget={w}
            onRemove={() => removeWidget(w.id)}
          />
        ))}
      </div>
      {widgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No widgets yet. Add one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WidgetCard({
  widget,
  onRemove,
}: {
  widget: Widget;
  onRemove: () => void;
}) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const config = widget.config ?? {};
  const startDate = (config.startDate as string) || lastWeek();
  const endDate = (config.endDate as string) || today();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (widget.type === "line_chart") {
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy: "day",
      });
      fetch(`/api/admin/analytics/aggregations?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setData(d.byTime ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else if (widget.type === "funnel" && config.funnelId) {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      fetch(`/api/admin/analytics/funnels/${config.funnelId}/result?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else if (widget.type === "retention" && config.cohortEvent && config.returnEvent) {
      const params = new URLSearchParams({
        cohortEvent: config.cohortEvent as string,
        returnEvent: config.returnEvent as string,
        startDate,
        endDate,
        period: (config.period as string) || "week",
      });
      fetch(`/api/admin/analytics/retention?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [widget.type, widget.config, startDate, endDate]);

  const title =
    widget.type === "line_chart"
      ? `Event trend${config.eventName ? `: ${config.eventName}` : ""}`
      : widget.type === "funnel"
        ? "Funnel"
        : "Retention";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          Remove
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : widget.type === "line_chart" && Array.isArray(data) ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data as { period: string; count: number }[]).map((r) => ({
                  name: r.period?.slice(0, 10) ?? "",
                  count: r.count,
                }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : widget.type === "funnel" && data && typeof data === "object" && "steps" in data ? (
          <ul className="space-y-1 text-sm">
            {(data as { steps: { eventName: string; count: number; conversionRate: number }[] }).steps.map(
              (s: { eventName: string; count: number; conversionRate: number }, i: number) => (
                <li key={i}>
                  {s.eventName}: {s.count} ({Math.round(s.conversionRate)}%)
                </li>
              )
            )}
          </ul>
        ) : widget.type === "retention" && data && typeof data === "object" && "matrix" in data ? (
          <p className="text-muted-foreground text-sm">
            {(data as { matrix: unknown[] }).matrix.length} cohort period
            {(data as { matrix: unknown[] }).matrix.length !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">No data</p>
        )}
      </CardContent>
    </Card>
  );
}
