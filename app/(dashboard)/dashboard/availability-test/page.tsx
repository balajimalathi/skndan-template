"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db/db";
import { organization, service, staff } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { getUserOrganization } from "@/lib/server/organization";

type StaffOption = {
  id: string;
  label: string;
};

type ServiceOption = {
  id: string;
  name: string;
};

async function loadOptions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const org = await getUserOrganization(session.user.id);
  if (!org) {
    throw new Error("Organization not found");
  }

  const staffRows = await db.query.staff.findMany({
    where: (s, { eq }) => eq(s.organizationId, org.id),
  });

  const serviceRows = await db.query.service.findMany({
    where: (svc, { eq }) => eq(svc.organizationId, org.id),
  });

  return {
    orgId: org.id,
    staff: staffRows.map<StaffOption>((s) => ({
      id: s.id,
      label: s.slug,
    })),
    services: serviceRows.map<ServiceOption>((svc) => ({
      id: svc.id,
      name: svc.name,
    })),
  };
}

export default function AvailabilityTestPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [staffId, setStaffId] = useState<string | undefined>();
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await loadOptions();
        setOrgId(data.orgId);
        setStaffOptions(data.staff);
        setServiceOptions(data.services);
        if (data.staff.length > 0) {
          setStaffId(data.staff[0].id);
        }
        if (data.services.length > 0) {
          setServiceId(data.services[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load staff and services");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId || !staffId || !serviceId || !date) {
      setError("Please select staff, service, and date");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSlots([]);

    try {
      const isoDate = format(date, "yyyy-MM-dd");

      const response = await fetch(
        `/api/booking/slots?orgId=${encodeURIComponent(orgId)}&staffId=${encodeURIComponent(
          staffId,
        )}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(isoDate)}`,
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to fetch slots");
      }

      const body = (await response.json()) as { slots: string[] };
      setSlots(body.slots ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch slots");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Availability test</h1>
        <p className="text-sm text-muted-foreground">
          Use this page to verify that your working hours, blackout dates, and bookings produce the
          expected available slots.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Staff</label>
            <Select value={staffId} onValueChange={setStaffId} disabled={isLoading || staffOptions.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading..." : "Select staff"} />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Service</label>
            <Select
              value={serviceId}
              onValueChange={setServiceId}
              disabled={isLoading || serviceOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading..." : "Select service"} />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((svc) => (
                  <SelectItem key={svc.id} value={svc.id}>
                    {svc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Calendar mode="single" selected={date} onSelect={setDate} numberOfMonths={1} />
          </div>

          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Checking..." : "Check availability"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium">Available slots</h2>
          <div className="rounded-md border p-4">
            {isSubmitting ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots for this day.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <span
                    key={slot}
                    className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

