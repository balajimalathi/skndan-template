import { db } from "@/lib/db/db";
import {
  availability,
  blackoutDate,
  booking,
  organization,
  service,
} from "@/lib/db/schema";
import { and, eq, gte, lt, or, isNull, ne } from "drizzle-orm";
import tz from "date-fns-tz";
import { addMinutes, format } from "date-fns";

/**
 * Compute all available booking start times for a given staff member, service and date.
 *
 * Time & timezone model:
 * - Bookings and blackout dates are stored as UTC timestamps in the database.
 * - The `organization.timezone` defines the local timezone used for business hours and the
 *   `date` parameter of this function.
 * - Working hours in the `availability` table are stored as \"HH:MM\" strings and are interpreted
 *   in the organization's local timezone.
 *
 * The high level algorithm:
 * 1. Resolve the organization's timezone and derive the local day window and day-of-week index.
 * 2. Load the staff's availability window for that day.
 * 3. Check if the day is blacked out at org or staff level.
 * 4. Load the service duration and organization buffer minutes.
 * 5. Generate candidate start times inside the working window spaced by service duration.
 * 6. Apply the organization's min/max advance booking window.
 * 7. Load existing non-cancelled bookings for the staff on that day.
 * 8. Filter out any candidate whose [start, start+duration) overlaps an existing booking
 *    once the booking window has been expanded by the configured buffer before and after.
 * 9. Return remaining candidate start times formatted as \"HH:MM\" in the org timezone.
 */
export async function getAvailableSlots(params: {
  orgId: string;
  staffId: string;
  serviceId: string;
  date: string; // "YYYY-MM-DD" in organization local time
}): Promise<string[]> {
  const { orgId, staffId, serviceId, date } = params;

  // 1. Resolve organization timezone & target local day window
  const [org] = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);

  if (!org) {
    return [];
  }

  const timezone = org.timezone;

  // Parse the provided date as a local day in the org's timezone.
  const [year, month, day] = date.split("-").map((part) => Number(part));
  const localStartOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayStartUtc = tz.zonedTimeToUtc(localStartOfDay, timezone);
  const nextDayStartUtc = addMinutes(dayStartUtc, 24 * 60);

  // Determine the day-of-week index (0–6) in the organization's local time.
  const localDay = tz.utcToZonedTime(dayStartUtc, timezone);
  const dayOfWeek = localDay.getDay();

  // 2. Load staff availability for this day-of-week.
  const availabilityRow = await db.query.availability.findFirst({
    where: (a, { eq, and }) => and(eq(a.staffId, staffId), eq(a.dayOfWeek, dayOfWeek)),
  });

  if (!availabilityRow || !availabilityRow.isActive) {
    // No working hours configured or day is marked closed.
    return [];
  }

  // Build the working window in local time by combining the date and HH:MM strings.
  const [startHour, startMinute] = availabilityRow.startTime.split(":").map((s) => Number(s));
  const [endHour, endMinute] = availabilityRow.endTime.split(":").map((s) => Number(s));

  const availabilityStartLocal = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
  const availabilityEndLocal = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

  if (availabilityEndLocal <= availabilityStartLocal) {
    // Misconfigured window (end before or equal to start) -> treat as closed.
    return [];
  }

  const availabilityStartUtc = tz.zonedTimeToUtc(availabilityStartLocal, timezone);
  const availabilityEndUtc = tz.zonedTimeToUtc(availabilityEndLocal, timezone);

  // 3. Check blackout dates (organization-level or staff-level) for this local day.
  const blackoutRows = await db
    .select()
    .from(blackoutDate)
    .where(
      and(
        eq(blackoutDate.organizationId, orgId),
        gte(blackoutDate.date, dayStartUtc),
        lt(blackoutDate.date, nextDayStartUtc),
        // staffId null means org-wide blackout; a specific staffId means staff blackout.
        // Any blackout that is either org-wide or matches this staff blocks the whole day.
        or(isNull(blackoutDate.staffId), eq(blackoutDate.staffId, staffId)),
      ),
    );

  if (blackoutRows.length > 0) {
    return [];
  }

  // 4. Load service duration & compute step.
  const [svc] = await db.select().from(service).where(eq(service.id, serviceId)).limit(1);
  if (!svc || !svc.isActive) {
    return [];
  }

  const durationMinutes = svc.duration;
  const bufferMinutes = org.bufferMinutes;
  const stepMinutes = durationMinutes;

  // 5. Generate candidate slots inside working window.
  const candidateStartsUtc: Date[] = [];
  let cursor = new Date(availabilityStartUtc);

  // We allow the last slot to start such that its end time (start + duration) still
  // fits inside the working window. Buffers are enforced around existing bookings,
  // not between arbitrary slots.
  while (addMinutes(cursor, durationMinutes) <= availabilityEndUtc) {
    candidateStartsUtc.push(new Date(cursor));
    cursor = addMinutes(cursor, stepMinutes);
  }

  if (candidateStartsUtc.length === 0) {
    return [];
  }

  // Apply organization-level advance booking window rules.
  if (org.minAdvanceHours != null || org.maxAdvanceDays != null) {
    const nowUtc = new Date();
    const nowLocal = tz.utcToZonedTime(nowUtc, timezone);

    const earliestAllowedLocal =
      org.minAdvanceHours != null ? addMinutes(nowLocal, org.minAdvanceHours * 60) : nowLocal;
    const latestAllowedLocal =
      org.maxAdvanceDays != null ? addMinutes(nowLocal, org.maxAdvanceDays * 24 * 60) : undefined;

    const earliestAllowedUtc = tz.zonedTimeToUtc(earliestAllowedLocal, timezone);
    const latestAllowedUtc =
      latestAllowedLocal != null ? tz.zonedTimeToUtc(latestAllowedLocal, timezone) : undefined;

    for (let i = candidateStartsUtc.length - 1; i >= 0; i--) {
      const start = candidateStartsUtc[i];
      if (start < earliestAllowedUtc) {
        candidateStartsUtc.splice(i, 1);
        continue;
      }
      if (latestAllowedUtc && start > latestAllowedUtc) {
        candidateStartsUtc.splice(i, 1);
      }
    }

    if (candidateStartsUtc.length === 0) {
      return [];
    }
  }

  // 7. Load existing non-cancelled bookings for this staff on the target day.
  const bookingRows = await db
    .select()
    .from(booking)
    .where(
      and(
        eq(booking.organizationId, orgId),
        eq(booking.staffId, staffId),
        gte(booking.startTime, dayStartUtc),
        lt(booking.startTime, nextDayStartUtc),
        // status NOT EQUAL to CANCELLED
        ne(booking.status, "CANCELLED"),
      ),
    );

  // 8. Filter out overlapping slots, expanding each booking by the organization's buffer
  // before and after.
  const isOverlapping = (slotStart: Date, slotEnd: Date) =>
    bookingRows.some((b) => {
      const bookingStart = addMinutes(b.startTime, -bufferMinutes);
      const bookingEnd = addMinutes(b.endTime, bufferMinutes);
      // Intervals [slotStart, slotEnd) and [bookingStart, bookingEnd) overlap
      // iff each starts before the other ends.
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });

  const availableSlotsUtc = candidateStartsUtc.filter((startUtc) => {
    const endUtc = addMinutes(startUtc, durationMinutes);
    return !isOverlapping(startUtc, endUtc);
  });

  // 9. Convert remaining starts to \"HH:MM\" strings in org local time.
  const result = availableSlotsUtc.map((slotStartUtc) => {
    const local = tz.utcToZonedTime(slotStartUtc, timezone);
    return format(local, "HH:mm");
  });

  return result;
}

