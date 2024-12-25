import { action, json, query } from "@solidjs/router";
import { Tasks } from "@wfa/core/src/entities/tasks";

export const getTasks = query(async () => {
  "use server";

  const tasks_names = (await Tasks.getCollection()).map((t) => ({
    name: t.name,
    blueprints: t.blueprints,
  }));

  return json(tasks_names);
}, "tasks-collection");

export const testTask = action(async (id: string, input: unknown) => {
  "use server";
  const db_task = await Tasks.findById(id);
  if (!db_task) throw new Error("Task not found");
  const task_collection = await Tasks.getCollection();
  const task = task_collection.find((t) => t.name.includes(db_task.name));

  if (!task) throw new Error("Task not found");
  const test = await task.task(input);

  return json(test);
});
