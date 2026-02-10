import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { env } from "@/env";
import { db } from "@/lib/db/db";
import { user as userTable, subscription as subscriptionTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SUBSCRIPTION_EVENTS = [
  "subscription.active",
  "subscription.renewed",
  "subscription.on_hold",
  "subscription.cancelled",
  "subscription.failed",
  "subscription.expired",
  "subscription.plan_changed",
  "subscription.updated",
] as const;

export async function POST(request: Request) {
  if (!env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY ?? "",
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_SECRET,
  });

  let event: { type: string; data?: { payload_type?: string; subscription_id?: string; product_id?: string; status?: string; next_billing_date?: string; customer?: { customer_id: string }; metadata?: Record<string, string> } };
  try {
    event = client.webhooks.unwrap(rawBody, {
      headers,
      key: env.DODO_PAYMENTS_WEBHOOK_SECRET,
    }) as typeof event;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!SUBSCRIPTION_EVENTS.includes(event.type as (typeof SUBSCRIPTION_EVENTS)[number])) {
    return NextResponse.json({ received: true });
  }

  const data = event.data;
  if (!data || data.payload_type !== "Subscription") {
    return NextResponse.json({ received: true });
  }

  const subscriptionId = data.subscription_id;
  const productId = data.product_id;
  const status = data.status;
  const nextBillingDate = data.next_billing_date
    ? new Date(data.next_billing_date)
    : null;

  let userId: string | null = null;
  if (data.metadata?.userId) {
    userId = data.metadata.userId;
  } else if (data.customer?.customer_id) {
    const [u] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.dodoCustomerId, data.customer.customer_id))
      .limit(1);
    if (u) userId = u.id;
  }

  if (!userId) {
    console.warn("Dodo webhook: could not resolve userId for subscription", subscriptionId);
    return NextResponse.json({ received: true });
  }

  const now = new Date();

  await db
    .insert(subscriptionTable)
    .values({
      id: subscriptionId,
      userId,
      dodoSubscriptionId: subscriptionId,
      productId,
      status: status ?? "unknown",
      currentPeriodEnd: nextBillingDate,
      createdAt: now,
      updatedAt: now,
    } as typeof subscriptionTable.$inferInsert)
    .onConflictDoUpdate({
      target: subscriptionTable.dodoSubscriptionId,
      set: {
        productId,
        status: status ?? "unknown",
        currentPeriodEnd: nextBillingDate,
        updatedAt: now,
      },
    });

  const [userRow] = await db
    .select({ email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  if (userRow?.email) {
    const { runTriggers } = await import("@/lib/mail/run-triggers");
    await runTriggers("subscription.created", {
      to: userRow.email,
      user: { email: userRow.email, name: userRow.name },
      subscription: {
        id: subscriptionId,
        productId,
        status: status ?? "unknown",
      },
    });
  }

  return NextResponse.json({ received: true });
}
