import { getStorageStatistics } from "@/lib/api/storage";
import { createAsync } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import { Progress } from "./ui/progress";

export function StorageStatistics() {
  const storage = createAsync(() => getStorageStatistics());
  return (
    <Suspense fallback={<div class="flex items-center justify-center">Loading...</div>}>
      <Show when={storage() && storage()}>
        {(s) => (
          <div class="flex flex-col w-full gap-2 p-2 pb-0 border-b-0 border-neutral-200 dark:border-neutral-800">
            <div class="flex flex-col w-full gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-800">
              <div class="grid w-full grid-cols-1 md:grid-cols-3 gap-2">
                <div class="w-full flex flex-col gap-4 border-b border-r-0 border-neutral-200 dark:border-neutral-800 md:border-b-0 md:border-r p-4 last:border-b-0 last:border-r-0">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-bold leading-none">Storage</h2>
                    <span class="text-sm font-bold tracking-wider font-['Geist_Mono']">
                      {s().space.used}/{s().space.total}
                    </span>
                  </div>
                  <div class="w-full">
                    <Progress value={s().space.used} maxValue={s().space.total} />
                  </div>
                </div>
                <div class="w-full flex flex-col gap-4 border-b border-r-0 border-neutral-200 dark:border-neutral-800 md:border-b-0 md:border-r p-4 last:border-b-0 last:border-r-0">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-bold leading-none">Files</h2>
                    <span class="text-sm font-bold tracking-wider font-['Geist_Mono']">
                      {s().files.used}/{s().files.total}
                    </span>
                  </div>
                  <div class="w-full">
                    <Progress value={s().files.used} maxValue={s().files.total} />
                  </div>
                </div>
                <div class="w-full flex flex-col gap-4 border-b border-r-0 border-neutral-200 dark:border-neutral-800 md:border-b-0 md:border-r p-4 last:border-b-0 last:border-r-0">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-bold leading-none">Mails</h2>
                    <span class="text-sm font-bold tracking-wider font-['Geist_Mono']">
                      {s().mails.used}/{s().mails.total}
                    </span>
                  </div>
                  <div class="w-full">
                    <Progress value={s().mails.used} maxValue={s().mails.total} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
