import type { LucideProps } from "lucide-solid";
import { getStatistics } from "@/lib/api/statistics";
import { cn } from "@/lib/utils";
import { createAsync } from "@solidjs/router";
import Box from "lucide-solid/icons/box";
import FileCheck from "lucide-solid/icons/file-check";
import FileX from "lucide-solid/icons/file-x";
import Files from "lucide-solid/icons/files";
import Loader2 from "lucide-solid/icons/loader-2";
import TrendingUp from "lucide-solid/icons/trending-up";
import { For, JSX, Show, Suspense } from "solid-js";

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
    <div class="flex flex-row items-center justify-between gap-2 md:px-4 md:pb-4 md:pt-4 px-3 py-2">
      <div class="flex-1 size-4">
        <Show when={props.icon !== undefined && props.icon} fallback={<Box />} keyed>
          {(Ic) => <Ic class="size-4 text-muted-foreground" />}
        </Show>
      </div>
      <span class="font-bold uppercase text-xs text-muted-foreground md:flex hidden">{props.label}</span>
      <div class="transition-[font-size] text-base md:text-3xl font-bold md:hidden flex flex-row items-baseline gap-2 font-['Geist_Mono']">
        <span>{props.value}</span>
      </div>
    </div>
    <div class="flex-row items-center justify-between gap-4 px-4 py-4 hidden md:flex">
      <div class=""></div>
      <div class="transition-[font-size] text-base md:text-3xl font-bold flex flex-row items-baseline gap-2 font-['Geist_Mono']">
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

export function Statistics() {
  const stats = createAsync(() => getStatistics());
  return (
    <div class="flex flex-col w-full gap-2 p-2 border-b border-neutral-200 dark:border-neutral-800">
      <div class="grid grid-flow-col md:grid-cols-4 gap-0 w-full border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-clip">
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
    </div>
  );
}
