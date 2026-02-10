import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { dashboard as dashboardTable, dashboardWidget } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

const WIDGET_TYPES = ["funnel", "retention", "line_chart", "table"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id: dashboardId } = await params;
  const [dashboard] = await db
    .select()
    .from(dashboardTable)
    .where(eq(dashboardTable.id, dashboardId))
    .limit(1);
  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }
  let body: {
    type?: string;
    config?: Record<string, unknown>;
    position?: Record<string, number>;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const type = body.type && WIDGET_TYPES.includes(body.type as (typeof WIDGET_TYPES)[number])
    ? (body.type as (typeof WIDGET_TYPES)[number])
    : "line_chart";
  const config = body.config && typeof body.config === "object" ? body.config : {};
  const position = body.position && typeof body.position === "object" ? body.position : {};
  const widgetId = crypto.randomUUID();
  const now = new Date();
  await db.insert(dashboardWidget).values({
    id: widgetId,
    dashboardId,
    type,
    config,
    position,
    createdAt: now,
  });
  return NextResponse.json({
    widget: {
      id: widgetId,
      dashboardId,
      type,
      config,
      position,
      createdAt: now.toISOString(),
    },
  });
}
