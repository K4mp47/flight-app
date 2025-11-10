"use client"

import * as React from "react"
import {
  IconDashboard,
  IconListDetails,
  IconPlaneInflight
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  navMain: [
    {
      title: "Fleet",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Routes",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Flights",
      url: "#",
      icon: IconPlaneInflight,
    }
  ],
}

export function AppSidebar({ onSelect, ...props }: React.ComponentProps<typeof Sidebar> & { onSelect?: (view: string) => void }) {
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
              <IconDashboard className="!size-5" />
              <span className="text-base font-semibold">Company Dashboard</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onSelect={onSelect} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ?? data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
