import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutForBooking } from "@/lib/server/payments";

const CreateCheckoutSchema = z.object({
  bookingId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCheckoutSchema.parse(body);

    const result = await createCheckoutForBooking({
      bookingId: parsed.bookingId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating checkout", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout",
      },
      { status: 500 },
    );
  }
}

