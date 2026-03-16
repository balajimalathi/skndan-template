"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { OrganizationOnboardingSchema, type OrganizationOnboardingInput } from "@/lib/validations/organization-onboarding";
import { createOrganizationForUser } from "@/lib/server/organization";

export async function submitOrganizationOnboarding(values: OrganizationOnboardingInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const parsed = OrganizationOnboardingSchema.parse(values);

  await createOrganizationForUser(session.user.id, parsed);

  redirect("/dashboard");
}

