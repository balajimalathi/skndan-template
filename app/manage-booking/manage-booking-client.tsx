"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const LookupSchema = z.object({
  reference: z.string().min(4, "Enter your booking reference"),
  email: z.string().email("Enter the email used for booking").optional().or(z.literal("")),
});

type LookupFormValues = z.infer<typeof LookupSchema>;

type BookingSummary = {
  reference: string;
  organizationName: string;
  serviceName: string;
  staffName: string;
  startTimeLabel: string;
  endTimeLabel: string;
  status: string;
  paymentStatus: string;
  amountLabel: string | null;
  canReschedule: boolean;
  canCancel: boolean;
};

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; booking: BookingSummary };

export function ManageBookingClient() {
  const form = useForm<LookupFormValues>({
    resolver: zodResolver(LookupSchema),
    defaultValues: {
      reference: "",
      email: "",
    },
  });

  const [lookupState, setLookupState] = useState<LookupState>({ status: "idle" });

  async function onSubmit(values: LookupFormValues) {
    setLookupState({ status: "loading" });
    try {
      const res = await fetch("/api/booking/manage/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: values.reference.trim().toUpperCase(),
          email: values.email?.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          data?.error ??
          (res.status === 404
            ? "We could not find a booking with that reference."
            : "Failed to look up booking. Please try again.");
        setLookupState({ status: "error", message });
        toast.error(message);
        return;
      }

      const data = (await res.json()) as { booking: BookingSummary };
      setLookupState({ status: "success", booking: data.booking });
    } catch (error) {
      console.error(error);
      const message = "Failed to look up booking. Please try again.";
      setLookupState({ status: "error", message });
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manage your booking</h1>
        <p className="text-sm text-muted-foreground">
          Enter your booking reference (and email, if asked) to view, reschedule, or cancel your
          appointment.
        </p>
      </div>

      <div className="rounded-md border p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3 md:flex-row md:items-end"
            noValidate
          >
            <div className="flex-1 space-y-2">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Booking reference</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1A2B3C4D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex-1 space-y-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Email used for booking <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={lookupState.status === "loading"}
            >
              {lookupState.status === "loading" ? "Looking up..." : "Find booking"}
            </Button>
          </form>
        </Form>
      </div>

      {lookupState.status === "success" && (
        <div className="space-y-4 rounded-md border p-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Booking reference</p>
              <p className="font-semibold">{lookupState.booking.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">{lookupState.booking.status}</p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-medium">{lookupState.booking.serviceName}</p>
              <p className="text-xs text-muted-foreground">
                with {lookupState.booking.staffName} at {lookupState.booking.organizationName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">When</p>
              <p className="font-medium">
                {lookupState.booking.startTimeLabel} – {lookupState.booking.endTimeLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="font-medium">
                {lookupState.booking.paymentStatus}
                {lookupState.booking.amountLabel ? ` • ${lookupState.booking.amountLabel}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" disabled={!lookupState.booking.canReschedule}>
              Reschedule (coming soon)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={!lookupState.booking.canCancel}
            >
              Cancel booking (coming soon)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

