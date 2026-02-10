import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { dashboard as dashboardTable, dashboardWidget } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await params;
  const [d] = await db
    .select()
    .from(dashboardTable)
    .where(eq(dashboardTable.id, id))
    .limit(1);
  if (!d) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }
  const widgets = await db
    .select()
    .from(dashboardWidget)
    .where(eq(dashboardWidget.dashboardId, id));
  return NextResponse.json({
    dashboard: {
      ...d,
      createdAt: d.createdAt.toISOString(),
    },
    widgets: widgets.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await params;
  let body: { name?: string; layout?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: Partial<{ name: string; layout: Record<string, unknown> }> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (body.layout && typeof body.layout === "object") updates.layout = body.layout;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  const [updated] = await db
    .update(dashboardTable)
    .set(updates)
    .where(eq(dashboardTable.id, id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }
  return NextResponse.json({
    dashboard: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await params;
  const [deleted] = await db
    .delete(dashboardTable)
    .where(eq(dashboardTable.id, id))
    .returning({ id: dashboardTable.id });
  if (!deleted) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
