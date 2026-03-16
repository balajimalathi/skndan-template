"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  AvailabilitySettingsSchema,
  type AvailabilitySettingsInput,
} from "@/lib/validations/availability-settings";
import { getAvailabilitySettings, saveAvailabilitySettings } from "./actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function AvailabilitySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<AvailabilitySettingsInput>({
    resolver: zodResolver(AvailabilitySettingsSchema),
    defaultValues: {
      days: Array.from({ length: 7 }, () => ({
        isActive: false,
        startTime: "09:00",
        endTime: "17:00",
      })),
      bufferMinutes: 15,
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        const data = await getAvailabilitySettings();
        form.reset(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load availability settings");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [form]);

  async function onSubmit(values: AvailabilitySettingsInput) {
    try {
      await saveAvailabilitySettings(values);
      toast.success("Availability settings saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save availability settings");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Working hours</h1>
        <p className="text-sm text-muted-foreground">
          Configure your working hours and buffer time between appointments. These settings are used
          to calculate available booking slots.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Day</span>
              <span>Start time</span>
              <span>End time</span>
              <span className="text-center">Open</span>
            </div>
            <div className="divide-y">
              {DAY_LABELS.map((label, index) => (
                <div
                  key={label}
                  className="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-4 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{label}</span>

                  <FormField
                    control={form.control}
                    name={`days.${index}.startTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            step={900}
                            disabled={isLoading || !form.watch(`days.${index}.isActive`)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`days.${index}.endTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            step={900}
                            disabled={isLoading || !form.watch(`days.${index}.isActive`)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`days.${index}.isActive`}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-center">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="bufferMinutes"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Buffer between appointments (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                form.reset();
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

