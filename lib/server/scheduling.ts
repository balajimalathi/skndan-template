import { db } from "@/lib/db/db";
import { organization, service } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type EffectiveOrganizationSettings = {
  id: string;
  timezone: string;
  currency: string;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  cancellationPolicyHours: number;
};

export type EffectiveServiceSettings = {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
  currency: string;
  isActive: boolean;
};

export type EffectiveBookingSettings = {
  organization: EffectiveOrganizationSettings;
  service: EffectiveServiceSettings;
};

export async function getEffectiveBookingSettings(params: {
  orgId: string;
  serviceId: string;
}): Promise<EffectiveBookingSettings | null> {
  const [org] = await db.select().from(organization).where(eq(organization.id, params.orgId)).limit(1);
  if (!org) {
    return null;
  }

  const [svc] = await db
    .select()
    .from(service)
    .where(eq(service.id, params.serviceId))
    .limit(1);

  if (!svc) {
    return null;
  }

  const effectiveOrg: EffectiveOrganizationSettings = {
    id: org.id,
    timezone: org.timezone,
    currency: org.currency,
    minAdvanceHours: org.minAdvanceHours,
    maxAdvanceDays: org.maxAdvanceDays,
    bufferMinutes: org.bufferMinutes,
    cancellationPolicyHours: org.cancellationPolicyHours,
  };

  const effectiveService: EffectiveServiceSettings = {
    id: svc.id,
    name: svc.name,
    durationMinutes: svc.duration,
    price: svc.price,
    currency: svc.currency,
    isActive: svc.isActive,
  };

  return {
    organization: effectiveOrg,
    service: effectiveService,
  };
}

