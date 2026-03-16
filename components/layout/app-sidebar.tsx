"use client";
import * as React from "react";
import {
  IconDashboard,
  IconMail,
  IconSettings,
  IconShieldLock,
  IconShieldStar,
  IconUserCircle,
  IconUsers,
  IconDeviceDesktop,
  IconCreditCard,
} from "@tabler/icons-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { User } from "@/lib/db/db";
import { NavProjects } from "@/components/layout/nav-projects";
import { Frame, Map, PieChart } from "lucide-react";
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
  projects: [
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {user?.role === "admin" && (
          <NavMain items={data.navAdmin} groupLabel="Admin" />
        )}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

