import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chooseApplication, removeApplication } from "@/lib/api/applications";
import { getStatistics } from "@/lib/api/statistics";
import { getSystemNotifications } from "@/lib/api/system_notifications";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { A, createAsync, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import { createMutation } from "@tanstack/solid-query";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    const session = await getAuthenticatedSession();
    const notification = await getSystemNotifications();
    const stats = await getStatistics();
    return { notification, session, stats };
  },
} satisfies RouteDefinition;

export default function CreateApplicationPage() {
  const session = createAsync(() => getAuthenticatedSession(), { deferStream: true });

  const chooseApplicationAction = useAction(chooseApplication);
  const chooseApplicationSubmission = useSubmission(chooseApplication);

  const removeApplicationAction = useAction(removeApplication);
  const removeApplicationSubmission = useSubmission(removeApplication);

  const [confirmRemovalModalOpen, setConfirmRemovalModalOpen] = createSignal(false);

  const copyToClipboard = createMutation(() => ({
    key: ["copyToClipboard"],
    mutationFn: async (text: string) => {
      if (!window) {
        throw new Error("Window not available");
      }
      if (!window.navigator) {
        throw new Error("Navigator API not available");
      }
      if (!window.navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }
      navigator.clipboard.writeText(text);
    },
  }));

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
            <div class="p-4 pt-0 w-full h-full grow flex flex-col">
              <div class="flex flex-col w-full gap-4 rounded-sm h-full grow">
                <div class="flex flex-row items-center justify-between gap-2">
                  <h2 class="text-lg font-bold leading-none">Your Applications</h2>
                  <Button size="sm" as={A} href="/dashboard/applications/create" class="gap-2">
                    Create Application
                    <Plus class="size-4" />
                  </Button>
                </div>
                <div class="flex flex-col gap-2">
                  <For
                    each={s().applications}
                    fallback={
                      <div class="flex flex-col gap-2 items-center justify-center">
                        <span class="text-sm font-bold text-muted-foreground">No applications found</span>
                        <Button size="sm" as={A} href="/dashboard/applications/create" class="gap-2">
                          Create Application
                          <Plus class="size-4" />
                        </Button>
                      </div>
                    }
                  >
                    {(app) => (
                      <div class="flex flex-row gap-2 items-center border border-neutral-200 dark:border-neutral-800 p-4 w-full rounded-sm">
                        <div class="flex flex-col gap-4 w-full">
                          <div class="flex flex-row gap-1 items-center justify-between">
                            <div class="flex flex-col gap-2 items-start">
                              <div class="flex flex-row items-baseline justify-center gap-2 w-max">
                                <span class="text-sm font-bold">{app.name}</span>
                                <Button
                                  size="icon"
                                  variant="link"
                                  onClick={() =>
                                    toast.promise(copyToClipboard.mutateAsync(app.token), {
                                      loading: "Copying...",
                                      success: "Copied",
                                      error: "Failed to copy",
                                    })
                                  }
                                  class="gap-2 size-auto"
                                >
                                  <span class="font-bold text-xs text-muted-foreground">{app.token}</span>
                                </Button>
                              </div>
                              <span class="text-xs text-muted-foreground">{app.owner.name}</span>
                            </div>
                            <div class="flex flex-row gap-1 items-center justify-end">
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
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    class="flex flex-row items-center justify-center gap-2 w-full"
                                  >
                                    <MoreHorizontal class="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <AlertDialog
                                    open={confirmRemovalModalOpen()}
                                    onOpenChange={setConfirmRemovalModalOpen}
                                  >
                                    <AlertDialogTrigger
                                      as={DropdownMenuItem}
                                      disabled={
                                        removeApplicationSubmission.pending &&
                                        removeApplicationSubmission.input[0] === app.id
                                      }
                                      closeOnSelect={false}
                                    >
                                      Delete
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader class="font-bold">
                                        Removing Application: {app.name}...
                                      </AlertDialogHeader>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove this application? This action cannot be undone.
                                      </AlertDialogDescription>
                                      <AlertDialogFooter>
                                        <AlertDialogClose>Cancel.</AlertDialogClose>
                                        <AlertDialogAction
                                          variant="destructive"
                                          onClick={() =>
                                            toast.promise(removeApplicationAction(app.id), {
                                              loading: "Removing application...",
                                              success: "Application removed successfully",
                                              error: "Failed to remove application",
                                            })
                                          }
                                        >
                                          Yes, Remove Application!
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div class="flex flex-col gap-2 items-start">
                            <span class="text-sm font-bold">Workflows</span>
                            <div class="flex flex-col gap-2 items-start justify-start w-full">
                              <For
                                each={app.workflows}
                                fallback={
                                  <div class="flex flex-col gap-4 items-center justify-center p-8 rounded-sm w-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                                    <span class="text-sm font-bold text-muted-foreground">No workflows found</span>
                                    <div class="flex flex-row gap-2 items-center justify-center">
                                      <Button
                                        size="sm"
                                        as={A}
                                        href={`/dashboard/applications/${app.id}/workflows/create`}
                                        class="gap-2"
                                      >
                                        Create Workflow
                                        <Plus class="size-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // TODO: Add 'example-workflow' workflow.
                                        }}
                                        class="gap-2"
                                      >
                                        Add Example Workflow
                                      </Button>
                                    </div>
                                  </div>
                                }
                              >
                                {(wf) => (
                                  <div>
                                    <div class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 p-4 w-full rounded-sm">
                                      <span>{wf.workflow.name}</span>
                                      <div class="flex flex-row gap-2 items-start">
                                        <For each={wf.workflow.steps}>
                                          {(step) => (
                                            <div class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 p-4 w-full rounded-sm">
                                              <span>{step.step.name}</span>
                                              <div class="flex flex-row gap-2 items-start">
                                                <For each={step.step.tasks}>
                                                  {(task) => (
                                                    <div class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 p-4 w-full rounded-sm">
                                                      <span>{task.task.name}</span>
                                                    </div>
                                                  )}
                                                </For>
                                              </div>
                                            </div>
                                          )}
                                        </For>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </For>
                            </div>
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
