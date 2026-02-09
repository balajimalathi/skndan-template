import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { subscription as subscriptionTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptionTable)
    .where(eq(subscriptionTable.userId, session.user.id))
    .orderBy(desc(subscriptionTable.createdAt))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json({
    subscription: {
      id: sub.id,
      productId: sub.productId,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    },
  });
}
