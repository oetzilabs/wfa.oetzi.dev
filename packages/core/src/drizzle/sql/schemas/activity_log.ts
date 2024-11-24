import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { commonTable } from "./entity";
import { steps } from "./steps";
import { tasks } from "./tasks";
import { workflows } from "./workflows";

export const activity_logs = commonTable(
  "activity_logs",
  (t) => ({
    previous_activity_log_id: t.text("previous_activity_log_id").references((): AnyPgColumn => activity_logs.id),
    workflow_id: t
      .text("workflow_id")
      .notNull()
      .references(() => workflows.id),
    step_id: t
      .text("step_id")
      .notNull()
      .references(() => steps.id),
    task_id: t
      .text("task_id")
      .notNull()
      .references(() => tasks.id),
    duration: t.integer("duration").default(0),
  }),
  "al"
);

export const activity_logs_relation = relations(activity_logs, ({ one }) => ({
  previous_activity_log: one(activity_logs, {
    fields: [activity_logs.previous_activity_log_id],
    references: [activity_logs.id],
  }),
  workflow: one(workflows, {
    fields: [activity_logs.id],
    references: [workflows.id],
  }),
  step: one(steps, {
    fields: [activity_logs.id],
    references: [steps.id],
  }),
  task: one(tasks, {
    fields: [activity_logs.id],
    references: [tasks.id],
  }),
}));
