"use client"

import * as React from "react"
import {
  IconSettings,
  IconDashboard,
  IconUser
} from "@tabler/icons-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { api } from "@/lib/api"


const data = {
  navMain: [
    {
      title: "Profile",
      url: "profile",
      icon: IconUser,
    },
    {
      title: "Dashboard",
      url: "dashboard",
      icon: IconDashboard,
    },
    {
      title: "Settings",
      url: "settings",
      icon: IconSettings,
    }
  ],
}

export function AppSidebarUser({ onSelect, ...props }: React.ComponentProps<typeof Sidebar> & { onSelect?: (view: string) => void }) {
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get<User>("/users/me");
        setUser(response);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 font-medium p-2">
              <IconDashboard className="size-5!" />
              <span className="text-base font-semibold">User Dashboard</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onSelect={onSelect} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}