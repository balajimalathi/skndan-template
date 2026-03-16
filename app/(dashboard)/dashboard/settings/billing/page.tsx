import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { subscription as subscriptionTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { plans } from "@/lib/billing/plans";
import BillingSection from "@/components/dashboard/billing-section";

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  let subscription: { productId: string; status: string; currentPeriodEnd: string | null } | null = null;
  if (session?.user) {
    const [sub] = await db
      .select({
        productId: subscriptionTable.productId,
        status: subscriptionTable.status,
        currentPeriodEnd: subscriptionTable.currentPeriodEnd,
      })
      .from(subscriptionTable)
      .where(eq(subscriptionTable.userId, session.user.id))
      .orderBy(desc(subscriptionTable.createdAt))
      .limit(1);
    if (sub) {
      subscription = {
        productId: sub.productId,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      };
    }
  }
  return (
    <div className="px-4">
      <BillingSection subscription={subscription} plans={plans} />
    </div>
  );
}
