"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StaffOption = {
  id: string;
  label: string;
};

type ServiceOption = {
  id: string;
  name: string;
};

type AvailabilityTestClientProps = {
  orgId: string;
  staffOptions: StaffOption[];
  serviceOptions: ServiceOption[];
};

export function AvailabilityTestClient({
  orgId,
  staffOptions,
  serviceOptions,
}: AvailabilityTestClientProps) {
  const [staffId, setStaffId] = useState<string | undefined>(
    staffOptions[0]?.id,
  );
  const [serviceId, setServiceId] = useState<string | undefined>(
    serviceOptions[0]?.id,
  );
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        `/api/booking/slots?orgId=${encodeURIComponent(
          orgId,
        )}&staffId=${encodeURIComponent(
          staffId,
        )}&serviceId=${encodeURIComponent(
          serviceId,
        )}&date=${encodeURIComponent(isoDate)}`,
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to fetch slots");
      }

      const body = (await response.json()) as { slots: string[] };
      setSlots(body.slots ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch slots",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Availability test
        </h1>
        <p className="text-sm text-muted-foreground">
          Use this page to verify that your working hours, blackout dates, and
          bookings produce the expected available slots.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Staff</label>
            <Select
              value={staffId}
              onValueChange={setStaffId}
              disabled={staffOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    staffOptions.length === 0 ? "No staff" : "Select staff"
                  }
                />
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
              disabled={serviceOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    serviceOptions.length === 0 ? "No services" : "Select service"
                  }
                />
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
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
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
              <p className="text-sm text-muted-foreground">
                No available slots for this day.
              </p>
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

