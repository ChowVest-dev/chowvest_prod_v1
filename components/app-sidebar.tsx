"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Overview",
    url: "/admin",
    icon: PieChart,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Bot,
  },
  {
    title: "Deliveries",
    url: "/admin/deliveries",
    icon: Map,
  },
  {
    title: "Finances",
    url: "/admin/finances",
    icon: GalleryVerticalEnd,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings2,
  },
]

export function AppSidebar({ admin, ...props }: React.ComponentProps<typeof Sidebar> & { admin?: any }) {
  const adminUser = {
    name: admin?.name || "Admin",
    email: admin?.email || "admin@chowvest.com",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="font-bold text-primary">C</span>
          </div>
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Chowvest Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-4 space-y-1">
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={adminUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
