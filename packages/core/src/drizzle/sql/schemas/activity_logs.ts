import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { applications } from "./applications";
import { commonTable } from "./entity";
import { steps } from "./steps";
import { tasks } from "./tasks";
import { users } from "./users";
import { schema } from "./utils";
import { workflows } from "./workflows";

export const activity_status = schema.enum("activity_enums", [
  "idle",
  "running",
  "success",
  "failure",
  "aborted",
  "skipped",
  "paused",
  "pending",
]);

export const activities = activity_status.enumValues;
export type Activity = (typeof activities)[number];

export const activity_logs = commonTable(
  "activity_logs",
  (t) => ({
    previous_activity_log_id: t.text("previous_activity_log_id").references((): AnyPgColumn => activity_logs.id),
    run_by_user_id: t
      .text("run_by_user_id")
      .notNull()
      .references(() => users.id),
    application_id: t
      .text("application_id")
      .notNull()
      .references(() => applications.id, {
        onDelete: "cascade",
      }),
    workflow_id: t
      .text("workflow_id")
      .notNull()
      .references(() => workflows.id, {
        onDelete: "cascade",
      }),
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
    status: activity_status("status").notNull().default("idle"),
    /**
     * Time in milliseconds
     */
    duration: t.integer("duration").default(0),
    output: t.jsonb("output").default(null),
  }),
  "al"
);

export const activity_logs_relation = relations(activity_logs, ({ one }) => ({
  previous_activity_log: one(activity_logs, {
    fields: [activity_logs.previous_activity_log_id],
    references: [activity_logs.id],
  }),
  run_by: one(users, {
    fields: [activity_logs.run_by_user_id],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [activity_logs.id],
    references: [applications.id],
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
