"use client";
import * as React from "react";
import Link from "next/link";
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
      url: "/dashboard/account",
      icon: IconUserCircle,
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
          title: "Appearance",
          url: "/dashboard/setting/preference",
          icon: IconDeviceDesktop,
        },
        {
          title: "Billing",
          url: "/dashboard/setting/billing",
          icon: IconCreditCard,
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
      url: "/admin",
      icon: IconShieldStar,
      items: [
        { title: "Users", url: "/admin/users", icon: IconUsers },
        { title: "Mail", url: "/admin/mail", icon: IconMail },
      ],
    },
  ],
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
              size="lg"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Dashboard</span>
              </Link>
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
