"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { StaffProfileSchema, type StaffProfileInput } from "@/lib/validations/staff";
import { getMyStaffProfile, saveMyStaffProfile } from "./actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LoadedProfile = {
  staff: {
    id: string;
    slug: string;
    bio: string;
  } | null;
  organizationSlug: string;
  userName: string;
  userEmail: string;
};

export default function StaffClientPage() {
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StaffProfileInput>({
    resolver: zodResolver(StaffProfileSchema),
    defaultValues: {
      slug: "",
      bio: "",
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        const data = await getMyStaffProfile();
        setLoaded(data);

        if (data.staff) {
          form.reset({
            slug: data.staff.slug,
            bio: data.staff.bio ?? "",
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load staff profile");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [form]);

  async function onSubmit(values: StaffProfileInput) {
    setIsSubmitting(true);
    try {
      await saveMyStaffProfile(values);
      toast.success("Staff profile saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save staff profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  const bookingUrl =
    loaded && form.watch("slug")
      ? `/${loaded.organizationSlug}/book`
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">
          Configure your staff profile. This is used for availability and bookings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4 rounded-md border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Your staff profile</h2>
            <p className="text-xs text-muted-foreground">
              Set how you appear on the booking page and link your account to staff availability.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public slug</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. john-doe" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Used in internal URLs and to identify you across the app.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Short description of your role, expertise, or services."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-4 rounded-md border p-4 text-sm">
          <h2 className="text-sm font-medium">Preview & details</h2>
          {isLoading || !loaded ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-medium">{loaded.userName}</p>
                <p className="text-xs text-muted-foreground">{loaded.userEmail}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Booking page</p>
                {bookingUrl ? (
                  <p className="font-mono text-xs">{bookingUrl}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Set a slug to generate your booking link.
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Once your staff profile is saved, you can configure your working hours in{" "}
                <span className="font-medium">Availability</span> and start accepting bookings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

