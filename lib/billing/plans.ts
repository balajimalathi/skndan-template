/**
 * Plan definitions aligned with DodoPayments product IDs.
 * Products and prices are created in DodoPayments dashboard; only IDs and display info here.
 */

export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
};

export const plans: Plan[] = [
  {
    id: "plan_free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [],
  },
  {
    id: "plan_pro",
    name: "Pro",
    price: 49,
    currency: "USD",
    interval: "month",
    features: ["api_access", "export", "priority_support"],
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    price: 199,
    currency: "USD",
    interval: "month",
    features: ["api_access", "export", "priority_support", "sso", "custom_limits"],
  },
];

export function getPlanById(id: string | null): Plan | null {
  if (!id) return null;
  return plans.find((p) => p.id === id) ?? null;
}

export function hasFeature(planId: string | null, featureSlug: string): boolean {
  const plan = getPlanById(planId);
  if (!plan) return false;
  return plan.features.includes(featureSlug);
}
