"use client";
import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconChartDots,
  IconCopy,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconHome,
  IconInnerShadowTop,
  IconListDetails,
  IconMail,
  IconMoneybag,
  IconMoneybagPlus,
  IconReport,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconShieldStar,
  IconUserCircle,
  IconUsers,
  IconBell,
  IconDeviceDesktop,
  IconKey,
  IconCreditCard,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { User } from "@/lib/db/db";
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Account",
      url: "/dashboard/profile",
      icon: IconUserCircle,
    },
    {
      title: "Subscriptions",
      url: "/dashboard/subscriptions",
      icon: IconMoneybagPlus,
    },
    {
      title: "Setting",
      url: "/dashboard/setting",
      icon: IconSettings,
      items: [
        {
          title: "Profile",
          url: "/dashboard/setting/profile",
          icon: IconUserCircle,
        },
        {
          title: "Security",
          url: "/dashboard/setting/security",
          icon: IconShieldLock,
        },
        {
          title: "Notifications",
          url: "/dashboard/setting/notifications",
          icon: IconBell,
        },
        {
          title: "Appearance",
          url: "/dashboard/setting/preference",
          icon: IconDeviceDesktop,
        },
        {
          title: "API Keys",
          url: "/dashboard/setting/api-keys",
          icon: IconKey,
        },
        {
          title: "Billing",
          url: "/dashboard/setting/billing",
          icon: IconCreditCard,
        },
      ],
    },
  ],

  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Upgrade to PRO",
      url: "/",
      icon: IconMoneybag,
    },
  ],
  navAdmin: [
    {
      title: "Admin",
      url: "/dashboard/admin",
      icon: IconShieldStar,
      items: [
        { title: "Users", url: "/dashboard/admin/users", icon: IconUsers },
        { title: "Mail", url: "/dashboard/admin/mail", icon: IconMail },
        { title: "Events", url: "/dashboard/admin/analytics/events", icon: IconChartBar },
        { title: "Funnels", url: "/dashboard/admin/analytics/funnels", icon: IconChartDots },
        { title: "Retention", url: "/dashboard/admin/analytics/retention", icon: IconChartDots },
        { title: "Dashboards", url: "/dashboard/admin/analytics/dashboards", icon: IconChartBar },
      ],
    },
  ],
  documents: [],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: Partial<User>;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  if (!user) {
    throw new Error("AppSidebar requires a user but received undefined.");
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {user?.role === "admin" && (
          <NavMain items={data.navAdmin} groupLabel="Admin" />
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
