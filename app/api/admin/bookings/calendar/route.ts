import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, between, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { booking, organization, service, staff } from "@/lib/db/schema";
import { BookingCalendarEventDto } from "@/lib/bookings/types";

const QuerySchema = z.object({
  orgId: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
  staffId: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      orgId: url.searchParams.get("orgId"),
      start: url.searchParams.get("start"),
      end: url.searchParams.get("end"),
      staffId: url.searchParams.get("staffId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const start = new Date(parsed.start);
    const end = new Date(parsed.end);

    const where = and(
      eq(booking.organizationId, parsed.orgId),
      between(booking.startTime, start, end),
      parsed.staffId ? eq(booking.staffId, parsed.staffId) : undefined,
      parsed.status ? eq(booking.status, parsed.status as any) : undefined,
    );

    const rows = await db
      .select({
        booking,
        service,
        staff,
        organization,
      })
      .from(booking)
      .innerJoin(service, eq(booking.serviceId, service.id))
      .innerJoin(staff, eq(booking.staffId, staff.id))
      .innerJoin(organization, eq(booking.organizationId, organization.id))
      .where(where);

    const events: BookingCalendarEventDto[] = rows.map((row) => ({
      id: row.booking.id,
      title: row.booking.customerName,
      start: row.booking.startTime.toISOString(),
      end: row.booking.endTime.toISOString(),
      status: row.booking.status,
      staffName: row.staff.slug,
      serviceName: row.service.name,
      customerName: row.booking.customerName,
      paymentStatus: row.booking.paymentStatus,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error loading calendar bookings", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

