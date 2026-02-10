import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { emailTrigger } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";

const TRIGGER_EVENTS = ["user.signed_up", "subscription.created"] as const;

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const triggers = await db.select().from(emailTrigger);
  return NextResponse.json({
    triggers: triggers.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
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
  const triggerEvent =
    body.triggerEvent && TRIGGER_EVENTS.includes(body.triggerEvent as (typeof TRIGGER_EVENTS)[number])
      ? body.triggerEvent
      : TRIGGER_EVENTS[0];
  const name = typeof body.name === "string" ? body.name : "New trigger";
  const subject = typeof body.subject === "string" ? body.subject : "Hello";
  const bodyHtml = typeof body.bodyHtml === "string" ? body.bodyHtml : "<p>Hello {{user.name}}</p>";
  const enabled = typeof body.enabled === "boolean" ? body.enabled : true;
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(emailTrigger).values({
    id,
    triggerEvent,
    name,
    subject,
    bodyHtml,
    enabled,
    createdAt: now,
  });
  return NextResponse.json({
    trigger: {
      id,
      triggerEvent,
      name,
      subject,
      bodyHtml,
      enabled,
      createdAt: now.toISOString(),
    },
  });
}
