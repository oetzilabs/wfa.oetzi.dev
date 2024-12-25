import { action, json } from "@solidjs/router";
import { Applications } from "@wfa/core/src/entities/application";
import { Steps } from "@wfa/core/src/entities/steps";
import { Tasks } from "@wfa/core/src/entities/tasks";
import { Workflows } from "@wfa/core/src/entities/workflows";
import { ensureAuthenticated } from "../auth/context";
import { getAuthenticatedSession } from "../auth/util";

const randomString = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const addExampleWorkflow = action(async (applicationId: string) => {
  "use server";

  const [ctx, event] = await ensureAuthenticated();
  const application = await Applications.findById(applicationId);
  if (!application) throw new Error("Application not found");

  const workflow = await Workflows.create({
    name: "example-workflow-" + randomString(10),
    owner_id: ctx.user.id,
    description: "This is an example workflow.",
  });
  if (!workflow) throw new Error("Could not create example workflow");

  const [addedToApplication] = await Applications.addWorkflow(application.id, workflow.id);
  if (!addedToApplication) throw new Error("Could not add example workflow to application");

  const exampleStep = await Steps.create({
    name: "example-step-" + randomString(10),
    owner_id: ctx.user.id,
  });
  if (!exampleStep) throw new Error("Could not create example step");
  const added = await Workflows.addStep(workflow.id, exampleStep.id);
  if (!added) throw new Error("Could not add example step to workflow");
  const example_task_function_name = Math.random() > 0.5 ? "currency_exchange" : "hello_world";
  const example_task_example =
    example_task_function_name === "hello_world"
      ? { name: "<your name>" }
      : { date: "latest", from: "eur", to: ["usd", "chf"], value: 100 };

  console.log(example_task_function_name, example_task_example);

  const exampleTask = (await Tasks.getCollection()).find((t) => t.name === example_task_function_name);
  if (!exampleTask) throw new Error("Could not find example task in collection");
  const createdTask = await Tasks.create({
    name: example_task_function_name,
    owner_id: ctx.user.id,
    example: JSON.stringify(example_task_example, null, 2),
  });

  if (!createdTask) throw new Error("Could not create example task");

  const addedTask = await Steps.addTask(exampleStep.id, createdTask.id);
  if (!addedTask) throw new Error("Could not add example task to step");

  return json(workflow, {
    revalidate: [getAuthenticatedSession.key],
  });
});

export const removeWorkflow = action(async (workflowId: string) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const workflow = await Workflows.findById(workflowId);
  if (!workflow) throw new Error("Workflow not found");

  const removed = await Workflows.remove(workflow.id);
  if (!removed) throw new Error("Could not remove workflow");

  return json(workflow, {
    revalidate: [getAuthenticatedSession.key],
  });
});
