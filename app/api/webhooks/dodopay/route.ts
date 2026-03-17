import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DodoPayWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.number(),
    currency: z.string(),
    metadata: z
      .object({
        bookingId: z.string().optional(),
        reference: z.string().optional(),
      })
      .partial()
      .optional(),
  }),
});

async function findBookingByMetadata(meta: { bookingId?: string; reference?: string } | undefined) {
  if (!meta) return null;

  if (meta.bookingId) {
    const [row] = await db.select().from(booking).where(eq(booking.id, meta.bookingId)).limit(1);
    if (row) return row;
  }

  if (meta.reference) {
    const [row] = await db
      .select()
      .from(booking)
      .where(eq(booking.reference, meta.reference))
      .limit(1);
    if (row) return row;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = DodoPayWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const checkout = parsed.data.data;

    const bookingRow = await findBookingByMetadata(
      (checkout.metadata as { bookingId?: string; reference?: string } | undefined) ?? undefined,
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

      if (checkout.status === "succeeded" || checkout.status === "paid") {
        await tx
          .update(booking)
          .set({
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paymentId: checkout.id,
            amountPaid: (checkout.amount / 100).toString(),
          })
          .where(eq(booking.id, bookingRow.id));
      } else if (checkout.status === "failed") {
        await tx
          .update(booking)
          .set({
            status: "CANCELLED",
            paymentStatus: "FAILED",
            paymentId: checkout.id,
          })
          .where(eq(booking.id, bookingRow.id));
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error handling DodoPay webhook", error);
    return NextResponse.json({ error: "Failed to handle webhook" }, { status: 500 });
  }
}

