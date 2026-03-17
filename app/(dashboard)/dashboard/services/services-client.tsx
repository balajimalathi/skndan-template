"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ServiceSchema, type ServiceInput } from "@/lib/validations/service";
import { listServices, createService, updateService, toggleServiceActive } from "./actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  currency: string;
  isActive: boolean;
  createdAt: Date;
};

export default function ServicesClientPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<ServiceInput>({
    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 60,
      price: "0",
      depositAmount: undefined,
      currency: "",
      isActive: true,
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        const rows = await listServices();
        setServices(rows);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function resetForm() {
    form.reset({
      name: "",
      description: "",
      durationMinutes: 60,
      price: "0",
      depositAmount: undefined,
      currency: "",
      isActive: true,
    });
    setEditingId(null);
  }

  async function onSubmit(values: ServiceInput) {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateService({
          id: editingId,
          ...values,
        });
        toast.success("Service updated");
      } else {
        await createService(values);
        toast.success("Service created");
      }

      const rows = await listServices();
      setServices(rows);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(row: ServiceRow) {
    setEditingId(row.id);
    form.reset({
      name: row.name,
      description: row.description ?? "",
      durationMinutes: row.duration,
      price: row.price,
      depositAmount: undefined,
      currency: row.currency,
      isActive: row.isActive,
    });
  }

  async function handleToggleActive(row: ServiceRow, isActive: boolean) {
    try {
      await toggleServiceActive({ id: row.id, isActive });
      setServices((prev) =>
        prev.map((svc) => (svc.id === row.id ? { ...svc, isActive } : svc)),
      );
      toast.success(isActive ? "Service activated" : "Service deactivated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update service status");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage the services your customers can book. Your public booking page requires at
          least one active service.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">
                {editingId ? "Edit service" : "Create service"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Set the basic details customers see on the booking page.
              </p>
            </div>
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Optional short description shown on the booking page"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={24 * 60}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          {...field}
                        />
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
                        <Input {...field} placeholder="e.g. INR, USD" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Only active services can be booked by customers.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {editingId ? "Save changes" : "Create service"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium">Existing services</h2>
          <div className="rounded-md border">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>Duration</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {isLoading ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">Loading...</div>
            ) : services.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground">
                No services yet. Create your first service to make your booking page usable.
              </div>
            ) : (
              <ul className="divide-y">
                {services.map((svc) => (
                  <li
                    key={svc.id}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{svc.name}</div>
                      {svc.description && (
                        <div className="truncate text-xs text-muted-foreground">
                          {svc.description}
                        </div>
                      )}
                    </div>
                    <span>{svc.duration} min</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={svc.isActive}
                        onCheckedChange={(checked) => handleToggleActive(svc, checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {svc.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(svc)}>
                        Edit
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

