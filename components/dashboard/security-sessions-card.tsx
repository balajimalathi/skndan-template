"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SessionItem = {
  id: string;
  device: string;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export function SecuritySessionsCard() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) await fetchSessions();
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllOther() {
    setRevokeAllLoading(true);
    try {
      const res = await fetch("/api/sessions/revoke-all", { method: "POST" });
      if (res.ok) await fetchSessions();
    } finally {
      setRevokeAllLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No sessions found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-start justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
        >
          <div className="space-y-0.5">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {session.device}
            </h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {session.ipAddress ?? "Unknown"} •{" "}
              {new Date(session.createdAt).toLocaleString()}
              {session.isCurrent && " • Active now"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session.isCurrent && (
              <span className="text-sm font-medium text-green-600 dark:text-green-500">
                Current
              </span>
            )}
            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                onClick={() => revokeSession(session.id)}
                disabled={revoking === session.id}
              >
                {revoking === session.id ? "Signing out..." : "Sign out"}
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
        onClick={revokeAllOther}
        disabled={revokeAllLoading || sessions.length <= 1}
      >
        {revokeAllLoading ? "Signing out..." : "Sign out all other devices"}
      </Button>
    </div>
  );
}
