import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { analyticsEvent } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get("eventName")?.trim() || undefined;
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const userId = searchParams.get("userId")?.trim() || undefined;
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10))
  );
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const conditions = [];
  if (eventName) {
    conditions.push(eq(analyticsEvent.eventName, eventName));
  }
  if (userId) {
    conditions.push(eq(analyticsEvent.userId, userId));
  }
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

  const [events, countResult] = await Promise.all([
    db
      .select()
      .from(analyticsEvent)
      .where(where)
      .orderBy(desc(analyticsEvent.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvent)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      userId: e.userId,
      anonymousId: e.anonymousId,
      eventName: e.eventName,
      properties: e.properties,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
