import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { analyticsEvent } from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

type GroupBy = "day" | "week";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const groupBy = (searchParams.get("groupBy") ?? "day") as GroupBy;

  const conditions = [];
  if (startDate) {
    const d = new Date(startDate);
    if (!Number.isNaN(d.getTime())) {
      conditions.push(gte(analyticsEvent.createdAt, d));
    }
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!Number.isNaN(d.getTime())) {
      conditions.push(lte(analyticsEvent.createdAt, d));
    }
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const dateTrunc =
    groupBy === "week"
      ? sql`date_trunc('week', ${analyticsEvent.createdAt})`.as("period")
      : sql`date_trunc('day', ${analyticsEvent.createdAt})`.as("period");

  const byEvent = await db
    .select({
      eventName: analyticsEvent.eventName,
      count: sql<number>`count(*)::int`,
    })
    .from(analyticsEvent)
    .where(where)
    .groupBy(analyticsEvent.eventName);

  const byTime = await db
    .select({
      period: dateTrunc,
      count: sql<number>`count(*)::int`,
    })
    .from(analyticsEvent)
    .where(where)
    .groupBy(dateTrunc)
    .orderBy(dateTrunc);

  return NextResponse.json({
    byEvent: byEvent.map((r) => ({ eventName: r.eventName, count: r.count })),
    byTime: byTime.map((r) => ({
      period: (r.period as Date)?.toISOString?.() ?? String(r.period),
      count: r.count,
    })),
  });
}
