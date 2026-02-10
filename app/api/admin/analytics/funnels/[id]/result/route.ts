import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { analyticsEvent, funnel as funnelTable } from "@/lib/db/schema";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

const MAX_EVENTS = 100_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await params;
  const [f] = await db
    .select()
    .from(funnelTable)
    .where(eq(funnelTable.id, id))
    .limit(1);
  if (!f) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return NextResponse.json(
      { error: "Valid startDate and endDate required" },
      { status: 400 }
    );
  }

  const eventNames = f.steps.map((s) => s.event_name);
  const events = await db
    .select({
      id: analyticsEvent.id,
      userId: analyticsEvent.userId,
      anonymousId: analyticsEvent.anonymousId,
      eventName: analyticsEvent.eventName,
      createdAt: analyticsEvent.createdAt,
    })
    .from(analyticsEvent)
    .where(
      and(
        inArray(analyticsEvent.eventName, eventNames),
        gte(analyticsEvent.createdAt, start),
        lte(analyticsEvent.createdAt, end)
      )
    )
    .orderBy(analyticsEvent.createdAt)
    .limit(MAX_EVENTS);

  const actorKey = (e: { userId: string | null; anonymousId: string | null }) =>
    e.userId ?? e.anonymousId ?? "";
  const byActor = new Map<
    string,
    Array<{ eventName: string; createdAt: Date }>
  >();
  for (const e of events) {
    const key = actorKey(e);
    if (!key) continue;
    if (!byActor.has(key)) byActor.set(key, []);
    byActor.get(key)!.push({
      eventName: e.eventName,
      createdAt: e.createdAt,
    });
  }

  const stepCounts: number[] = [];
  for (let i = 0; i < f.steps.length; i++) {
    const stepEvent = f.steps[i]!.event_name;
    let count = 0;
    for (const arr of byActor.values()) {
      const ordered = arr
        .filter((a) => eventNames.includes(a.eventName))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      let timeAfter = 0;
      let completed = true;
      for (let s = 0; s <= i; s++) {
        const need = f.steps[s]!.event_name;
        const idx = ordered.findIndex(
          (o) => o.eventName === need && o.createdAt.getTime() >= timeAfter
        );
        if (idx === -1) {
          completed = false;
          break;
        }
        timeAfter = ordered[idx]!.createdAt.getTime();
      }
      if (completed) count++;
    }
    stepCounts.push(count);
  }

  const firstCount = stepCounts[0] ?? 0;
  const steps = f.steps.map((s, i) => ({
    eventName: s.event_name,
    count: stepCounts[i] ?? 0,
    conversionRate:
      firstCount > 0 ? ((stepCounts[i] ?? 0) / firstCount) * 100 : 0,
  }));

  return NextResponse.json({
    funnelId: id,
    funnelName: f.name,
    start: start.toISOString(),
    end: end.toISOString(),
    steps,
  });
}
