import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

const CreateRazorpayOrderSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateRazorpayOrderSchema.parse(body);

    const [bookingRow] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, parsed.bookingId))
      .limit(1);

    if (!bookingRow) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, bookingRow.organizationId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (org.paymentGateway !== "RAZORPAY") {
      return NextResponse.json(
        { error: "Organization is not configured to use Razorpay" },
        { status: 400 },
      );
    }

    if (!org.razorpayKeyId || !org.razorpayKeySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured for organization" },
        { status: 422 },
      );
    }

    const mockOrderId = `order_mock_${parsed.bookingId}`;

    const mockOrder = {
      id: mockOrderId,
      entity: "order",
      amount: parsed.amount,
      currency: parsed.currency,
      status: "created",
      receipt: bookingRow.reference,
      notes: {
        bookingId: bookingRow.id,
        organizationId: bookingRow.organizationId,
      },
    };

    return NextResponse.json({ order: mockOrder });
  } catch (error) {
    console.error("Error creating Razorpay mock order", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 },
    );
  }
}

