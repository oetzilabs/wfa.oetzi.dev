import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserSession } from "@/lib/auth/util";
import { A, useSubmission } from "@solidjs/router";
import Cpu from "lucide-solid/icons/cpu";
import Loader2 from "lucide-solid/icons/loader-2";
import LogOut from "lucide-solid/icons/log-out";
import Plus from "lucide-solid/icons/plus";
import Settings from "lucide-solid/icons/settings";
import User from "lucide-solid/icons/user";
import { For, Match, Show, Switch } from "solid-js";
import { logout } from "../utils/api/actions";

export default function UserMenu(props: { user: UserSession["user"] }) {
  const isLoggingOut = useSubmission(logout);

  return (
    <DropdownMenu placement="bottom-end" gutter={4}>
      <DropdownMenuTrigger
        as={Button}
        variant="default"
        class="flex flex-row items-center justify-center size-8 p-0 rounded-full"
      >
        <User class="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel class="flex flex-col gap-0.5">
            <span class="font-bold">My Account</span>
            <span class="text-xs text-muted-foreground font-normal">{props.user!.email}</span>
          </DropdownMenuGroupLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem as={A} class="cursor-pointer" href="/profile">
            <User class="size-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem as={A} class="cursor-pointer" href="/settings">
            <Settings class="size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel class="flex flex-row gap-0.5 items-center w-full justify-between">
            <span class="font-semibold">Applications</span>
            <div class="">
              <Button size="icon" class="size-6 p-1" variant="outline" as={A} href="/dashboard/applications/create">
                <Plus class="size-4" />
              </Button>
            </div>
          </DropdownMenuGroupLabel>
          <Show when={props.user}>
            {(user) => (
              <For each={user().applications} fallback={<DropdownMenuItem disabled>No applications</DropdownMenuItem>}>
                {(app) => (
                  <DropdownMenuItem as={A} class="cursor-pointer" href={`/dashboard/applications/${app.id}`}>
                    <Cpu class="size-4" />
                    <span>{app.name}</span>
                  </DropdownMenuItem>
                )}
              </For>
            )}
          </Show>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout} method="post">
          <DropdownMenuItem
            class="text-rose-500 hover:!text-white dark:hover:!bg-rose-600 hover:!bg-rose-500 w-full"
            disabled={isLoggingOut.pending}
            as={"button"}
            closeOnSelect={false}
            type="submit"
          >
            <Switch fallback={<LogOut class="size-4" />}>
              <Match when={isLoggingOut.pending}>
                <Loader2 class="size-4 animate-spin" />
              </Match>
            </Switch>
            <span>Log out</span>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
