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
  url?: string;
  icon?: React.ElementType;
  badge?: string;
}

export interface NavMenuGroup {
  id: string;
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
    id: "admin-sidebar",
    items: [
      { label: "Dashboard", url: "/dashboard", icon: LayoutIcon },
      { label: "Calendar", url: "/dashboard/calendar", icon: Calendar },
      { label: "Blackouts", url: "/dashboard/blackouts", icon: Calendar },
      { label: "Bookings", url: "/dashboard/bookings", icon: Calendar },
      { label: "Customers", url: "/dashboard/customers", icon: Users },
      { label: "Services", url: "/dashboard/services", icon: LayoutIcon },
      { label: "Staff", url: "/dashboard/staff", icon: Users, badge: "Pro+" },
      { label: "Coupons", url: "/dashboard/coupons", icon: Tag },
      { label: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
  {
    id: "admin-sidebar-schedule",
    items: [
      { label: "Availability", url: "/dashboard/availability", icon: UserCircle },
      { label: "Blackouts", url: "/dashboard/blackouts", icon: Calendar },
    ],
  },
  {
    id: "staff-sidebar",
    items: [
      { label: "My calendar", url: "/dashboard", icon: Calendar },
      { label: "My bookings", url: "/dashboard/bookings", icon: Calendar },
      { label: "My schedule", url: "/dashboard/schedule", icon: Calendar },
      { label: "Account", url: "/dashboard/account", icon: UserCircle },
    ],
  },
  {
    id: "settings-tabs",
    items: [
      { label: "Profile", url: "/dashboard/settings/profile", icon: UserCircle },
      { label: "Organization", url: "/dashboard/settings/organization", icon: UserCircle },
      { label: "Availability", url: "/dashboard/settings/availability", icon: UserCircle },
      { label: "Notifications", url: "/dashboard/settings/notifications", icon: Bell },
      { label: "Payments", url: "/dashboard/settings/payments", icon: Wallet },
      { label: "Security", url: "/dashboard/settings/security", icon: ShieldCheckIcon },
      { label: "Appearance", url: "/dashboard/settings/preference", icon: MonitorIcon },
      { label: "Billing", url: "/dashboard/settings/billing", icon: CreditCardIcon },
      { label: "Widget", url: "/dashboard/settings/widget", icon: Layout, badge: "Pro+" },
      { label: "Branding", url: "/dashboard/settings/branding", icon: Palette, badge: "Agency" },
      { label: "Domain", url: "/dashboard/settings/domain", icon: Globe, badge: "Agency" },
      { label: "Team", url: "/dashboard/settings/team", icon: Users },
    ],
  }
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
  .filter((item) => item.url)
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
  .filter((item) => item.url)
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
  .filter((item) => item.url)
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

