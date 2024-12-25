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
import { getTasks, testTask } from "@/lib/api/tasks";
import { addExampleWorkflow, removeWorkflow } from "@/lib/api/workflows";
import { getAuthenticatedSession } from "@/lib/auth/util";
import { update } from "@solid-primitives/signal-builders";
import { A, createAsync, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import { createMutation } from "@tanstack/solid-query";
import { DEFAULT_CONFIG } from "@wfa/core/src/tasks/config";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Play from "lucide-solid/icons/play";
import Plus from "lucide-solid/icons/plus";
import Repeat from "lucide-solid/icons/repeat";
import { createSignal, For, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";
import { Badge } from "../../../../../components/ui/badge";
import { Skeleton } from "../../../../../components/ui/skeleton";
import { TextArea } from "../../../../../components/ui/textarea";
import { TextFieldRoot } from "../../../../../components/ui/textfield";
import { ToggleButton } from "../../../../../components/ui/toggle";

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

  const tasks = createAsync(() => getTasks(), { deferStream: true });

  const testTasksAction = useAction(testTask);
  const testTasksSubmission = useSubmission(testTask);

  const addExampleWorkflowAction = useAction(addExampleWorkflow);
  const addExampleWorkflowSubmission = useSubmission(addExampleWorkflow);

  const removeWorkflowAction = useAction(removeWorkflow);
  const removeWorkflowSubmission = useSubmission(removeWorkflow);

  const copyTokenToClipboard = createMutation(() => ({
    key: ["copyTokenToClipboard"],
    mutationFn: async (text: string) => {
      if (!window) {
        throw new Error("Window is not available");
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

  const [taskInputs, setTaskInputs] = createStore<{ [key: string]: any }>({});
  const [config, setConfig] = createStore<{ [key: string]: any }>({});

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
                <div class="flex flex-col gap-2 w-full">
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
                          <div class="flex flex-row gap-1 items-center justify-between w-full">
                            <div class="flex flex-col gap-2 items-start w-full">
                              <div class="flex flex-row items-baseline justify-center gap-2 w-max">
                                <span class="text-sm font-bold">{app.name}</span>
                                <Button
                                  size="icon"
                                  variant="link"
                                  onClick={() =>
                                    toast.promise(copyTokenToClipboard.mutateAsync(app.token), {
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
                            <div class="flex flex-row gap-1 items-center justify-end w-max">
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
                                  <Button variant="outline" size="icon">
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
                          <div class="flex flex-col gap-4 items-start w-full">
                            <span class="text-sm font-bold w-full">Workflows</span>
                            <div class="flex flex-col gap-4 items-start justify-start w-full">
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
                                          toast.promise(addExampleWorkflowAction(app.id), {
                                            loading: "Adding example workflow...",
                                            success: "Example workflow added successfully",
                                            error: (error) => "Failed to add example workflow: " + error.message,
                                          });
                                        }}
                                        class="gap-2"
                                        disabled={addExampleWorkflowSubmission.pending}
                                      >
                                        Add Example Workflow
                                      </Button>
                                    </div>
                                  </div>
                                }
                              >
                                {(wf) => (
                                  <div class="flex flex-col gap-4 items-start w-full">
                                    <div class="flex flex-col gap-4 items-start border border-neutral-200 dark:border-neutral-800 p-2 w-full rounded-sm">
                                      <div class="w-full flex flex-row items-center justify-between gap-2 ">
                                        <span class="text-sm font-bold">{wf.workflow.name}</span>
                                        <div class="flex flex-row gap-2 items-center">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger
                                              as={Button}
                                              variant="outline"
                                              size="icon"
                                              class="size-6"
                                            >
                                              <MoreHorizontal class="size-3" />
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
                                                    Removing Workflow: {app.name}...
                                                  </AlertDialogHeader>
                                                  <AlertDialogDescription>
                                                    Are you sure you want to remove this workflow? This action cannot be
                                                    undone.
                                                  </AlertDialogDescription>
                                                  <AlertDialogFooter>
                                                    <AlertDialogClose>Cancel.</AlertDialogClose>
                                                    <AlertDialogAction
                                                      variant="destructive"
                                                      disabled={
                                                        removeWorkflowSubmission.pending &&
                                                        removeWorkflowSubmission.input[0] === wf.workflow.id
                                                      }
                                                      onClick={() =>
                                                        toast.promise(removeWorkflowAction(wf.workflow.id), {
                                                          loading: "Removing workflow...",
                                                          success: "Workflow removed successfully",
                                                          error: "Failed to remove workflow",
                                                        })
                                                      }
                                                    >
                                                      Yes, Remove Workflow!
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                      <div class="flex flex-row gap-2 items-start w-full">
                                        <For each={wf.workflow.steps}>
                                          {(step) => (
                                            <div class="flex flex-col gap-0 items-start border border-neutral-200 dark:border-neutral-800 w-full rounded-sm overflow-clip">
                                              <div class="flex flex-row font-bold p-2 bg-neutral-100 dark:bg-neutral-900 w-full items-center justify-between">
                                                <span class="text-xs">{step.step.name}</span>
                                                <div class="flex flex-row item-end justify-end gap-1">
                                                  <Button size="icon" variant="outline" class="size-6">
                                                    <MoreHorizontal class="size-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                              <div class="flex flex-row gap-2 items-start w-full p-2 h-max">
                                                <Show when={tasks() && tasks()}>
                                                  {(tc) => (
                                                    <For each={step.step.tasks}>
                                                      {(task) => (
                                                        <div class="flex flex-col gap-2 items-start border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 w-full text-xs h-max">
                                                          <span class="text-xs font-semibold">
                                                            Step: {task.task.name}
                                                          </span>
                                                          <div class="flex flex-row gap-2 items-start w-full h-max">
                                                            <div class="flex flex-col gap-2 items-start p-2 w-full h-max">
                                                              <span>Input:</span>
                                                              <pre class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 w-full min-h-10 bg-neutral-50 dark:bg-neutral-900 rounded-sm p-2">
                                                                {
                                                                  tc().find((t) => t.name === task.task.name)
                                                                    ?.blueprints.input
                                                                }
                                                              </pre>
                                                            </div>
                                                            <div class="flex flex-col gap-2 items-start p-2 w-full h-max">
                                                              <span>Output:</span>
                                                              <pre class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 w-full min-h-10 bg-neutral-50 dark:bg-neutral-900 rounded-sm p-2">
                                                                {
                                                                  tc().find((t) => t.name === task.task.name)
                                                                    ?.blueprints.output
                                                                }
                                                              </pre>
                                                            </div>
                                                            <div class="flex flex-col gap-2 items-start p-2 w-full h-max">
                                                              <span>Errors:</span>
                                                              <pre class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 w-full min-h-10 bg-neutral-50 dark:bg-neutral-900 rounded-sm p-2">
                                                                {
                                                                  tc().find((t) => t.name === task.task.name)
                                                                    ?.blueprints.errors
                                                                }
                                                              </pre>
                                                            </div>
                                                          </div>
                                                          <span class="text-xs">Input:</span>
                                                          <TextFieldRoot
                                                            class=" text-muted-foreground w-full"
                                                            value={taskInputs[task.task.id] ?? ""}
                                                            onChange={(value) =>
                                                              setTaskInputs(update(taskInputs, task.task.id, value))
                                                            }
                                                          >
                                                            <TextArea autoResize class="text-xs font-mono" />
                                                          </TextFieldRoot>
                                                          <div class="flex flex-row gap-2 items-center">
                                                            <For
                                                              each={
                                                                Object.keys(
                                                                  DEFAULT_CONFIG,
                                                                ) as (keyof typeof DEFAULT_CONFIG)[]
                                                              }
                                                            >
                                                              {(configuration) => (
                                                                <ToggleButton
                                                                  size="sm"
                                                                  value={config[task.task.id]?.logging ?? false}
                                                                  onChange={() => {
                                                                    if (!config[task.task.id]) {
                                                                      setConfig(
                                                                        update(config, task.task.id, DEFAULT_CONFIG),
                                                                      );
                                                                      return;
                                                                    }

                                                                    setConfig(
                                                                      update(config, task.task.id, {
                                                                        ...config[task.task.id],
                                                                        [configuration]:
                                                                          !config[task.task.id][configuration],
                                                                      }),
                                                                    );
                                                                  }}
                                                                  class="capitalize"
                                                                >
                                                                  {configuration}{" "}
                                                                  {config[task.task.id]?.[configuration] ? "on" : "off"}
                                                                </ToggleButton>
                                                              )}
                                                            </For>
                                                          </div>
                                                          <div class="flex flex-row gap-2 items-center">
                                                            <Button
                                                              size="sm"
                                                              onClick={() => {
                                                                let input = undefined;
                                                                try {
                                                                  input = JSON.parse(taskInputs[task.task.id]);
                                                                } catch (e) {
                                                                  if (e instanceof SyntaxError)
                                                                    toast.error("Invalid input, please try again.", {
                                                                      description: e.message,
                                                                    });
                                                                  else toast.error("Invalid input, please try again.");
                                                                  return;
                                                                }
                                                                if (!input) {
                                                                  toast.error("Invalid input, please try again");
                                                                  return;
                                                                }

                                                                const mergedInput = {
                                                                  ...input,
                                                                  config: config[task.task.id],
                                                                };

                                                                toast.promise(
                                                                  testTasksAction(task.task.id, mergedInput),
                                                                  {
                                                                    loading: "Testing task...",
                                                                    success: "Task tested successfully",
                                                                    error: (error) =>
                                                                      "Failed to test task: " + error.message,
                                                                  },
                                                                );
                                                              }}
                                                              disabled={testTasksSubmission.pending}
                                                              class="gap-2 w-max"
                                                            >
                                                              <Show
                                                                when={testTasksSubmission.pending}
                                                                fallback={<Play class="size-4" />}
                                                              >
                                                                <Loader2 class="size-4 animate-spin" />
                                                              </Show>
                                                              Test
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              onClick={() => {
                                                                setTaskInputs(
                                                                  update(
                                                                    taskInputs,
                                                                    task.task.id,
                                                                    task.task.example ?? "",
                                                                  ),
                                                                );
                                                                setConfig(
                                                                  update(config, task.task.id, {
                                                                    logging: true,
                                                                  }),
                                                                );
                                                                testTasksSubmission.clear();
                                                              }}
                                                              disabled={testTasksSubmission.pending}
                                                              variant="secondary"
                                                              class="gap-2 w-max"
                                                            >
                                                              <Repeat class="size-4" />
                                                              Reset
                                                            </Button>
                                                          </div>
                                                          <div class="w-full h-px bg-neutral-200 dark:bg-neutral-800" />
                                                          <Show
                                                            when={testTasksSubmission.pending !== undefined}
                                                            fallback={
                                                              <div class="w-full flex flex-col items-start justify-center gap-2 border border-neutral-200 dark:border-neutral-800 p-2 rounded-sm bg-neutral-50 dark:bg-neutral-900">
                                                                <span class="text-xs text-neutral-500">
                                                                  Please press the "Test" button to run the task.
                                                                </span>
                                                              </div>
                                                            }
                                                          >
                                                            <Show
                                                              when={
                                                                !testTasksSubmission.pending &&
                                                                testTasksSubmission.result
                                                              }
                                                              fallback={
                                                                <Show
                                                                  when={testTasksSubmission.pending}
                                                                  fallback={
                                                                    <div class="w-full flex flex-col items-start justify-center gap-2 border border-red-500 dark:border-red-500 p-2 rounded-sm bg-red-50 dark:bg-red-900">
                                                                      <span class="text-xs text-red-500">
                                                                        Failed to run task:
                                                                      </span>
                                                                      <span class="text-xs p-2 rounded-sm w-full bg-white min-h-40">
                                                                        {JSON.stringify(
                                                                          testTasksSubmission.error,
                                                                          null,
                                                                          2,
                                                                        )}
                                                                      </span>
                                                                    </div>
                                                                  }
                                                                >
                                                                  <div class="flex flex-row gap-1 items-center justify-center">
                                                                    <Skeleton class="h-6 w-20 rounded-sm" />
                                                                    <Skeleton class="h-6 w-40 rounded-sm" />
                                                                  </div>
                                                                  <Skeleton class="min-h-20 w-full" />
                                                                </Show>
                                                              }
                                                            >
                                                              {(result) => (
                                                                <div class="flex flex-col gap-2 items-start justify-center">
                                                                  <div class="flex flex-row gap-1.5 items-center justify-center">
                                                                    <Badge variant="outline">
                                                                      {result().type === "success"
                                                                        ? "Task ran successfully"
                                                                        : "Task failed to run"}
                                                                    </Badge>
                                                                    <Badge variant="outline">
                                                                      Duration: {result().duration}ms
                                                                    </Badge>
                                                                  </div>
                                                                  <pre class="text-xs border border-neutral-200 dark:border-neutral-800 p-2 rounded-sm w-full">
                                                                    {JSON.stringify(
                                                                      result().type === "success"
                                                                        ? result().data
                                                                        : result().error,
                                                                      null,
                                                                      2,
                                                                    )}
                                                                  </pre>
                                                                </div>
                                                              )}
                                                            </Show>
                                                          </Show>
                                                        </div>
                                                      )}
                                                    </For>
                                                  )}
                                                </Show>
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
