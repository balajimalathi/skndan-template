import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // Placeholder Razorpay webhook endpoint for future implementation.
  // For now, we simply acknowledge receipt so the route exists and can be wired up later.
  return NextResponse.json({ received: true });
}

