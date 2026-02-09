"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type ApiKeyRow = {
  id: string;
  name: string | null;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function ApiKeysCard() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function fetchKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.apiKeys ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function createKey() {
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create API key");
        return;
      }
      setNewKeyValue(data.apiKey);
      setNewKeyName("");
      await fetchKeys();
      toast.success("API key created. Copy it now — it won't be shown again.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchKeys();
        toast.success("API key revoked");
      } else {
        toast.error("Failed to revoke");
      }
    } finally {
      setRevoking(null);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setNewKeyValue(null);
    setNewKeyName("");
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader>
        <CardTitle className="text-zinc-900 dark:text-zinc-100">
          API Keys
        </CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Create and manage API keys to access user resources. Keys can be
          revoked at any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          <>
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"
                >
                  <div>
                    <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      {k.keyPrefix}...
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {k.name || "Unnamed"} • Created{" "}
                      {new Date(k.createdAt).toLocaleDateString()}
                      {k.lastUsedAt &&
                        ` • Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {k.revokedAt ? (
                      <Badge variant="secondary">Revoked</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        onClick={() => revokeKey(k.id)}
                        disabled={revoking === k.id}
                      >
                        {revoking === k.id ? "Revoking..." : "Revoke"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {keys.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No API keys yet. Create one to access resources via API.
                </p>
              )}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-zinc-200 dark:border-zinc-800"
                >
                  Create API key
                </Button>
              </DialogTrigger>
              <DialogContent
                onPointerDownOutside={(e) => {
                  if (newKeyValue) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                  if (newKeyValue) e.preventDefault();
                }}
              >
                <DialogHeader>
                  <DialogTitle>
                    {newKeyValue ? "Copy your API key" : "Create API key"}
                  </DialogTitle>
                  <DialogDescription>
                    {newKeyValue
                      ? "This is the only time you'll see this key. Copy it and store it securely."
                      : "Optionally give this key a name to identify it later."}
                  </DialogDescription>
                </DialogHeader>
                {newKeyValue ? (
                  <div className="space-y-2">
                    <div className="rounded-md bg-zinc-100 dark:bg-zinc-900 p-3 font-mono text-sm break-all">
                      {newKeyValue}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => copyKey(newKeyValue)}
                    >
                      Copy to clipboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Name (optional)</Label>
                    <Input
                      id="key-name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production"
                    />
                  </div>
                )}
                <DialogFooter>
                  {newKeyValue ? (
                    <Button onClick={closeCreateDialog}>Done</Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setCreateOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createKey}
                        disabled={creating}
                      >
                        {creating ? "Creating..." : "Create key"}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
