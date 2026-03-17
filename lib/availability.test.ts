import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db/db";
import { availability, blackoutDate, booking, organization, service } from "@/lib/db/schema";
import { getAvailableSlots } from "./availability";

describe("getAvailableSlots", () => {
  const orgId = "org-test";
  const staffId = "staff-test";
  const serviceId = "service-test";

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T09:00:00Z"));

    await db.insert(organization).values({
      id: orgId,
      name: "Test Org",
      slug: "test-org",
      logo: null,
      primaryColor: null,
      bookingHeadline: null,
      timezone: "UTC",
      currency: "USD",
      minAdvanceHours: 0,
      maxAdvanceDays: 30,
      bufferMinutes: 15,
      cancellationPolicyHours: 24,
      createdAt: new Date(),
    });

    await db.insert(service).values({
      id: serviceId,
      name: "Test Service",
      description: null,
      duration: 60,
      price: "100",
      depositAmount: null,
      currency: "USD",
      isActive: true,
      organizationId: orgId,
      createdAt: new Date(),
    });

    // Monday 09:00–17:00
    await db.insert(availability).values({
      id: "avail-1",
      staffId,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    });
  });

  afterAll(async () => {
    vi.useRealTimers();
    await db.delete(booking);
    await db.delete(blackoutDate);
    await db.delete(availability);
    await db.delete(service);
    await db.delete(organization);
  });

  it("respects blackout dates", async () => {
    await db.insert(blackoutDate).values({
      id: "blackout-1",
      organizationId: orgId,
      staffId,
      date: new Date("2024-01-01T00:00:00Z"),
      reason: "Holiday",
    });

    const slots = await getAvailableSlots({
      orgId,
      staffId,
      serviceId,
      date: "2024-01-01",
    });

    expect(slots).toEqual([]);
  });

  it("respects advance booking window", async () => {
    const farFutureDate = "2024-02-15";

    const slots = await getAvailableSlots({
      orgId,
      staffId,
      serviceId,
      date: farFutureDate,
    });

    expect(slots).toEqual([]);
  });
});

