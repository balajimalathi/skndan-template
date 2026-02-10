import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { dashboard as dashboardTable } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const dashboards = await db.select().from(dashboardTable);
  return NextResponse.json({
    dashboards: dashboards.map((d) => ({
      ...d,
      layout: d.layout,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const name = typeof body.name === "string" ? body.name : "New dashboard";
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(dashboardTable).values({
    id,
    name,
    layout: {},
    createdAt: now,
  });
  return NextResponse.json({
    dashboard: { id, name, layout: {}, createdAt: now.toISOString() },
  });
}
