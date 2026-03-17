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

  it("blocks slots around an existing booking using bufferMinutes", async () => {
    // Existing booking on Monday 2024-01-01 from 10:00 to 11:00 UTC,
    // with org.bufferMinutes = 15, duration = 60.
    await db.insert(booking).values({
      id: "booking-1",
      reference: "REF-1",
      serviceId,
      staffId,
      organizationId: orgId,
      customerName: "Alice",
      customerEmail: "alice@example.com",
      customerPhone: null,
      startTime: new Date("2024-01-01T10:00:00Z"),
      endTime: new Date("2024-01-01T11:00:00Z"),
      status: "CONFIRMED",
      paymentGateway: "FREE",
      paymentId: null,
      paymentStatus: "PENDING",
      amountPaid: null,
      notes: null,
      createdAt: new Date(),
    });

    const slots = await getAvailableSlots({
      orgId,
      staffId,
      serviceId,
      date: "2024-01-01",
    });

    // Availability 09:00–17:00 UTC, 60-minute service, 15-minute buffer.
    // The booking from 10:00–11:00 with ±15 min buffer blocks 09:15–11:15.
    // Candidate starts: 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00.
    // Blocking logic should remove 09:30–11:00 equivalents; in terms of start
    // times this means 09:30 and 10:00 equivalents. With our 60-minute step,
    // 10:00 is removed, but 09:00 and 11:00 remain.
    expect(slots).toContain("09:00");
    expect(slots).not.toContain("10:00");
    expect(slots).toContain("11:00");
  });
});

