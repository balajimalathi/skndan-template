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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const TRIGGER_EVENTS = [
  { value: "user.signed_up", label: "User signed up" },
  { value: "subscription.created", label: "Subscription created" },
] as const;

type TriggerRow = {
  id: string;
  triggerEvent: string;
  name: string;
  subject: string;
  bodyHtml: string;
  enabled: boolean;
  createdAt: string;
};

export default function AdminMailPage() {
  const [triggers, setTriggers] = useState<TriggerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    triggerEvent: "user.signed_up",
    name: "",
    subject: "Welcome!",
    bodyHtml: "<p>Hello {{user.name}},</p>",
    enabled: true,
  });

  const fetchTriggers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mail/triggers");
      if (res.ok) {
        const data = await res.json();
        setTriggers(data.triggers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  async function sendTest() {
    if (!testEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Test send failed");
        return;
      }
      toast.success("Test email sent");
    } finally {
      setSendingTest(false);
    }
  }

  async function createTrigger() {
    const res = await fetch("/api/admin/mail/triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create trigger");
      return;
    }
    toast.success("Trigger created");
    setCreateOpen(false);
    setForm({
      triggerEvent: "user.signed_up",
      name: "",
      subject: "Welcome!",
      bodyHtml: "<p>Hello {{user.name}},</p>",
      enabled: true,
    });
    fetchTriggers();
  }

  async function updateTrigger(id: string) {
    const res = await fetch(`/api/admin/mail/triggers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update trigger");
      return;
    }
    toast.success("Trigger updated");
    setEditId(null);
    fetchTriggers();
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    const res = await fetch(`/api/admin/mail/triggers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) {
      toast.error("Failed to update");
      return;
    }
    fetchTriggers();
  }

  async function deleteTrigger(id: string) {
    const res = await fetch(`/api/admin/mail/triggers/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Trigger deleted");
    fetchTriggers();
  }

  function openEdit(t: TriggerRow) {
    setForm({
      triggerEvent: t.triggerEvent,
      name: t.name,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      enabled: t.enabled,
    });
    setEditId(t.id);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Mail
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Configure sending and event-triggered email rules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Mail is sent via Resend. Set <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">RESEND_API_KEY</code> and
            optionally <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">MAIL_FROM</code> in your environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="test-email">Send test email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="you@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button onClick={sendTest} disabled={sendingTest}>
            {sendingTest ? "Sending…" : "Send test"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email triggers</CardTitle>
            <CardDescription>
              Triggers run when events occur (e.g. signup, subscription). Use{" "}
              <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">{`{{user.name}}`}</code>,{" "}
              <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">{`{{user.email}}`}</code> in subject and body.
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Add trigger</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New trigger</DialogTitle>
                <DialogDescription>
                  Create an email that sends when the selected event occurs.
                </DialogDescription>
              </DialogHeader>
              <TriggerForm form={form} setForm={setForm} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createTrigger()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : triggers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No triggers yet. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="secondary">{t.triggerEvent}</Badge>
                    </TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {t.subject}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.enabled}
                        onCheckedChange={(checked) => toggleEnabled(t.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(t)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteTrigger(t.id)}
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

      {editId && (
        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit trigger</DialogTitle>
            </DialogHeader>
            <TriggerForm form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>
                Cancel
              </Button>
              <Button onClick={() => updateTrigger(editId)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TriggerForm({
  form,
  setForm,
}: {
  form: {
    triggerEvent: string;
    name: string;
    subject: string;
    bodyHtml: string;
    enabled: boolean;
  };
  setForm: (f: typeof form) => void;
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Event</Label>
        <Select
          value={form.triggerEvent}
          onValueChange={(v) => setForm({ ...form, triggerEvent: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_EVENTS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Welcome email"
        />
      </div>
      <div className="grid gap-2">
        <Label>Subject</Label>
        <Input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Subject line ({{user.name}} supported)"
        />
      </div>
      <div className="grid gap-2">
        <Label>Body (HTML)</Label>
        <Textarea
          value={form.bodyHtml}
          onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
          rows={6}
          placeholder="<p>Hello {{user.name}},</p>"
          className="font-mono text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.enabled}
          onCheckedChange={(v) => setForm({ ...form, enabled: v })}
        />
        <Label>Enabled</Label>
      </div>
    </div>
  );
}
