import { getAuthenticatedSession } from "@/lib/auth/util";
import { createAsync, RouteDefinition } from "@solidjs/router";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import Loader2 from "lucide-solid/icons/loader-2";
import User from "lucide-solid/icons/user";
import { Show, Suspense } from "solid-js";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    return { session };
  },
} satisfies RouteDefinition;

export default function Settings() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });

  return (
    <div class="w-full flex flex-col gap-2 h-full grow py-4 lg:pt-0">
      <Suspense
        fallback={
          <div class="flex flex-col w-full py-10 gap-4 items-center justify-center">
            <Loader2 class="size-4 animate-spin" />
          </div>
        }
      >
        <Show when={session() && session()!.user !== null && session()}>
          {(s) => (
            <div class="w-full flex flex-col gap-2 px-4">
              <span class="text-2xl font-bold">Profile</span>
              <div class="flex flex-col gap-2">
                <div class="flex flex-row gap-2">
                  <div class="flex flex-col gap-2">
                    <div class="flex flex-row gap-2 items-center">
                      <div class="flex flex-row gap-2 items-center">
                        <Show when={s().user!.image} fallback={<User class="size-4" />}>
                          {(image) => (
                            <>
                              <img
                                class="w-10 h-10 rounded-full"
                                src={image()}
                                alt={s().user!.name}
                                title={s().user!.name}
                              />
                            </>
                          )}
                        </Show>
                        <div class="flex flex-col gap-0.5 items-start">
                          <span class="font-bold">{s().user!.name}</span>
                          <span class="text-xs text-muted-foreground font-normal">{s().user!.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
