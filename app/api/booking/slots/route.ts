import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const orgId = searchParams.get("orgId");
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!orgId || !staffId || !serviceId || !date) {
    return NextResponse.json(
      {
        error: "Missing required query parameters: orgId, staffId, serviceId, date",
      },
      { status: 400 },
    );
  }

  try {
    const slots = await getAvailableSlots({
      orgId,
      staffId,
      serviceId,
      date,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error computing available slots", error);
    return NextResponse.json({ error: "Failed to compute available slots" }, { status: 500 });
  }
}

