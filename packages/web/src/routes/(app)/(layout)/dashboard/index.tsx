// import { Weather } from "@/components/Weather";
import { Statistics } from "@/components/Statistics";
import { StorageStatistics } from "@/components/StorageStatistics";
import { getStatistics } from "@/lib/api/statistics";
import { getSystemNotifications } from "@/lib/api/system_notifications";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { A, createAsync, RouteDefinition } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { Show, Suspense } from "solid-js";

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
        <Show when={session() && session()}>
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
                <div class="flex flex-col w-full gap-2 grow relative p-2">
                  <div class="flex flex-col w-full gap-3 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-800">
                    <h2 class="text-lg font-bold leading-none">{c().name}</h2>
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-sm font-medium text-muted-foreground">{c().email}</span>
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
