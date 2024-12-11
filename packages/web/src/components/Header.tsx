import { useColorMode } from "@kobalte/core";
import { A, createAsync, useLocation, useResolvedPath } from "@solidjs/router";
import LogIn from "lucide-solid/icons/log-in";
import Moon from "lucide-solid/icons/moon";
import Sun from "lucide-solid/icons/sun";
import { createMemo, Show } from "solid-js";
import { getAuthenticatedSession } from "../lib/auth/util";
import { cn } from "../lib/utils";
import { AppSearch } from "./AppSearch";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

export function Header() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });
  const location = useLocation();
  const path = useResolvedPath(() => location.pathname);

  const hiddenPaths = ["/auth/login", "/auth/register"];

  const isHiddenPath = createMemo(() => hiddenPaths.includes(path() ?? ""));

  const isDashboard = createMemo(() => path()?.includes("/dashboard"));

  const { toggleColorMode, colorMode } = useColorMode();

  return (
    <header
      class={cn(
        "bg-background flex flex-row w-full py-3.5 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 h-[60px]",
        {
          hidden: isHiddenPath(),
        },
      )}
    >
      <div class="flex flex-row w-full items-center justify-between px-4">
        <div class="flex flex-row items-center justify-start w-max gap-2">
          <A href="/" class="flex flex-row gap-4 items-center justify-center">
            <Logo small />
          </A>
        </div>
        <div class="w-full flex flex-col items-start justify-center px-4">
          {/* <AppSearch /> */}
          <Show when={!isDashboard()}>
            <A href="/dashboard" class="text-sm font-semibold text-muted-foreground hover:text-foreground">
              Dashboard
            </A>
          </Show>
        </div>
        <div class="w-max items-center justify-end flex flex-row gap-2">
          <div class="w-max flex text-base gap-2.5">
            <Button
              onClick={() => {
                toggleColorMode();
              }}
              size="icon"
              variant="outline"
              class="size-8 rounded-full p-0"
            >
              <Show when={colorMode() === "dark"} fallback={<Moon class="size-4" />}>
                <Sun class="size-4" />
              </Show>
            </Button>

            <Show when={!session() || session()!.user === null}>
              <Button
                as={A}
                href="/auth/login"
                variant="outline"
                size="sm"
                class="flex flex-row gap-2 items-center justify-center w-max"
              >
                <LogIn class="size-3" />
                Login
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}
