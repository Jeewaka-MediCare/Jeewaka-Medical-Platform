import * as React from "react";
import { ChevronsUpDown, Stethoscope } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="flex items-center gap-3 px-3 py-2"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center rounded-lg size-8">
            <Stethoscope className="size-4" />
          </div>
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-bold">Jeewaka</span>
            <span className="truncate text-xs text-muted-foreground">Healthcare</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
