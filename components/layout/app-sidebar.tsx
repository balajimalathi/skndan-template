"use client";

import * as React from "react";

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
import {
  sidebarNavMain,
  sidebarNavStaff,
  sidebarProjects,
} from "@/config/navigation";

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
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={user?.role === "staff" ? sidebarNavStaff : sidebarNavMain}
          groupLabel={user?.role === "staff" ? "Staff" : "Main"}
        />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        {/* <NavProjects projects={sidebarProjects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

