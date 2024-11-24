import { language } from "@/components/stores/Language";
// import { Weather } from "@/components/Weather";
import { getStatistics } from "@/lib/api/statistics";
import { getSystemNotifications } from "@/lib/api/system_notifications";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { cn } from "@/lib/utils";
import { A, createAsync, RouteDefinition } from "@solidjs/router";
import { type LucideProps } from "lucide-solid";
import Box from "lucide-solid/icons/box";
import Plus from "lucide-solid/icons/plus";
import FileCheck from "lucide-solid/icons/file-check";
import FileX from "lucide-solid/icons/file-x";
import Files from "lucide-solid/icons/files";
import Loader2 from "lucide-solid/icons/loader-2";
import TrendingUp from "lucide-solid/icons/trending-up";
import { For, JSX, Show, Suspense } from "solid-js";
import { Button } from "~/components/ui/button";

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    const notification = await getSystemNotifications();
    const stats = await getStatistics();
    return { notification, session, stats };
  },
} satisfies RouteDefinition;

const icons: Record<string, (props: LucideProps) => JSX.Element> = {
  documents: Files,
  completed: FileCheck,
  failed: FileX,
  "average rate": TrendingUp,
};

const Statistic = (props: {
  label: string;
  value: number;
  icon?: (props: LucideProps) => JSX.Element;
  index: number;
  priority: number;
  description: string;
}) => (
  <div
    class={cn(
      "flex flex-col w-full gap-0 select-none border-l first:border-l-0 border-neutral-200 dark:border-neutral-800 relative overflow-clip group",
    )}
  >
    <div class="flex flex-row items-center justify-between gap-2 md:px-6 md:pb-4 md:pt-6 px-3 py-2">
      <div class="flex-1 size-4">
        <Show when={props.icon !== undefined && props.icon} fallback={<Box />} keyed>
          {(Ic) => <Ic class="size-4 text-muted-foreground" />}
        </Show>
      </div>
      <span class="font-bold uppercase text-xs text-muted-foreground md:flex hidden">{props.label}</span>
      <div class="transition-[font-size] text-base md:text-3xl font-bold md:hidden flex flex-row items-baseline gap-2">
        <span>{props.value}</span>
      </div>
    </div>
    <div class="flex-row items-center justify-between gap-4 px-6 py-4 hidden md:flex">
      <div class=""></div>
      <div class="transition-[font-size] text-base md:text-3xl font-bold flex flex-row items-baseline gap-2">
        <span>{props.value}</span>
      </div>
    </div>
    <div
      class={cn(
        "transition-all w-full border-b border-neutral-200 dark:border-neutral-800 py-6 px-6 leading-none text-muted-foreground absolute -top-full group-hover:top-0 left-0 right-0 backdrop-blur hidden md:flex",
        {
          "bg-neutral-950/10 dark:bg-neutral-100/10 text-black dark:text-white": props.priority === 1,
        },
      )}
    >
      <span class="text-xs">{props.description}</span>
    </div>
  </div>
);

export default function DashboardPage() {
  const stats = createAsync(() => getStatistics());
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });

  return (
    <div class="w-full grow flex flex-col h-full">
      <Suspense
        fallback={
          <div class="flex flex-col w-full h-full grow items-center justify-center">
            <Loader2 class="size-4 animate-spin" />
          </div>
        }
      >
        <Show when={session() && session()}>
          {(s) => (
            <Show
              when={s().organizations.length > 0 && s().organization}
              fallback={
                <div class="flex flex-col w-full grow h-full gap-4 p-1 items-center justify-center">
                  <div class="flex flex-col w-1/4 items-center justify-center rounded-md px-4 py-20 gap-4 bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-900">
                    <span class="text-sm">You currently have no organization.</span>
                    <span class="text-sm">
                      <Button as={A} href="/dashboard/organizations/create" size="sm" class="flex flex-row gap-2 leading-none">
                        <Plus class="size-4"/>
                        Create an Organization
                      </Button>{" "}
                    </span>
                  </div>
                </div>
              }
            >
              {(c) => (
                <div class="flex flex-col w-full gap-0 grow relative p-1">
                  <div class="flex flex-col w-full gap-3 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <h2 class="text-lg font-bold leading-none">{c().name}</h2>
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-sm font-medium text-muted-foreground">{c().email}</span>
                    </div>
                  </div>
                  <div class="flex flex-col w-full py-4 gap-4 grow">
                    <div class="grid grid-flow-col md:grid-cols-4 gap-0 w-full border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-clip">
                      <Suspense
                        fallback={
                          <div class="flex flex-col w-full col-span-full py-10 gap-4 items-center justify-center">
                            <Loader2 class="size-4 animate-spin" />
                          </div>
                        }
                      >
                        <Show when={stats() && stats()}>
                          {(ss) => (
                            <For each={Object.entries(ss())}>
                              {([sName, sValue], i) => (
                                <Statistic
                                  label={sName}
                                  value={sValue.value}
                                  icon={icons[sName]}
                                  priority={sValue.priority}
                                  description={sValue.description}
                                  index={i()}
                                />
                              )}
                            </For>
                          )}
                        </Show>
                      </Suspense>
                    </div>
                    <div class="flex flex-col-reverse xl:flex-row w-full gap-4 grow">
                      <Suspense
                        fallback={
                          <div class="flex flex-col w-full py-10 gap-4 items-center justify-center">
                            <Loader2 class="size-4 animate-spin" />
                          </div>
                        }
                      >
                        <div class=""></div>
                        {/* <Show when={rides() && rides()}>{(rs) => }</Show> */}
                      </Suspense>
                      <div class="gap-2 flex flex-col w-full xl:w-80 h-max">
                        {/* <Weather /> */}
                        {/* <Hotspots /> */}
                        {/* <Events /> */}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Show>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
