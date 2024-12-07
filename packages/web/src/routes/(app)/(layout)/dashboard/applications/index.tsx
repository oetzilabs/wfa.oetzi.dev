import { TextField } from "@/components/form-components/textfield";
import { Button } from "@/components/ui/button";
import { chooseApplication, createApplication } from "@/lib/api/applications";
import { getStatistics } from "@/lib/api/statistics";
import { getSystemNotifications } from "@/lib/api/system_notifications";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { createForm, SubmitHandler, valiForm } from "@modular-forms/solid";
import { A, createAsync, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { email, InferOutput, minLength, pipe, strictObject, string, url } from "valibot";

const MinValue = (x: number) => pipe(string(), minLength(x, `Must be at least ${x} characters`));

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    const notification = await getSystemNotifications();
    const stats = await getStatistics();
    return { notification, session, stats };
  },
} satisfies RouteDefinition;

const CreateApplicationSchema = strictObject({
  name: MinValue(3),
});

type CreateApplicationForm = InferOutput<typeof CreateApplicationSchema>;

export default function CreateApplicationPage() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });

  const chooseApplicationAction = useAction(chooseApplication);
  const chooseApplicationSubmission = useSubmission(chooseApplication);

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
            <div class="p-4 w-full h-full grow flex flex-col">
              <div class="flex flex-col w-full gap-4 rounded-sm h-full grow">
                <div class="flex flex-row items-center justify-between gap-2">
                  <h2 class="text-lg font-bold leading-none">Your Applications</h2>
                  <Button size="sm" as={A} href="/dashboard/applications/create" class="gap-2">
                    Create Application
                    <Plus class="size-4" />
                  </Button>
                </div>
                <div class="flex flex-col gap-2">
                  <For each={s().applications}>
                    {(app) => (
                      <div class="flex flex-row gap-2 items-center border border-neutral-200 dark:border-neutral-800 p-4 w-full rounded-sm">
                        <div class="flex flex-col gap-4 w-full">
                          <div class="flex flex-row gap-1 items-center justify-between">
                            <div class="flex flex-col gap-1 items-start">
                              <div class="flex flex-row items-baseline justify-center gap-2 w-max">
                                <span class="text-sm font-bold">{app.name}</span>
                                <span class="font-bold text-xs text-muted-foreground">{app.token}</span>
                              </div>
                              <span class="text-xs text-muted-foreground">{app.owner.name}</span>
                            </div>
                            <div class="flex flex-col gap-1 items-start">
                              <Button
                                size="sm"
                                disabled={
                                  app.id === s().application?.id ||
                                  (chooseApplicationSubmission.pending &&
                                    chooseApplicationSubmission.input[0] === app.id)
                                }
                                onClick={() =>
                                  toast.promise(chooseApplicationAction(app.id), {
                                    loading: "Choosing application...",
                                    success: "Application chosen",
                                    error: "Failed to choose application",
                                  })
                                }
                              >
                                Choose
                              </Button>
                            </div>
                          </div>
                          <div class="flex flex-col gap-1 items-start">
                            <span class="text-sm font-bold">Workflows</span>
                            <span class="text-xs text-muted-foreground">123</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
