"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type DashboardRow = {
  id: string;
  name: string;
  layout: Record<string, unknown> | null;
  createdAt: string;
};

export default function AdminAnalyticsDashboardsPage() {
  const [dashboards, setDashboards] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/dashboards");
      if (res.ok) {
        const data = await res.json();
        setDashboards(data.dashboards ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  async function createDashboard() {
    const res = await fetch("/api/admin/analytics/dashboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName || "New dashboard" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create dashboard");
      return;
    }
    toast.success("Dashboard created");
    setCreateOpen(false);
    setNewName("");
    fetchDashboards();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Dashboards
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create dashboards and add widgets (funnels, retention, event trends).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saved dashboards</CardTitle>
            <CardDescription>Open a dashboard to add and arrange widgets.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>New dashboard</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New dashboard</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Weekly overview"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createDashboard()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : dashboards.length === 0 ? (
            <p className="text-muted-foreground text-sm">No dashboards yet. Create one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {dashboards.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/dashboard/admin/analytics/dashboards/${d.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <span className="font-medium">{d.name}</span>
                    <span className="ml-2 text-muted-foreground text-sm">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
