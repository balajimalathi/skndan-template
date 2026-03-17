"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  slug: string;
  bookingHeadline: string | null;
  currency: string;
};

type ServiceSummary = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  currency: string;
  isActive: boolean;
};

type StaffForService = {
  staffId: string;
  staffSlug: string;
  serviceId: string;
};

type Props = {
  organization: Organization;
  services: ServiceSummary[];
  staffForService: StaffForService[];
};
const BookingFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Enter a valid email"),
  customerPhone: z
    .string()
    .min(5, "Enter a valid phone")
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

type BookingFormValues = z.infer<typeof BookingFormSchema>;

export default function BookingClient({ organization, services, staffForService }: Props) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    services.length > 0 ? services[0].id : null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  const activeServices = services.filter((s) => s.isActive);

  const availableStaffForService = useMemo(() => {
    if (!selectedServiceId) return [];
    return staffForService.filter((row) => row.serviceId === selectedServiceId);
  }, [selectedServiceId, staffForService]);

  useEffect(() => {
    try {
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tzName);
    } catch {
      setUserTimezone(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedServiceId || availableStaffForService.length === 0) {
      setSelectedStaffId(null);
    } else if (!selectedStaffId) {
      setSelectedStaffId(availableStaffForService[0]?.staffId ?? null);
    }
  }, [selectedServiceId, availableStaffForService, selectedStaffId]);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedServiceId || !selectedStaffId || !selectedDate) {
        setSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setSelectedSlot(null);

      const dateStr = format(selectedDate, "yyyy-MM-dd");

      try {
        const params = new URLSearchParams({
          orgId: organization.id,
          staffId: selectedStaffId,
          serviceId: selectedServiceId,
          date: dateStr,
        });
        const res = await fetch(`/api/booking/slots?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load slots");
        }
        const data = (await res.json()) as { slots: string[] };
        setSlots(data.slots ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load available slots");
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    void loadSlots();
  }, [organization.id, selectedServiceId, selectedStaffId, selectedDate]);

  async function handleSubmit(values: BookingFormValues) {
    if (!selectedServiceId || !selectedStaffId || !selectedDate || !selectedSlot) {
      toast.error("Please select a service, staff member, date, and time slot");
      return;
    }

    setIsSubmitting(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const payload = {
        orgId: organization.id,
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        date: dateStr,
        time: selectedSlot,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone || null,
      };

      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create booking");
      }

      const data = (await res.json()) as {
        id: string;
        reference: string;
        paymentGateway: string;
      };

      if (data.paymentGateway === "FREE") {
        toast.success("Booking confirmed");
        router.push(`/booking/${data.reference}`);
        return;
      }

      // For paid bookings, create a payment checkout session using the unified API.
      const checkoutRes = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: data.id }),
      });

      if (!checkoutRes.ok) {
        const checkoutError = await checkoutRes.json().catch(() => ({}));
        throw new Error(checkoutError.error ?? "Failed to create payment checkout");
      }

      const checkout = (await checkoutRes.json()) as {
        provider: string;
        payload: { redirectUrl?: string } | null;
      };

      if (checkout.provider === "FREE") {
        toast.success("Booking confirmed");
        router.push(`/booking/${data.reference}`);
        return;
      }

      if (checkout.payload && checkout.payload.redirectUrl) {
        toast.success("Booking created. Redirecting to payment...");
        window.location.href = checkout.payload.redirectUrl;
        return;
      }

      toast.success("Booking created. Complete payment to confirm.");
      router.push(`/booking/${data.reference}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (activeServices.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{organization.name}</h1>
        <p className="text-muted-foreground">
          This business has not configured any bookable services yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-10 md:flex-row">
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{organization.name}</h1>
          {organization.bookingHeadline && (
            <p className="text-sm text-muted-foreground">{organization.bookingHeadline}</p>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-sm font-medium">Choose a service</h2>
          <div className="space-y-2">
            {activeServices.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedServiceId(svc.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${selectedServiceId === svc.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{svc.name}</div>
                  {svc.description && (
                    <div className="truncate text-xs text-muted-foreground">
                      {svc.description}
                    </div>
                  )}
                </div>
                <div className="ml-3 shrink-0 text-sm font-medium">
                  {svc.price} {svc.currency || organization.currency}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-sm font-medium">Your details</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-3"
              noValidate
            >
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting || !selectedSlot}>
                {isSubmitting ? "Booking..." : selectedSlot ? "Confirm booking" : "Select a slot"}
              </Button>
            </form>
          </Form>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>
              Bookings are stored in UTC and converted to your local timezone in this view. Advance
              booking window and cancellation policy are enforced automatically.
            </p>
            {selectedDate && selectedSlot && userTimezone && (
              (() => {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const [year, month, day] = dateStr.split("-").map((part) => Number(part));
                const [hour, minute] = selectedSlot.split(":").map((part) => Number(part));

                const utcDate = new Date(
                  Date.UTC(year, month - 1, day, hour, minute, 0, 0),
                );
                // On the client, calling toLocaleString without an explicit timeZone
                // shows the time in the browser's local timezone.
                const userLabel = utcDate.toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                return (
                  <p>
                    Selected slot (your time): {userLabel} ({userTimezone})
                  </p>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 rounded-md border p-4">
        <h2 className="text-sm font-medium">Choose a time</h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {selectedDate ? format(selectedDate, "EEE, MMM d") : "Select a date"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLoadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No available slots for this date. Try another day.
              </p>
            ) : (
              slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-full border px-3 py-1 text-xs ${selectedSlot === slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground"
                    }`}
                >
                  {slot}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

