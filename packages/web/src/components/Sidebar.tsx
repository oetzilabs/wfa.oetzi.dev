import { getAuthenticatedSession } from "@/lib/auth/util";
import { createAsync, useLocation, useResolvedPath } from "@solidjs/router";
import Building2 from "lucide-solid/icons/building-2";
import Car from "lucide-solid/icons/car";
import Home from "lucide-solid/icons/home";
import Map from "lucide-solid/icons/map";
import Settings from "lucide-solid/icons/settings";
import Store from "lucide-solid/icons/store";
import Truck from "lucide-solid/icons/truck";
import { Show } from "solid-js";
import NavLink from "./NavLink";

export default function Sidebar() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  // const list = [
  //   "/dashboard",
  //   "/dashboard/rides",
  //   "/dashboard/vehicles",
  //   "/dashboard/regions",
  //   "/dashboard/organizations",
  //   "/dashboard/companies",
  //   "/settings",
  // ];

  // const location = useLocation();

  // const resolvedPath = useResolvedPath(() => location.pathname);
  // const isNotInList = () => !list.some((item) => item.startsWith(resolvedPath() ?? ""));

  return (
    <div class="flex flex-col w-[300px] h-full grow">
      <div class="flex flex-col">
        <nav class="flex flex-col w-full border-b border-neutral-200 dark:border-neutral-800 lg:border-none shadow-sm lg:shadow-none">
          <div class="flex flex-col w-full items-center h-max">
            <Show when={session() && session()!.user !== null}>
              {(s) => (
                <>
                  <NavLink exact href="/dashboard">
                    <Home class="size-5 not-sr-only lg:sr-only" />
                    <span class="sr-only lg:not-sr-only">Dashboard</span>
                  </NavLink>
                  <NavLink href="/dashboard/applications">
                    <Car class="size-5 not-sr-only lg:sr-only" />
                    <span class="sr-only lg:not-sr-only">Applications</span>
                  </NavLink>
                  <NavLink href="/dashboard/documents">
                    <Map class="size-5 not-sr-only lg:sr-only" />
                    <span class="sr-only lg:not-sr-only">Documents</span>
                  </NavLink>
                  <div class="flex grow w-full" />
                  <NavLink href="/settings">
                    <span class="sr-only lg:not-sr-only">Settings</span>
                    <Settings class="size-5 lg:size-4" />
                  </NavLink>
                </>
              )}
            </Show>
          </div>
        </nav>
      </div>
    </div>
  );
}
