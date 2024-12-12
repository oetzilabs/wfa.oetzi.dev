import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { steps } from "./steps";
import { tasks } from "./tasks";
import { schema } from "./utils";

export const steps_tasks = schema.table(
  "steps_tasks",
  (t) => ({
    step_id: t
      .text("step_id")
      .notNull()
      .references(() => steps.id, {
        onDelete: "cascade",
      }),
    task_id: t
      .text("task_id")
      .notNull()
      .references(() => tasks.id, {
        onDelete: "cascade",
      }),
  }),
  (table) => [
    {
      pk: primaryKey({
        columns: [table.step_id, table.task_id],
      }),
    },
  ],
);

export const StepsTasksCreateSchema = createInsertSchema(steps_tasks);
export type StepsTasksCreate = InferInput<typeof StepsTasksCreateSchema>;
export const StepsTasksUpdateSchema = createUpdateSchema(steps_tasks);
export type StepsTasksUpdate = InferInput<typeof StepsTasksUpdateSchema>;

export const steps_tasks_relation = relations(steps_tasks, ({ one }) => ({
  step: one(steps, {
    fields: [steps_tasks.step_id],
    references: [steps.id],
  }),
  task: one(tasks, {
    fields: [steps_tasks.task_id],
    references: [tasks.id],
  }),
}));
