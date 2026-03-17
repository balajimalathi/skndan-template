import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const RazorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z
      .object({
        entity: z
          .object({
            id: z.string(),
            amount: z.number(),
            currency: z.string(),
            status: z.string(),
            notes: z
              .object({
                bookingId: z.string().optional(),
                reference: z.string().optional(),
              })
              .partial()
              .optional(),
          })
          .passthrough(),
      })
      .partial()
      .optional(),
  }),
});

async function findBookingByWebhookNotes(notes: { bookingId?: string; reference?: string } | undefined) {
  if (!notes) return null;

  if (notes.bookingId) {
    const [row] = await db.select().from(booking).where(eq(booking.id, notes.bookingId)).limit(1);
    if (row) return row;
  }

  if (notes.reference) {
    const [row] = await db
      .select()
      .from(booking)
      .where(eq(booking.reference, notes.reference))
      .limit(1);
    if (row) return row;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = RazorpayWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const event = parsed.data.event;
    const paymentEntity = parsed.data.payload.payment?.entity;

    if (!paymentEntity) {
      return NextResponse.json({ ok: true });
    }

    const bookingRow = await findBookingByWebhookNotes(
      (paymentEntity.notes as { bookingId?: string; reference?: string } | undefined) ?? undefined,
    );

    if (!bookingRow) {
      return NextResponse.json({ error: "Booking not found for webhook" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(booking)
        .where(eq(booking.id, bookingRow.id))
        .limit(1);

      if (!current) {
        return;
      }

      if (current.status === "CONFIRMED" || current.paymentStatus === "PAID") {
        return;
      }

      if (event === "payment.captured" || paymentEntity.status === "captured") {
        await tx
          .update(booking)
          .set({
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paymentId: paymentEntity.id,
            amountPaid: (paymentEntity.amount / 100).toString(),
          })
          .where(eq(booking.id, bookingRow.id));
      } else if (event === "payment.failed" || paymentEntity.status === "failed") {
        await tx
          .update(booking)
          .set({
            status: "CANCELLED",
            paymentStatus: "FAILED",
            paymentId: paymentEntity.id,
          })
          .where(eq(booking.id, bookingRow.id));
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error handling Razorpay webhook", error);
    return NextResponse.json({ error: "Failed to handle webhook" }, { status: 500 });
  }
}

