"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationOnboardingSchema, type OrganizationOnboardingInput } from "@/lib/validations/organization-onboarding";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitOrganizationOnboarding } from "@/app/(dashboard)/onboarding/actions";

const STEPS = ["Basics", "Preferences", "Review"] as const;

export function OnboardingStepper() {
  const [step, setStep] = React.useState(0);
  const form = useForm<OrganizationOnboardingInput>({
    resolver: zodResolver(OrganizationOnboardingSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: null,
      primaryColor: "",
      bookingHeadline: "",
      timezone: "UTC",
      currency: "INR",
      minAdvanceHours: 1,
      maxAdvanceDays: 30,
      bufferMinutes: 15,
      cancellationPolicyHours: 24,
    },
  });

  async function next() {
    let fields: (keyof OrganizationOnboardingInput)[] = [];
    if (step === 0) {
      fields = ["name", "slug", "timezone", "currency"];
    } else if (step === 1) {
      fields = ["minAdvanceHours", "maxAdvanceDays", "bufferMinutes", "cancellationPolicyHours"];
    }

    if (fields.length) {
      const valid = await form.trigger(fields, { shouldFocus: true });
      if (!valid) return;
    }

    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function back() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function onSubmit(values: OrganizationOnboardingInput) {
    try {
      await submitOrganizationOnboarding(values);
      toast.success("Organization created");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while saving your organization");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium",
                  index === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < step
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground",
                ].join(" ")}
              >
                {index + 1}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL slug</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="UTC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="INR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="minAdvanceHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum advance booking (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={72}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxAdvanceDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum advance booking (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bufferMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer between bookings (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationPolicyHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation policy (hours before)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={168}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review your organization details. You can update these later in settings.
            </p>
            <div className="grid gap-2 rounded-md border bg-muted/40 p-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {form.watch("name")}
              </div>
              <div>
                <span className="font-medium">Slug:</span> {form.watch("slug")}
              </div>
              <div>
                <span className="font-medium">Timezone:</span> {form.watch("timezone")}
              </div>
              <div>
                <span className="font-medium">Currency:</span> {form.watch("currency")}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Next
            </Button>
          ) : (
            <Button type="submit">Finish</Button>
          )}
        </div>
      </form>
    </Form>
  );
}

