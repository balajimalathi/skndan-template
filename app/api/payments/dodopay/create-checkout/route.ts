import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { booking, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

const CreateDodoPayCheckoutSchema = z.object({
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
    const parsed = CreateDodoPayCheckoutSchema.parse(body);

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

    if (org.paymentGateway !== "DODOPAYMENTS") {
      return NextResponse.json(
        { error: "Organization is not configured to use DodoPay" },
        { status: 400 },
      );
    }

    if (!org.dodopayClientId || !org.dodopayClientSecret) {
      return NextResponse.json(
        { error: "DodoPay credentials not configured for organization" },
        { status: 422 },
      );
    }

    const checkoutId = `checkout_mock_${parsed.bookingId}`;

    const mockCheckout = {
      id: checkoutId,
      status: "pending",
      amount: parsed.amount,
      currency: parsed.currency,
      bookingId: bookingRow.id,
      organizationId: bookingRow.organizationId,
      redirectUrl: `https://example.com/mock-dodopay/checkout/${checkoutId}`,
    };

    return NextResponse.json({ checkout: mockCheckout });
  } catch (error) {
    console.error("Error creating DodoPay mock checkout", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create DodoPay checkout" },
      { status: 500 },
    );
  }
}

