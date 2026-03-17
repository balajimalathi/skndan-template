import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking, customer, organization, service, staff } from "@/lib/db/schema";
import { and, eq, lt, gt } from "drizzle-orm";
import { sendBookingConfirmationEmail } from "@/lib/mail/booking-emails";
import { addMinutes } from "date-fns";

const CreateBookingSchema = z.object({
  orgId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5).max(20).optional().nullable(),
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

    const result = await db.transaction(async (tx) => {
      // Re-check slot availability inside the transaction to avoid race conditions.
      const overlapping = await tx
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
        return {
          conflict: true as const,
        };
      }

      // Upsert customer by organization + email.
      const existingCustomer = await tx.query.customer.findFirst({
        where: (c, { and, eq }) =>
          and(eq(c.organizationId, org.id), eq(c.email, parsed.customerEmail)),
      });

      let customerId: string | null = null;

      if (existingCustomer) {
        customerId = existingCustomer.id;
        const shouldUpdatePhone =
          parsed.customerPhone && parsed.customerPhone !== existingCustomer.phone;
        const shouldUpdateName = parsed.customerName !== existingCustomer.name;

        if (shouldUpdateName || shouldUpdatePhone) {
          await tx
            .update(customer)
            .set({
              name: shouldUpdateName ? parsed.customerName : existingCustomer.name,
              phone: shouldUpdatePhone ? parsed.customerPhone : existingCustomer.phone,
            })
            .where(eq(customer.id, existingCustomer.id));
        }
      } else {
        customerId = crypto.randomUUID();
        await tx.insert(customer).values({
          id: customerId,
          organizationId: org.id,
          email: parsed.customerEmail,
          name: parsed.customerName,
          phone: parsed.customerPhone ?? null,
        });
      }

      const id = crypto.randomUUID();
      const reference = id.slice(0, 8).toUpperCase();

      const now = new Date();
      const paymentGateway = org.paymentGateway ?? "FREE";
      const isFree = paymentGateway === "FREE";

      await tx.insert(booking).values({
        id,
        reference,
        organizationId: org.id,
        serviceId: svc.id,
        staffId: staffRow.id,
        customerName: parsed.customerName,
        customerEmail: parsed.customerEmail,
        customerPhone: parsed.customerPhone ?? null,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        status: isFree ? "CONFIRMED" : "PENDING",
        paymentGateway,
        paymentId: null,
        paymentStatus: isFree ? "PAID" : "PENDING",
        amountPaid: isFree ? (svc.price as any) : null,
        notes: null,
        createdAt: now,
      } as typeof booking.$inferInsert);

      return {
        conflict: false as const,
        bookingId: id,
        reference,
        paymentGateway,
        amount: svc.price,
        currency: org.currency,
      };
    });

    if (result.conflict) {
      return NextResponse.json(
        { error: "This slot has just been taken. Please choose another time." },
        { status: 409 },
      );
    }

    try {
      const [created] = await db
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
        .where(eq(booking.id, result.bookingId))
        .limit(1);

      if (created) {
        await sendBookingConfirmationEmail({
          booking: created.booking,
          organization: created.organization,
          service: created.service,
          staff: created.staff,
        });
      }
    } catch (emailError) {
      console.error("Error sending booking confirmation email", emailError);
    }

    return NextResponse.json({
      id: result.bookingId,
      reference: result.reference,
      paymentGateway: result.paymentGateway,
      amount: result.amount,
      currency: result.currency,
    });
  } catch (error) {
    console.error("Error creating booking", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

