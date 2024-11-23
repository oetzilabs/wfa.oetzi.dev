import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { commonTable } from "./entity";
import { steps_tasks } from "./steps_tasks";

export const tasks = commonTable(
  "tasks",
  (t) => ({
    name: t.text("name").notNull(),
    previous_task_id: t.text("previous_task_id").references((): AnyPgColumn => tasks.id),
  }),
  "task"
);

export const tasks_relation = relations(tasks, ({ one, many }) => ({
  used_in: many(steps_tasks),
  previous_task: one(tasks, {
    fields: [tasks.previous_task_id],
    references: [tasks.id],
  }),
}));
