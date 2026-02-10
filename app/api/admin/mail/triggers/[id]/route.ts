import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { emailTrigger } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

const TRIGGER_EVENTS = ["user.signed_up", "subscription.created"] as const;

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
    triggerEvent?: string;
    name?: string;
    subject?: string;
    bodyHtml?: string;
    enabled?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: Partial<{
    triggerEvent: string;
    name: string;
    subject: string;
    bodyHtml: string;
    enabled: boolean;
  }> = {};
  if (body.triggerEvent && TRIGGER_EVENTS.includes(body.triggerEvent as (typeof TRIGGER_EVENTS)[number])) {
    updates.triggerEvent = body.triggerEvent;
  }
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.subject === "string") updates.subject = body.subject;
  if (typeof body.bodyHtml === "string") updates.bodyHtml = body.bodyHtml;
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  const [updated] = await db
    .update(emailTrigger)
    .set(updates)
    .where(eq(emailTrigger.id, id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
  }
  return NextResponse.json({
    trigger: {
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
    .delete(emailTrigger)
    .where(eq(emailTrigger.id, id))
    .returning({ id: emailTrigger.id });
  if (!deleted) {
    return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
