// import { Weather } from "@/components/Weather";
import { Statistics } from "@/components/Statistics";
import { StorageStatistics } from "@/components/StorageStatistics";
import { getStatistics } from "@/lib/api/statistics";
import { getSystemNotifications } from "@/lib/api/system_notifications";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { A, createAsync, RouteDefinition } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import Wrench from "lucide-solid/icons/wrench";
import { Show, Suspense } from "solid-js";
import { Badge } from "../../../../components/ui/badge";

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    const notification = await getSystemNotifications();
    const stats = await getStatistics();
    return { notification, session, stats };
  },
} satisfies RouteDefinition;

export default function DashboardPage() {
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
        <Show when={session() && session()!.user !== null && session()}>
          {(s) => (
            <Show
              when={s().organizations.length > 0 && s().organization}
              fallback={
                <div class="flex flex-col w-full grow h-full gap-4 p-1 items-center justify-center">
                  <div class="flex flex-col w-1/4 items-center justify-center rounded-sm px-4 py-20 gap-4 bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-900">
                    <span class="text-sm">You currently have no organization.</span>
                    <span class="text-sm">
                      <Button
                        as={A}
                        href="/dashboard/organizations/create"
                        size="sm"
                        class="flex flex-row gap-2 leading-none"
                      >
                        <Plus class="size-4" />
                        Create an Organization
                      </Button>{" "}
                    </span>
                  </div>
                </div>
              }
            >
              {(c) => (
                <div class="flex flex-col w-full grow relative">
                  <div class="flex flex-col w-full border-b border-neutral-200 dark:border-neutral-800 p-4 pt-0  gap-2">
                    <h2 class="text-2xl font-bold leading-none">
                      Welcome {Math.abs(dayjs(s().createdAt).diff(dayjs(), "minutes")) > 5 ? "back" : ""} to {c().name}
                    </h2>
                    <div class="text-xs font-medium leading-none text-muted-foreground">
                      <Show
                        when={s().applications.length > 0 && s().application}
                        fallback={
                          <Show
                            when={s().applications.length === 0}
                            fallback={
                              <span>
                                Please{" "}
                                <A href="/dashboard/applications" class="text-blue-500 font-bold hover:underline">
                                  select an application
                                </A>{" "}
                                first.
                              </span>
                            }
                          >
                            <span>
                              Please{" "}
                              <A href="/dashboard/applications/create" class="text-blue-500 font-bold hover:underline">
                                create an application
                              </A>{" "}
                              first.
                            </span>
                          </Show>
                        }
                      >
                        {(app) => (
                          <span class="flex flex-row gap-1 items-center">
                            You are currently on
                            <Badge variant="outline" class="px-1.5 group gap-2 py-0 h-auto pr-0">
                              <span class="py-0.5 group-hover:pr-0 pr-1.5">{app().name}</span>
                              <A
                                class="group-hover:flex hidden cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 h-full p-1 rounded-sm rounded-tl-none rounded-bl-none"
                                href="/dashboard/applications"
                              >
                                <Wrench class="size-3" />
                              </A>
                            </Badge>
                          </span>
                        )}
                      </Show>
                    </div>
                  </div>
                  <StorageStatistics />
                  <Statistics />
                </div>
              )}
            </Show>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
