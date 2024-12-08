import type { LucideProps } from "lucide-solid";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuButtonProps,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { A, createAsync } from "@solidjs/router";
import Boxes from "lucide-solid/icons/boxes";
import Cpu from "lucide-solid/icons/cpu";
import Files from "lucide-solid/icons/files";
import Home from "lucide-solid/icons/home";
import Settings from "lucide-solid/icons/settings";
import { For, JSX, Show } from "solid-js";
import NavLink, { NavLinkProps } from "./NavLink";
import UserMenu from "./UserMenu";

type Item = SidebarMenuButtonProps &
  NavLinkProps & {
    icon: (props: LucideProps) => JSX.Element;
  };
export default function SidebarComponent() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  const items: Array<Item> = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Boxes,
      exact: true,
    },
    {
      title: "Applications",
      href: "/dashboard/applications",
      icon: Cpu,
      exact: true,
    },
    {
      title: "Documents",
      href: "/dashboard/documents",
      icon: Files,
      exact: true,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      exact: true,
    },
  ];

  return (
    <Sidebar>
      {/* <SidebarHeader></SidebarHeader> */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <For each={items}>
                {(item) => (
                  <SidebarMenuItem>
                    <SidebarMenuButton as={NavLink} href={item.href} exact={item.exact}>
                      <item.icon class="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </For>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Show when={session() && session()!.user !== null && session()}>{(s) => <UserMenu user={s().user!} />}</Show>
      </SidebarFooter>
    </Sidebar>
  );
}
