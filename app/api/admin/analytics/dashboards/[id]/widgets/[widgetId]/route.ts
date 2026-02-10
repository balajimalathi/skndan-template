import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { dashboardWidget } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

const WIDGET_TYPES = ["funnel", "retention", "line_chart", "table"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id: dashboardId, widgetId } = await params;
  let body: {
    type?: string;
    config?: Record<string, unknown>;
    position?: Record<string, number>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: Partial<{
    type: (typeof WIDGET_TYPES)[number];
    config: Record<string, unknown>;
    position: Record<string, number>;
  }> = {};
  if (body.type && WIDGET_TYPES.includes(body.type as (typeof WIDGET_TYPES)[number])) {
    updates.type = body.type as (typeof WIDGET_TYPES)[number];
  }
  if (body.config && typeof body.config === "object") updates.config = body.config;
  if (body.position && typeof body.position === "object") updates.position = body.position;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  const [updated] = await db
    .update(dashboardWidget)
    .set(updates)
    .where(
      and(
        eq(dashboardWidget.id, widgetId),
        eq(dashboardWidget.dashboardId, dashboardId)
      )
    )
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }
  return NextResponse.json({
    widget: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id: dashboardId, widgetId } = await params;
  const [deleted] = await db
    .delete(dashboardWidget)
    .where(
      and(
        eq(dashboardWidget.id, widgetId),
        eq(dashboardWidget.dashboardId, dashboardId)
      )
    )
    .returning({ id: dashboardWidget.id });
  if (!deleted) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
