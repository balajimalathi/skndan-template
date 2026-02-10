import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { funnel as funnelTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await params;
  let body: {
    name?: string;
    steps?: Array<{ event_name: string; filter?: Record<string, unknown> }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: Partial<{ name: string; steps: Array<{ event_name: string; filter?: Record<string, unknown> }> }> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (Array.isArray(body.steps) && body.steps.length > 0) {
    updates.steps = body.steps
      .filter((s) => s && typeof s.event_name === "string")
      .map((s) => ({ event_name: s.event_name, filter: s.filter }));
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  const [updated] = await db
    .update(funnelTable)
    .set(updates)
    .where(eq(funnelTable.id, id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
  return NextResponse.json({
    funnel: {
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
    .delete(funnelTable)
    .where(eq(funnelTable.id, id))
    .returning({ id: funnelTable.id });
  if (!deleted) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
