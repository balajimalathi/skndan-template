import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { analyticsEvent } from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

type Period = "day" | "week";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const cohortEvent = searchParams.get("cohortEvent")?.trim();
  const returnEvent = searchParams.get("returnEvent")?.trim();
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const period = (searchParams.get("period") ?? "week") as Period;

  if (!cohortEvent || !returnEvent) {
    return NextResponse.json(
      { error: "cohortEvent and returnEvent are required" },
      { status: 400 }
    );
  }

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return NextResponse.json(
      { error: "Valid startDate and endDate required" },
      { status: 400 }
    );
  }

  const trunc =
    period === "week"
      ? sql`date_trunc('week', ${analyticsEvent.createdAt})`
      : sql`date_trunc('day', ${analyticsEvent.createdAt})`;

  const cohortEvents = await db
    .select({
      actor: sql<string>`coalesce(${analyticsEvent.userId}, ${analyticsEvent.anonymousId})`.as("actor"),
      period: trunc.as("period"),
    })
    .from(analyticsEvent)
    .where(
      and(
        eq(analyticsEvent.eventName, cohortEvent),
        gte(analyticsEvent.createdAt, start),
        lte(analyticsEvent.createdAt, end)
      )
    );

  const returnEvents = await db
    .select({
      actor: sql<string>`coalesce(${analyticsEvent.userId}, ${analyticsEvent.anonymousId})`.as("actor"),
      createdAt: analyticsEvent.createdAt,
    })
    .from(analyticsEvent)
    .where(
      and(
        eq(analyticsEvent.eventName, returnEvent),
        gte(analyticsEvent.createdAt, start),
        lte(analyticsEvent.createdAt, end)
      )
    );

  const cohortByActor = new Map<string, Date>();
  for (const row of cohortEvents) {
    const actor = row.actor;
    const periodDate = (row as { period: Date }).period;
    if (!actor || !periodDate) continue;
    const existing = cohortByActor.get(actor);
    if (!existing || periodDate < existing) {
      cohortByActor.set(actor, periodDate instanceof Date ? periodDate : new Date(periodDate));
    }
  }

  const returnByActor = new Map<string, Date[]>();
  for (const row of returnEvents) {
    const actor = row.actor;
    if (!actor) continue;
    const t = row.createdAt;
    if (!returnByActor.has(actor)) returnByActor.set(actor, []);
    returnByActor.get(actor)!.push(t);
  }

  const periodKey = (d: Date) => {
    const x = new Date(d);
    if (period === "week") {
      x.setUTCHours(0, 0, 0, 0);
      const day = x.getUTCDay();
      const diff = x.getUTCDate() - day + (day === 0 ? -6 : 1);
      x.setUTCDate(diff);
    } else {
      x.setUTCHours(0, 0, 0, 0);
    }
    return x.getTime();
  };

  const periodsSet = new Set<number>();
  for (const [, d] of cohortByActor) {
    periodsSet.add(periodKey(d));
  }
  const periods = Array.from(periodsSet).sort((a, b) => a - b);

  const matrix: { cohortPeriod: string; total: number; buckets: { period: string; count: number; rate: number }[] }[] = [];

  for (const cohortTime of periods) {
    const cohortDate = new Date(cohortTime);
    const actorsInCohort = Array.from(cohortByActor.entries())
      .filter(([, d]) => periodKey(d) === cohortTime)
      .map(([a]) => a);
    const total = actorsInCohort.length;
    const buckets: { period: string; count: number; rate: number }[] = [];
    for (const p of periods) {
      if (p < cohortTime) continue;
      let count = 0;
      const periodStart = new Date(p);
      const periodEnd = new Date(p);
      if (period === "week") periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);
      else periodEnd.setUTCDate(periodEnd.getUTCDate() + 1);
      for (const actor of actorsInCohort) {
        const times = returnByActor.get(actor) ?? [];
        const inWindow = times.some(
          (t) => t.getTime() >= periodStart.getTime() && t.getTime() < periodEnd.getTime()
        );
        if (inWindow) count++;
      }
      const rate = total > 0 ? (count / total) * 100 : 0;
      buckets.push({
        period: new Date(p).toISOString().slice(0, 10),
        count,
        rate,
      });
    }
    matrix.push({
      cohortPeriod: new Date(cohortTime).toISOString().slice(0, 10),
      total,
      buckets,
    });
  }

  return NextResponse.json({
    cohortEvent,
    returnEvent,
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    matrix,
  });
}
