import type { Tasks } from "@wfa/core/src/entities/tasks";
import { update } from "@solid-primitives/signal-builders";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { useAction, useSubmission } from "@solidjs/router";
import { DEFAULT_CONFIG } from "@wfa/core/src/tasks/config";
import { Loader2, Play, Repeat } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";
import { testTask } from "../lib/api/tasks";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { TextArea } from "./ui/textarea";
import { TextFieldRoot } from "./ui/textfield";
import { ToggleButton } from "./ui/toggle";

export const TaskComponent = (props: { task: Tasks.Info; input: string; output: string; errors: string }) => {
  const [taskInput, setTaskInput] = makePersisted(createSignal(props.task.example ?? ""), {
    name: `task-input-${props.task.id}`,
    storage: cookieStorage,
  });
  const [config, setConfig] = createStore<{ [key: string]: any }>({});

  const testTasksAction = useAction(testTask);
  const testTasksSubmission = useSubmission(testTask);

  return (
    <div class="flex flex-col gap-2 items-start border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 w-full text-xs h-max">
      <span class="text-xs font-semibold">Step: {props.task.name}</span>
      <div class="flex flex-row gap-2 items-start w-full h-max">
        <div class="flex flex-col gap-2 items-start p-2 w-full h-max">
          <span>Input:</span>
          <pre class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 w-full min-h-10 bg-neutral-50 dark:bg-neutral-900 rounded-sm p-2">
            {props.input}
          </pre>
        </div>
        <div class="flex flex-col gap-2 items-start p-2 w-full h-max">
          <span>Output:</span>
          <pre class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 w-full min-h-10 bg-neutral-50 dark:bg-neutral-900 rounded-sm p-2">
            {props.output}
          </pre>
        </div>
        <div class="flex flex-col gap-2 items-start p-2 w-full h-max">
          <span>Errors:</span>
          <pre class="flex flex-col gap-2 items-start border border-neutral-200 dark:border-neutral-800 w-full min-h-10 bg-neutral-50 dark:bg-neutral-900 rounded-sm p-2">
            {props.errors}
          </pre>
        </div>
      </div>
      <span class="text-xs">Input:</span>
      <TextFieldRoot
        class=" text-muted-foreground w-full"
        value={taskInput()}
        onChange={(value) => setTaskInput(value)}
      >
        <TextArea autoResize class="text-xs font-mono" />
      </TextFieldRoot>
      <div class="flex flex-row gap-2 items-center">
        <For each={Object.keys(DEFAULT_CONFIG) as (keyof typeof DEFAULT_CONFIG)[]}>
          {(configuration) => (
            <ToggleButton
              size="sm"
              value={config?.logging ?? false}
              onChange={() => {
                if (!config) {
                  setConfig(DEFAULT_CONFIG);
                  return;
                }

                setConfig(update(config, configuration, !config[configuration]));
              }}
              class="capitalize"
            >
              {configuration} {config?.[configuration] ? "on" : "off"}
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
              input = JSON.parse(taskInput());
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
              config: config,
            };

            toast.promise(testTasksAction(props.task.id, mergedInput), {
              loading: "Testing task...",
              success: "Task tested successfully",
              error: (error) => "Failed to test task: " + error.message,
            });
          }}
          disabled={
            testTasksSubmission.pending && testTasksSubmission.input && testTasksSubmission.input[0] !== props.task.id
          }
          class="gap-2 w-max"
        >
          <Show
            when={
              testTasksSubmission.pending && testTasksSubmission.input && testTasksSubmission.input[0] !== props.task.id
            }
            fallback={<Play class="size-4" />}
          >
            <Loader2 class="size-4 animate-spin" />
          </Show>
          Test
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setTaskInput(props.task.example ?? "");
            setConfig(DEFAULT_CONFIG);
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
        when={testTasksSubmission.pending !== undefined && !testTasksSubmission.pending}
        fallback={
          <div class="w-full flex flex-col items-start justify-center gap-2 border border-neutral-200 dark:border-neutral-800 p-2 rounded-sm bg-neutral-50 dark:bg-neutral-900">
            <span class="text-xs text-neutral-500">Please press the "Test" button to run the task.</span>
          </div>
        }
      >
        <Show
          when={
            testTasksSubmission.input && testTasksSubmission.input[0] === props.task.id && testTasksSubmission.result
          }
          fallback={
            <Show
              when={
                testTasksSubmission.pending &&
                testTasksSubmission.input &&
                testTasksSubmission.input[0] === props.task.id
              }
              fallback={
                <Show
                  when={testTasksSubmission.input && testTasksSubmission.input[0] === props.task.id}
                  fallback={
                    <div class="w-full flex flex-col items-start justify-center gap-2 border border-neutral-200 dark:border-neutral-800 p-2 rounded-sm bg-neutral-50 dark:bg-neutral-900">
                      <span class="text-xs text-neutral-500">Please press the "Test" button to run the task.</span>
                    </div>
                  }
                >
                  <div class="w-full flex flex-col items-start justify-center gap-2 border border-red-500 dark:border-red-500 p-2 rounded-sm bg-red-50 dark:bg-red-900">
                    <span class="text-xs text-red-500">Failed to run task: </span>
                    <span class="text-xs p-2 rounded-sm w-full  min-h-40">
                      {JSON.stringify(testTasksSubmission.error, null, 2)}
                    </span>
                  </div>
                </Show>
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
                  {result().type === "success" ? "Task ran successfully" : "Task failed to run"}
                </Badge>
                <Badge variant="outline">Duration: {result().duration}ms</Badge>
              </div>
              <pre class="text-xs border border-neutral-200 dark:border-neutral-800 p-2 rounded-sm w-full">
                {JSON.stringify(result().type === "success" ? result().data : result().error, null, 2)}
              </pre>
            </div>
          )}
        </Show>
      </Show>
    </div>
  );
};
