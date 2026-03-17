"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { member, organization, staff, user } from "@/lib/db/schema";
import { StaffProfileSchema, type StaffProfileInput } from "@/lib/validations/staff";
import { and, eq } from "drizzle-orm";

async function getCurrentUserMembership() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const membership = await db.query.member.findFirst({
    where: (m, { eq }) => eq(m.userId, session.user.id),
  });

  if (!membership) {
    throw new Error("User is not a member of any organization");
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, membership.organizationId))
    .limit(1);

  if (!org) {
    throw new Error("Organization not found");
  }

  const [usr] = await db
    .select()
    .from(user)
    .where(eq(user.id, membership.userId))
    .limit(1);

  if (!usr) {
    throw new Error("User not found");
  }

  return {
    userId: membership.userId,
    organizationId: membership.organizationId,
    organizationSlug: org.slug,
    userName: usr.name,
    userEmail: usr.email,
  };
}

export async function getMyStaffProfile() {
  const { userId, organizationId, organizationSlug, userName, userEmail } =
    await getCurrentUserMembership();

  const existing = await db
    .select()
    .from(staff)
    .where(and(eq(staff.userId, userId), eq(staff.organizationId, organizationId)))
    .limit(1);

  const [row] = existing;

  return {
    staff: row
      ? {
          id: row.id,
          slug: row.slug,
          bio: row.bio ?? "",
        }
      : null,
    organizationSlug,
    userName,
    userEmail,
  };
}

const StaffProfileUpdateSchema = StaffProfileSchema;

export async function saveMyStaffProfile(input: StaffProfileInput) {
  const { userId, organizationId } = await getCurrentUserMembership();
  const parsed = StaffProfileUpdateSchema.parse(input);

  const existing = await db
    .select()
    .from(staff)
    .where(and(eq(staff.userId, userId), eq(staff.organizationId, organizationId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(staff).values({
      id: crypto.randomUUID(),
      userId,
      organizationId,
      slug: parsed.slug,
      bio: parsed.bio || null,
    });
  } else {
    const [row] = existing;
    await db
      .update(staff)
      .set({
        slug: parsed.slug,
        bio: parsed.bio || null,
      })
      .where(eq(staff.id, row.id));
  }
}

