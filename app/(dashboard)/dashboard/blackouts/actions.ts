"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { blackoutDate, organization } from "@/lib/db/schema";
import {
  BlackoutDateRangeSchema,
  BlackoutDateSchema,
  type BlackoutDateInput,
  type BlackoutDateRangeInput,
} from "@/lib/validations/blackout-date";
import { and, eq, gte } from "drizzle-orm";

async function getCurrentUserOrg() {
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

  const [org] = await db.select().from(organization).where(eq(organization.id, membership.organizationId));

  if (!org) {
    throw new Error("Organization not found");
  }

  return org;
}

export async function listUpcomingBlackouts() {
  const org = await getCurrentUserOrg();

  const nowUtc = new Date();
  // Start of today in UTC
  const startOfTodayUtc = new Date(
    Date.UTC(
      nowUtc.getUTCFullYear(),
      nowUtc.getUTCMonth(),
      nowUtc.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

  const rows = await db
    .select()
    .from(blackoutDate)
      .where(and(eq(blackoutDate.organizationId, org.id), gte(blackoutDate.date, startOfTodayUtc)))
    .orderBy(blackoutDate.date);

  return rows;
}

function normalizeSingleDateToUtc(input: BlackoutDateInput): Date {
  const [year, month, day] = input.date.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function* enumerateDateRange(from: string, to: string): Generator<string> {
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    yield `${year}-${month}-${day}`;
  }
}

export async function createBlackoutDates(input: BlackoutDateInput | BlackoutDateRangeInput) {
  const org = await getCurrentUserOrg();

  // Decide whether this is a single date or a range based on presence of "from"/"to".
  const isRange = "from" in input && "to" in input;

  if (isRange) {
    const parsed = BlackoutDateRangeSchema.parse(input);
    const dates: Date[] = [];

    for (const iso of enumerateDateRange(parsed.from, parsed.to)) {
      const single: BlackoutDateInput = {
        date: iso,
        staffId: parsed.staffId ?? null,
        reason: parsed.reason,
      };
      dates.push(normalizeSingleDateToUtc(single));
    }

    if (dates.length === 0) return;

    await db.insert(blackoutDate).values(
      dates.map((date) => ({
        id: crypto.randomUUID(),
        organizationId: org.id,
        staffId: ("staffId" in parsed && parsed.staffId) || null,
        date,
        reason: parsed.reason ?? null,
      })),
    );
  } else {
    const parsed = BlackoutDateSchema.parse(input);
    const date = normalizeSingleDateToUtc(parsed);

    await db.insert(blackoutDate).values({
      id: crypto.randomUUID(),
      organizationId: org.id,
      staffId: parsed.staffId ?? null,
      date,
      reason: parsed.reason ?? null,
    });
  }
}

export async function deleteBlackoutDate(id: string) {
  const org = await getCurrentUserOrg();

  await db
    .delete(blackoutDate)
    .where(and(eq(blackoutDate.id, id), eq(blackoutDate.organizationId, org.id)));
}

