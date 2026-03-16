"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { OrganizationOnboardingSchema, type OrganizationOnboardingInput } from "@/lib/validations/organization-onboarding";
import { updateOrganizationForUser } from "@/lib/server/organization";

export async function updateOrganization(values: OrganizationOnboardingInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const parsed = OrganizationOnboardingSchema.parse(values);

  await updateOrganizationForUser(session.user.id, parsed);
}

