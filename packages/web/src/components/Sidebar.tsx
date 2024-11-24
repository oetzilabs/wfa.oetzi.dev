import { getAuthenticatedSession } from "@/lib/auth/util";
import { createAsync } from "@solidjs/router";
import Boxes from "lucide-solid/icons/boxes";
import Files from "lucide-solid/icons/files";
import Home from "lucide-solid/icons/home";
import Settings from "lucide-solid/icons/settings";
import { Show } from "solid-js";
import NavLink from "./NavLink";

export default function Sidebar() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });

  return (
    <div class="flex flex-col w-[250px] h-full grow">
      <div class="flex flex-col grow w-full h-full">
        <nav class="flex flex-col w-full border-r border-neutral-200 dark:border-neutral-800 grow h-full">
          <div class="flex flex-col w-full items-center h-full grow p-1 gap-1">
            <Show when={session() && session()!.user !== null}>
              {(s) => (
                <>
                  <NavLink exact href="/dashboard">
                    <Home class="size-4" />
                    <span class="sr-only lg:not-sr-only">Dashboard</span>
                  </NavLink>
                  <NavLink href="/dashboard/applications">
                    <Boxes class="size-4" />
                    <span class="sr-only lg:not-sr-only">Applications</span>
                  </NavLink>
                  <NavLink href="/dashboard/documents">
                    <Files class="size-4" />
                    <span class="sr-only lg:not-sr-only">Documents</span>
                  </NavLink>
                  <NavLink href="/settings">
                    <Settings class="size-4" />
                    <span class="sr-only lg:not-sr-only">Settings</span>
                  </NavLink>
                  <div class="flex grow w-full" />
                  <div class="w-full h-10"></div>
                </>
              )}
            </Show>
          </div>
        </nav>
      </div>
    </div>
  );
}
