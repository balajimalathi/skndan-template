"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconCreditCard, IconDownload } from "@tabler/icons-react";
import { getPlanById, type Plan } from "@/lib/billing/plans";
import { toast } from "sonner";

type SubscriptionProp = {
  productId: string;
  status: string;
  currentPeriodEnd: string | null;
} | null;

type BillingSectionProps = {
  subscription: SubscriptionProp;
  plans: Plan[];
};

export default function BillingSection({ subscription, plans }: BillingSectionProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const currentPlan = subscription
    ? getPlanById(subscription.productId)
    : getPlanById("plan_free");
  const planName = currentPlan?.name ?? "Free";
  const planPrice = currentPlan?.price ?? 0;
  const planInterval = currentPlan?.interval ?? "month";
  const isActive = subscription?.status === "active";

  async function handleChangePlan(productId: string) {
    setCheckoutLoading(productId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to start checkout");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toast.error("No checkout URL returned");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const invoices = [
    { id: "INV-001", date: "Apr 1, 2023", amount: "$49.00", status: "Paid" },
    { id: "INV-002", date: "Mar 1, 2023", amount: "$49.00", status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Billing
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-0.5">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="payment-methods"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950"
          >
            Payment Methods
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950"
          >
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-900 dark:text-zinc-100">
                    Current Plan
                  </CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    You are currently on the {planName} plan.
                  </CardDescription>
                </div>
                <Badge
                  className={
                    isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  }
                >
                  {isActive ? "Active" : subscription?.status ?? "Free"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    ${planPrice}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    per {planInterval}
                  </p>
                </div>
                <Button
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                  onClick={() => {}}
                  disabled
                >
                  Change plan
                </Button>
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Next billing date
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-zinc-100">
                Plans
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Choose a plan. You will be redirected to checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isCurrent = subscription?.productId === plan.id;
                  const isFree = plan.id === "plan_free";
                  return (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {plan.name}
                      </p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        ${plan.price}
                        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                          /{plan.interval}
                        </span>
                      </p>
                      {plan.features.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-sm text-zinc-500 dark:text-zinc-400">
                          {plan.features.slice(0, 3).map((f) => (
                            <li key={f}>{f.replace(/_/g, " ")}</li>
                          ))}
                        </ul>
                      )}
                      <Button
                        className="mt-4 w-full"
                        variant={isCurrent ? "secondary" : "default"}
                        disabled={isCurrent || isFree || !!checkoutLoading}
                        onClick={() => !isFree && handleChangePlan(plan.id)}
                      >
                        {checkoutLoading === plan.id
                          ? "Redirecting..."
                          : isCurrent
                            ? "Current plan"
                            : isFree
                              ? "Free"
                              : "Subscribe"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-zinc-100">
                Payment Methods
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Manage your payment methods in the checkout or customer portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-14 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                    <IconCreditCard className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Add or update payment methods when you subscribe or change plan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-zinc-100">
                Invoices
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                View and download your billing history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <div>Invoice</div>
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Status</div>
                </div>
                {invoices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No invoices yet.
                  </div>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="grid grid-cols-4 items-center py-3 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invoice.id}
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-400">
                        {invoice.date}
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-400">
                        {invoice.amount}
                      </div>
                      <div className="flex items-center">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {invoice.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto text-zinc-500 dark:text-zinc-400"
                        >
                          <IconDownload className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
