import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { getUserOrganization } from "@/lib/server/organization";
import { CalendarClient } from "./calendar-client";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const organization =
    session?.user ? await getUserOrganization(session.user.id) : null;

  if (!organization) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-muted-foreground">
          We could not determine your organization. Please complete onboarding.
        </p>
      </div>
    );
  }

  return <CalendarClient organizationId={organization.id} />;
}
