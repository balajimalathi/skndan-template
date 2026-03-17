"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { member, organization, service } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ServiceSchema, type ServiceInput } from "@/lib/validations/service";
import { z } from "zod";

async function getCurrentUserOrganizationId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const [m] = await db
    .select()
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  if (!m) {
    throw new Error("Organization not found for user");
  }

  return m.organizationId;
}

export async function listServices() {
  const orgId = await getCurrentUserOrganizationId();

  const rows = await db
    .select({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      currency: service.currency,
      isActive: service.isActive,
      createdAt: service.createdAt,
    })
    .from(service)
    .where(eq(service.organizationId, orgId))
    .orderBy(service.createdAt);

  return rows;
}

export async function createService(input: ServiceInput) {
  const orgId = await getCurrentUserOrganizationId();

  const parsed = ServiceSchema.parse(input);

  const [org] = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
  if (!org) {
    throw new Error("Organization not found");
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(service).values({
    id,
    name: parsed.name,
    description: parsed.description || null,
    duration: parsed.durationMinutes,
    price: parsed.price,
    depositAmount: parsed.depositAmount ?? null,
    currency: parsed.currency || org.currency,
    isActive: parsed.isActive ?? true,
    organizationId: orgId,
    createdAt: now,
  });

  return { id };
}

const ServiceUpdateSchema = ServiceSchema.extend({
  id: z.string().min(1),
});

export async function updateService(input: z.infer<typeof ServiceUpdateSchema>) {
  const orgId = await getCurrentUserOrganizationId();
  const parsed = ServiceUpdateSchema.parse(input);

  const existing = await db
    .select()
    .from(service)
    .where(eq(service.id, parsed.id))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Service not found");
  }

  const [row] = existing;
  if (row.organizationId !== orgId) {
    throw new Error("Not authorized to update this service");
  }

  await db
    .update(service)
    .set({
      name: parsed.name,
      description: parsed.description || null,
      duration: parsed.durationMinutes,
      price: parsed.price,
      depositAmount: parsed.depositAmount ?? null,
      currency: parsed.currency,
      isActive: parsed.isActive,
    })
    .where(eq(service.id, parsed.id));
}

export async function toggleServiceActive(params: { id: string; isActive: boolean }) {
  const orgId = await getCurrentUserOrganizationId();
  const parsed = z
    .object({
      id: z.string().min(1),
      isActive: z.boolean(),
    })
    .parse(params);

  const existing = await db
    .select()
    .from(service)
    .where(eq(service.id, parsed.id))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Service not found");
  }

  const [row] = existing;
  if (row.organizationId !== orgId) {
    throw new Error("Not authorized to update this service");
  }

  await db
    .update(service)
    .set({ isActive: parsed.isActive })
    .where(eq(service.id, parsed.id));
}

export async function ensureActiveServiceExists(orgId: string) {
  const rows = await db
    .select({ id: service.id })
    .from(service)
    .where(eq(service.organizationId, orgId));

  return rows.some((row) => row.id);
}

