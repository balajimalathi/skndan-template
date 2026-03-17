import type * as React from "react";

import {
  LayoutIcon,
  Mail,
  Settings,
  ShieldCheckIcon,
  ShieldUserIcon,
  UserCircle,
  Users,
  MonitorIcon,
  CreditCardIcon,
  Calendar,
  Tag,
  Bell,
  Wallet,
  Layout,
  Palette,
  Globe,
} from "lucide-react";
import { Frame, Map, PieChart } from "lucide-react";

export type NavItemType = "brand" | "link" | "cta" | "muted" | "action";

export interface NavMenuItem {
  label: string;
  type: NavItemType;
  url?: string;
  icon?: React.ElementType;
  badge?: string;
  gap?: boolean;
}

export interface NavMenuGroup {
  id: string;
  title: string;
  context: string;
  items: NavMenuItem[];
}

/**
 * Canonical navigation definition for the app.
 *
 * This mirrors the planned NAV_MENUS structure from the spec
 * and is the single source of truth for high‑level menus.
 */
export const NAV_MENUS: NavMenuGroup[] = [
  {
    id: "booking-nav",
    title: "Booking page header (minimal)",
    context:
      "Shown on /book/* and /manage/* — no nav links, just business identity",
    items: [
      { label: "Business logo + name", type: "brand" },
      {
        label: "Powered by BookSlot (toggleable)",
        type: "muted",
        gap: true,
      },
    ],
  },
  {
    id: "admin-sidebar",
    title: "Admin sidebar nav (primary)",
    context: "Primary nav — Dashboard, Calendar, Bookings, Customers, Services, Staff, Coupons",
    items: [
      { label: "Dashboard", type: "link", url: "/dashboard", icon: LayoutIcon },
      { label: "Calendar", type: "link", url: "/dashboard/calendar", icon: Calendar },
      { label: "Bookings", type: "link", url: "/dashboard/bookings", icon: Calendar },
      { label: "Customers", type: "link", url: "/dashboard/customers", icon: Users },
      { label: "Services", type: "link", url: "/dashboard/services", icon: LayoutIcon },
      { label: "Staff", type: "link", url: "/dashboard/staff", icon: Users, badge: "Pro+" },
      { label: "Coupons", type: "link", url: "/dashboard/coupons", icon: Tag },
      { label: "Settings", type: "link", url: "/dashboard/settings", icon: Settings },
    ],
  },
  {
    id: "admin-sidebar-schedule",
    title: "Schedule section (top-level with divider)",
    context: "Availability, Blackouts — below primary nav with section divider",
    items: [
      { label: "Availability", type: "link", url: "/dashboard/availability", icon: UserCircle },
      { label: "Blackouts", type: "link", url: "/dashboard/blackouts", icon: Calendar },
    ],
  },
  {
    id: "staff-sidebar",
    title: "Staff sidebar nav (restricted)",
    context:
      "Staff see only their own bookings — no customers, no settings",
    items: [
      { label: "My calendar", type: "link", url: "/dashboard", icon: Calendar },
      { label: "My bookings", type: "link", url: "/dashboard/bookings", icon: Calendar },
      { label: "My schedule", type: "link", url: "/dashboard/schedule", icon: Calendar },
      { label: "Account", type: "link", url: "/dashboard/account", icon: UserCircle, gap: true },
    ],
  },
  {
    id: "settings-tabs",
    title: "Settings sub-nav (tabs)",
    context:
      "Horizontal tabs inside /dashboard/settings on desktop, list on mobile",
    items: [
      { label: "Profile", type: "link", url: "/dashboard/settings/profile", icon: UserCircle },
      { label: "Organization", type: "link", url: "/dashboard/settings/organization", icon: UserCircle },
      { label: "Availability", type: "link", url: "/dashboard/settings/availability", icon: UserCircle },
      { label: "Notifications", type: "link", url: "/dashboard/settings/notifications", icon: Bell },
      { label: "Payments", type: "link", url: "/dashboard/settings/payments", icon: Wallet },
      { label: "Security", type: "link", url: "/dashboard/settings/security", icon: ShieldCheckIcon },
      { label: "Appearance", type: "link", url: "/dashboard/settings/preference", icon: MonitorIcon },
      { label: "Billing", type: "link", url: "/dashboard/settings/billing", icon: CreditCardIcon },
      { label: "Widget", type: "link", url: "/dashboard/settings/widget", icon: Layout, badge: "Pro+" },
      { label: "Branding", type: "link", url: "/dashboard/settings/branding", icon: Palette, badge: "Agency" },
      { label: "Domain", type: "link", url: "/dashboard/settings/domain", icon: Globe, badge: "Agency" },
      { label: "Team", type: "link", url: "/dashboard/settings/team", icon: Users },
    ],
  },
  {
    id: "superadmin-sidebar",
    title: "Super admin sidebar",
    context: "Separate /superadmin route group — isolated from /dashboard",
    items: [
      { label: "Overview", type: "link", url: "/superadmin" },
      { label: "Tenants", type: "link", url: "/superadmin/tenants" },
      { label: "Revenue", type: "link", url: "/superadmin/revenue" },
      {
        label: "Exit to dashboard",
        type: "action",
        url: "/dashboard",
        gap: true,
      },
    ],
  },
];

/**
 * Derived structures tailored to existing components.
 */

// Primary nav: Dashboard, Calendar, Bookings, Customers, Services, Staff, Coupons, Settings (expandable).
export const sidebarNavMain: {
  title: string;
  url: string;
  icon: React.ElementType;
  items?: { title: string; url: string; icon?: React.ElementType }[];
}[] = (NAV_MENUS.find((m) => m.id === "admin-sidebar")?.items ?? [])
  .filter((item) => item.type === "link" && item.url)
  .map((item) => ({
    title: item.label,
    url: item.url as string,
    icon: (item.icon ?? LayoutIcon) as React.ElementType,
    items:
      item.label === "Settings"
        ? NAV_MENUS.find((m) => m.id === "settings-tabs")?.items.map(
            (settingsItem) => ({
              title: settingsItem.label,
              url: settingsItem.url ?? "/dashboard/settings",
              icon: settingsItem.icon,
            })
          )
        : undefined,
  }));

// Schedule section: Availability, Blackouts (shown below primary nav with divider).
export const sidebarNavSchedule: {
  title: string;
  url: string;
  icon: React.ElementType;
}[] = (NAV_MENUS.find((m) => m.id === "admin-sidebar-schedule")?.items ?? [])
  .filter((item) => item.type === "link" && item.url)
  .map((item) => ({
    title: item.label,
    url: item.url as string,
    icon: (item.icon ?? UserCircle) as React.ElementType,
  }));

// Staff sidebar nav — derived from staff-sidebar (link items only).
export const sidebarNavStaff: {
  title: string;
  url: string;
  icon: React.ElementType;
  items?: {
    title: string;
    url: string;
    icon?: React.ElementType;
  }[];
}[] = (NAV_MENUS.find((m) => m.id === "staff-sidebar")?.items ?? [])
  .filter((item) => item.type === "link" && item.url)
  .map((item) => ({
    title: item.label,
    url: item.url as string,
    icon: (item.icon ?? UserCircle) as React.ElementType,
  }));

// Project list used in the sidebar footer; kept here so all
// nav-like structures live in one place.
export const sidebarProjects: {
  name: string;
  url: string;
  icon: typeof Frame;
}[] = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ];

