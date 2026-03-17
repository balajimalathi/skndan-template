import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking, organization, service, staff } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { format } from "date-fns";

const ManageLookupSchema = z.object({
  reference: z.string().min(4),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ManageLookupSchema.parse(body);

    const rows = await db
      .select({
        booking,
        organization,
        service,
        staff,
      })
      .from(booking)
      .innerJoin(organization, eq(booking.organizationId, organization.id))
      .innerJoin(service, eq(booking.serviceId, service.id))
      .innerJoin(staff, and(eq(booking.staffId, staff.id), eq(staff.organizationId, organization.id)))
      .where(eq(booking.reference, parsed.reference))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const row = rows[0];

    if (parsed.email && row.booking.customerEmail.toLowerCase() !== parsed.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Booking not found for the provided email" },
        { status: 404 },
      );
    }

    const now = new Date();
    const start = row.booking.startTime;
    const org = row.organization;

    const timeUntilStartMs = start.getTime() - now.getTime();
    const timeUntilStartHours = timeUntilStartMs / (1000 * 60 * 60);

    const canCancel =
      row.booking.status === "CONFIRMED" &&
      org.cancellationPolicyHours != null &&
      timeUntilStartHours >= org.cancellationPolicyHours;

    const canReschedule = canCancel;

    const startLabel = format(start, "EEE, MMM d yyyy, HH:mm");
    const endLabel = format(row.booking.endTime, "HH:mm");

    const amountLabel =
      row.booking.amountPaid != null
        ? `${row.booking.amountPaid} ${row.organization.currency}`
        : null;

    return NextResponse.json({
      booking: {
        reference: row.booking.reference,
        organizationName: row.organization.name,
        serviceName: row.service.name,
        staffName: row.staff.slug,
        startTimeLabel: startLabel,
        endTimeLabel: endLabel,
        status: row.booking.status,
        paymentStatus: row.booking.paymentStatus,
        amountLabel,
        canReschedule,
        canCancel,
      },
    });
  } catch (error) {
    console.error("Error looking up booking for manage-booking", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to look up booking" }, { status: 500 });
  }
}

