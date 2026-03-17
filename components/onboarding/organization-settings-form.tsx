"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationOnboardingSchema, type OrganizationOnboardingInput } from "@/lib/validations/organization-onboarding";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateOrganization } from "@/components/onboarding/settings-actions";

type Props = {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
    bookingHeadline: string | null;
    timezone: string;
    currency: "INR" | "USD";
    minAdvanceHours: number;
    maxAdvanceDays: number;
    bufferMinutes: number;
    cancellationPolicyHours: number;
    paymentGateway: string | null;
    razorpayKeyId: string | null;
    razorpayKeySecret: string | null;
    dodopayClientId: string | null;
    dodopayClientSecret: string | null;
  };
};

export function OrganizationSettingsForm({ organization }: Props) {
  const form = useForm<OrganizationOnboardingInput>({
    resolver: zodResolver(OrganizationOnboardingSchema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      primaryColor: organization.primaryColor ?? "",
      bookingHeadline: organization.bookingHeadline ?? "",
      currency: organization.currency,
      minAdvanceHours: organization.minAdvanceHours,
      maxAdvanceDays: organization.maxAdvanceDays,
      bufferMinutes: organization.bufferMinutes,
      cancellationPolicyHours: organization.cancellationPolicyHours,
      paymentGateway: organization.paymentGateway ?? "RAZORPAY",
      razorpayKeyId: organization.razorpayKeyId ?? "",
      razorpayKeySecret: organization.razorpayKeySecret ?? "",
      dodopayClientId: organization.dodopayClientId ?? "",
      dodopayClientSecret: organization.dodopayClientSecret ?? "",
    },
  });

  async function onSubmit(values: OrganizationOnboardingInput) {
    try {
      await updateOrganization(values);
      toast.success("Organization updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INR">INR · Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD · US Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All service prices and booking amounts are shown to customers in this currency.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="minAdvanceHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum advance booking (hours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Customers can only book slots at least this many hours before the start time.
                </p>
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
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Customers can only book up to this many days in the future.
                </p>
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
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  A gap of this many minutes is kept between back-to-back appointments.
                </p>
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
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Customers can cancel or reschedule only up to this many hours before the start
                  time.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payment settings</h2>
          <FormField
            control={form.control}
            name="paymentGateway"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment gateway</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment gateway" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                    <SelectItem value="DODOPAYMENTS">DodoPay</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose which payment gateway to use for collecting payments.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("paymentGateway") === "RAZORPAY" && (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="razorpayKeyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razorpay Key ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="razorpayKeySecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razorpay Key Secret</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {form.watch("paymentGateway") === "DODOPAYMENTS" && (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dodopayClientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DodoPay Client ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dodopayClientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DodoPay Client Secret</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Button type="submit">Save changes</Button>
      </form>
    </Form>
  );
}

