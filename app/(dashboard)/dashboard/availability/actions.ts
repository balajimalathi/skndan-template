"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { availability, organization, staff } from "@/lib/db/schema";
import { AvailabilitySettingsSchema, type AvailabilitySettingsInput } from "@/lib/validations/availability-settings";
import { eq, and } from "drizzle-orm";

// Monday–Sunday indices used in the UI; we persist dayOfWeek as 0–6.
const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

async function getCurrentUserOrgAndStaff() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Find the member record to resolve organization.
  const membership = await db.query.member.findFirst({
    where: (m, { eq }) => eq(m.userId, session.user.id),
  });

  if (!membership) {
    throw new Error("User is not a member of any organization");
  }

  // For now, we assume one staff record per user per org and scope availability by staffId.
  const staffRow = await db.query.staff.findFirst({
    where: (s, { eq, and }) =>
      and(eq(s.userId, session.user.id), eq(s.organizationId, membership.organizationId)),
  });

  if (!staffRow) {
    throw new Error("Staff profile not found for current user");
  }

  return {
    orgId: membership.organizationId,
    staffId: staffRow.id,
  };
}

export async function getAvailabilitySettings(): Promise<AvailabilitySettingsInput> {
  const { orgId, staffId } = await getCurrentUserOrgAndStaff();

  const [org] = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);

  if (!org) {
    throw new Error("Organization not found");
  }

  const rows = await db.query.availability.findMany({
    where: (a, { eq, and }) => and(eq(a.staffId, staffId)),
  });

  const days: AvailabilitySettingsInput["days"] = DAY_INDICES.map((dayIndex) => {
    const rowForDay = rows.find((row) => row.dayOfWeek === dayIndex);

    if (!rowForDay) {
      // Default: closed 09:00–17:00 (used only if user activates the day)
      return {
        isActive: false,
        startTime: "09:00",
        endTime: "17:00",
      };
    }

    return {
      isActive: rowForDay.isActive,
      startTime: rowForDay.startTime,
      endTime: rowForDay.endTime,
    };
  });

  return {
    days,
    bufferMinutes: org.bufferMinutes,
  };
}

export async function saveAvailabilitySettings(values: AvailabilitySettingsInput): Promise<void> {
  const { orgId, staffId } = await getCurrentUserOrgAndStaff();

  const parsed = AvailabilitySettingsSchema.parse(values);

  // Update organization buffer minutes if it has changed.
  await db
    .update(organization)
    .set({ bufferMinutes: parsed.bufferMinutes })
    .where(eq(organization.id, orgId));

  const existingRows = await db.query.availability.findMany({
    where: (a, { eq, and }) => and(eq(a.staffId, staffId)),
  });

  for (const [index, dayIndex] of DAY_INDICES.entries()) {
    const dayInput = parsed.days[index];
    const existing = existingRows.find((row) => row.dayOfWeek === dayIndex);

    if (!existing) {
      // Only create a row when the day is active.
      if (!dayInput.isActive) continue;

      await db.insert(availability).values({
        id: crypto.randomUUID(),
        staffId,
        dayOfWeek: dayIndex,
        startTime: dayInput.startTime,
        endTime: dayInput.endTime,
        isActive: dayInput.isActive,
      });
      continue;
    }

    // Update existing row with latest values, including deactivation.
    await db
      .update(availability)
      .set({
        startTime: dayInput.startTime,
        endTime: dayInput.endTime,
        isActive: dayInput.isActive,
      })
      .where(and(eq(availability.id, existing.id), eq(availability.staffId, staffId)));
  }
}

