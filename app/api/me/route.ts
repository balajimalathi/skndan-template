import { NextResponse } from "next/server";
import { getSessionOrApiKeyUser } from "@/lib/auth/api-key-auth";

export async function GET() {
  const ctx = await getSessionOrApiKeyUser();

  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: ctx.user,
    authSource: ctx.source,
  });
}

