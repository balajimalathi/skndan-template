import { NextResponse } from "next/server";
import { getSessionOrApiKeyUser } from "@/lib/auth/api-key-auth";
import { db } from "@/lib/db/db";
import { analyticsEvent } from "@/lib/db/schema";

type EventPayload = {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  anonymousId?: string;
};

type BatchPayload = {
  events: EventPayload[];
};

function isValidEventName(name: unknown): name is string {
  return typeof name === "string" && name.length > 0 && name.length <= 256;
}

export async function POST(request: Request) {
  const ctx = await getSessionOrApiKeyUser();
  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized: session or API key required" },
      { status: 401 }
    );
  }

  const userId = ctx.user.id;
  let body: EventPayload | BatchPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toInsert: Array<{
    id: string;
    userId: string | null;
    anonymousId: string | null;
    eventName: string;
    properties: Record<string, unknown> | null;
    createdAt: Date;
  }> = [];
  const now = new Date();

  if (Array.isArray((body as BatchPayload).events)) {
    const batch = (body as BatchPayload).events;
    for (const item of batch.slice(0, 100)) {
      const eventName = item?.event;
      if (!isValidEventName(eventName)) continue;
      toInsert.push({
        id: crypto.randomUUID(),
        userId,
        anonymousId: typeof item.anonymousId === "string" ? item.anonymousId : null,
        eventName,
        properties:
          item.properties && typeof item.properties === "object"
            ? (item.properties as Record<string, unknown>)
            : null,
        createdAt: now,
      });
    }
  } else {
    const single = body as EventPayload;
    const eventName = single?.event;
    if (!isValidEventName(eventName)) {
      return NextResponse.json(
        { error: "Missing or invalid 'event' string" },
        { status: 400 }
      );
    }
    toInsert.push({
      id: crypto.randomUUID(),
      userId,
      anonymousId: typeof single.anonymousId === "string" ? single.anonymousId : null,
      eventName,
      properties:
        single.properties && typeof single.properties === "object"
          ? single.properties
          : null,
      createdAt: now,
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json(
      { error: "No valid events to insert" },
      { status: 400 }
    );
  }

  await db.insert(analyticsEvent).values(toInsert);

  return new NextResponse(null, { status: 204 });
}
