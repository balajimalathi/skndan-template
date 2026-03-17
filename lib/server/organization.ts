import { db } from "@/lib/db/db";
import { member, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserOrganization(userId: string) {
  const membership = await db.query.member.findFirst({
    where: (m, { eq }) => eq(m.userId, userId),
  });

  if (!membership) {
    return null;
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, membership.organizationId))
    .limit(1);

  return org ?? null;
}

export type OrganizationOnboardingInput = {
  name: string;
  slug: string;
  logo?: string | null;
  primaryColor?: string | null;
  bookingHeadline?: string | null;
  currency: (typeof organization.$inferInsert)["currency"];
  minAdvanceHours: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  cancellationPolicyHours: number;
};

export async function createOrganizationForUser(userId: string, data: OrganizationOnboardingInput) {
  const orgId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(organization).values({
      id: orgId,
      name: data.name,
      slug: data.slug,
      logo: data.logo ?? null,
      primaryColor: data.primaryColor ?? null,
      bookingHeadline: data.bookingHeadline ?? null,
      timezone: "UTC",
      currency: data.currency,
      minAdvanceHours: data.minAdvanceHours,
      maxAdvanceDays: data.maxAdvanceDays,
      bufferMinutes: data.bufferMinutes,
      cancellationPolicyHours: data.cancellationPolicyHours,
      createdAt: new Date(),
    });

    await tx.insert(member).values({
      id: crypto.randomUUID(),
      userId,
      organizationId: orgId,
      role: "ADMIN",
    });
  });
}

export async function updateOrganizationForUser(userId: string, data: OrganizationOnboardingInput) {
  const membership = await db.query.member.findFirst({
    where: (m, { eq }) => eq(m.userId, userId),
  });

  if (!membership) {
    throw new Error("User is not a member of any organization");
  }

  await db
    .update(organization)
    .set({
      name: data.name,
      slug: data.slug,
      logo: data.logo ?? null,
      primaryColor: data.primaryColor ?? null,
      bookingHeadline: data.bookingHeadline ?? null,
      timezone: "UTC",
      currency: data.currency,
      minAdvanceHours: data.minAdvanceHours,
      maxAdvanceDays: data.maxAdvanceDays,
      bufferMinutes: data.bufferMinutes,
      cancellationPolicyHours: data.cancellationPolicyHours,
    })
    .where(eq(organization.id, membership.organizationId));
}

