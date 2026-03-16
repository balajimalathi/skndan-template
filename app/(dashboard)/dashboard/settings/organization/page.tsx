import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserOrganization } from "@/lib/server/organization";
import { OrganizationSettingsForm } from "@/components/onboarding/organization-settings-form";

export default async function OrganizationSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const organization = await getUserOrganization(session.user.id);

  if (!organization) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your organization details and preferences. Changes apply to all members.
        </p>
      </div>
      <OrganizationSettingsForm organization={organization} />
    </div>
  );
}

