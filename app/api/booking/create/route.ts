import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking, organization, service, staff } from "@/lib/db/schema";
import { and, eq, lt, gt } from "drizzle-orm";
import { addMinutes } from "date-fns";

const CreateBookingSchema = z.object({
  orgId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateBookingSchema.parse(body);

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, parsed.orgId))
      .limit(1);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const [svc] = await db
      .select()
      .from(service)
      .where(and(eq(service.id, parsed.serviceId), eq(service.organizationId, org.id)))
      .limit(1);
    if (!svc || !svc.isActive) {
      return NextResponse.json({ error: "Service not available" }, { status: 400 });
    }

    const [staffRow] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.id, parsed.staffId), eq(staff.organizationId, org.id)))
      .limit(1);
    if (!staffRow) {
      return NextResponse.json({ error: "Staff not found" }, { status: 400 });
    }

    const [year, month, day] = parsed.date.split("-").map((part) => Number(part));
    const [hour, minute] = parsed.time.split(":").map((part) => Number(part));

    // Organization timezone is fixed to UTC; interpret the provided date+time as UTC.
    const startTimeUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
    const endTimeUtc = addMinutes(startTimeUtc, svc.duration);

    // Enforce that the slot is still available by re-checking against existing bookings.
    const overlapping = await db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.organizationId, org.id),
          eq(booking.staffId, staffRow.id),
          eq(booking.serviceId, svc.id),
          // basic overlap check: start < existingEnd && end > existingStart
          lt(booking.startTime, endTimeUtc),
          gt(booking.endTime, startTimeUtc),
        ),
      );

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: "This slot has just been taken. Please choose another time." },
        { status: 409 },
      );
    }

    const id = crypto.randomUUID();

    await db.insert(booking).values({
      id,
      reference: id,
      organizationId: org.id,
      serviceId: svc.id,
      staffId: staffRow.id,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: null,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
      status: "CONFIRMED",
      paymentGateway: "FREE",
      paymentId: null,
      paymentStatus: "PENDING",
      amountPaid: "0",
      notes: null,
      createdAt: new Date(),
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Error creating booking", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

