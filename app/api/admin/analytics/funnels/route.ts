import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { funnel as funnelTable } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const funnels = await db.select().from(funnelTable);
  return NextResponse.json({
    funnels: funnels.map((f) => ({
      ...f,
      steps: f.steps,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  let body: { name?: string; steps?: Array<{ event_name: string; filter?: Record<string, unknown> }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name : "New funnel";
  const steps = Array.isArray(body.steps)
    ? body.steps
        .filter((s) => s && typeof s.event_name === "string")
        .map((s) => ({ event_name: s.event_name, filter: s.filter }))
    : [];
  if (steps.length === 0) {
    return NextResponse.json(
      { error: "At least one step with event_name required" },
      { status: 400 }
    );
  }
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(funnelTable).values({
    id,
    name,
    steps,
    createdAt: now,
  });
  return NextResponse.json({
    funnel: { id, name, steps, createdAt: now.toISOString() },
  });
}
