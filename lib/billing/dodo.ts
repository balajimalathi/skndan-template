import DodoPayments from "dodopayments";
import { env } from "@/env";
import { db } from "@/lib/db/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getClient() {
  const apiKey = env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not set");
  }
  return new DodoPayments({
    bearerToken: apiKey,
    baseURL: env.DODO_PAYMENTS_BASE_URL ?? undefined,
  });
}

export async function createCustomer(params: {
  name: string;
  email: string;
  metadata?: Record<string, string>;
}) {
  const client = getClient();
  const customer = await client.customers.create({
    name: params.name,
    email: params.email,
    metadata: params.metadata ?? {},
  });
  return customer;
}

export async function getOrCreateCustomerForUser(u: {
  id: string;
  name: string;
  email: string;
  dodoCustomerId: string | null;
}) {
  if (u.dodoCustomerId) {
    return u.dodoCustomerId;
  }
  const customer = await createCustomer({
    name: u.name,
    email: u.email,
    metadata: { userId: u.id },
  });
  await db
    .update(user)
    .set({
      dodoCustomerId: customer.customer_id,
      updatedAt: new Date(),
    })
    .where(eq(user.id, u.id));
  return customer.customer_id;
}

export async function createCheckoutSession(params: {
  customerId: string;
  productId: string;
  successUrl: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}) {
  const client = getClient();
  const response = await client.checkoutSessions.create({
    product_cart: [{ product_id: params.productId, quantity: 1 }],
    customer: { customer_id: params.customerId },
    return_url: params.successUrl,
    metadata: params.metadata ?? {},
  });
  return {
    sessionId: response.session_id,
    checkoutUrl: response.checkout_url,
  };
}

export async function getSubscription(subscriptionId: string) {
  const client = getClient();
  return client.subscriptions.retrieve(subscriptionId);
}

export async function listSubscriptions(customerId: string) {
  const client = getClient();
  const list: Array<{
    subscription_id: string;
    product_id: string;
    status: string;
    next_billing_date: string | null;
  }> = [];
  for await (const item of client.subscriptions.list({
    customer_id: customerId,
  })) {
    list.push({
      subscription_id: item.subscription_id,
      product_id: item.product_id,
      status: item.status,
      next_billing_date: item.next_billing_date ?? null,
    });
  }
  return list;
}
