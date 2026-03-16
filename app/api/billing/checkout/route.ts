import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateCustomerForUser, createCheckoutSession } from "@/lib/billing/dodo";
import { getPlanById } from "@/lib/billing/plans";
import { env } from "@/env";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.DODO_PAYMENTS_API_KEY) {
    return NextResponse.json(
      { error: "Billing is not configured" },
      { status: 503 }
    );
  }

  let body: { product_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const productId = body.product_id;
  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 }
    );
  }

  const plan = getPlanById(productId);
  if (!plan) {
    return NextResponse.json(
      { error: "Invalid plan id" },
      { status: 400 }
    );
  }

  const [dbUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const customerId = await getOrCreateCustomerForUser({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      dodoCustomerId: dbUser.dodoCustomerId,
    });

    const baseUrl = env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const { checkoutUrl } = await createCheckoutSession({
      customerId,
      productId,
      successUrl: `${baseUrl}/dashboard/settings/billing?success=1`,
      cancelUrl: `${baseUrl}/dashboard/settings/billing?cancel=1`,
      metadata: { userId: session.user.id },
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
