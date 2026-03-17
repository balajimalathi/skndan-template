import { db } from "@/lib/db/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { getUserOrganization } from "@/lib/server/organization";
import { AvailabilityTestClient } from "@/components/dashboard/availability-test-client";

type StaffOption = {
  id: string;
  label: string;
};

type ServiceOption = {
  id: string;
  name: string;
};

async function loadOptions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const org = await getUserOrganization(session.user.id);
  if (!org) {
    throw new Error("Organization not found");
  }

  const staffRows = await db.query.staff.findMany({
    where: (s, { eq }) => eq(s.organizationId, org.id),
  });

  const serviceRows = await db.query.service.findMany({
    where: (svc, { eq }) => eq(svc.organizationId, org.id),
  });

  return {
    orgId: org.id,
    staff: staffRows.map<StaffOption>((s) => ({
      id: s.id,
      label: s.slug,
    })),
    services: serviceRows.map<ServiceOption>((svc) => ({
      id: svc.id,
      name: svc.name,
    })),
  };
}

export default async function AvailabilityTestPage() {
  const data = await loadOptions();

  return (
    <AvailabilityTestClient
      orgId={data.orgId}
      staffOptions={data.staff}
      serviceOptions={data.services}
    />
  );
}

