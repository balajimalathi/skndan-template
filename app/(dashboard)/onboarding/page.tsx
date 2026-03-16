import { auth } from "@/lib/auth/auth";
import { getUserOrganization } from "@/lib/server/organization";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const organization = await getUserOrganization(session.user.id);

  if (organization) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your organization</h1>
          <p className="text-sm text-muted-foreground">
            We just need a few details to personalize your workspace. You can change these later in
            settings.
          </p>
        </div>
        <OnboardingStepper />
      </div>
    </div>
  );
}

