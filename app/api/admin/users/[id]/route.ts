import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { user as userTable } from "@/lib/db/schema";
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
  if (id === admin.session!.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role or ban status" },
      { status: 400 }
    );
  }

  let body: { role?: string; banned?: boolean; banReason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Partial<{
    role: string;
    banned: boolean;
    banReason: string;
    banExpires: Date | null;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };

  if (typeof body.role === "string") {
    updates.role = body.role;
  }
  if (typeof body.banned === "boolean") {
    updates.banned = body.banned;
    if (body.banned) {
      updates.banReason = typeof body.banReason === "string" ? body.banReason : null;
      updates.banExpires = null;
    } else {
      updates.banReason = null;
      updates.banExpires = null;
    }
  }

  const [updated] = await db
    .update(userTable)
    .set(updates)
    .where(eq(userTable.id, id))
    .returning({ id: userTable.id });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
