import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { schema } from "./utils";
import { workflows } from "./workflows";
import { steps } from "./steps";

export const workflows_steps = schema.table(
  "workflows_steps",
  (t) => ({
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
  }),
  (table) => [
    {
      pk: primaryKey({
        columns: [table.workflow_id, table.step_id],
      }),
    },
  ]
);

export const workflow_steps_relation = relations(workflows_steps, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflows_steps.workflow_id],
    references: [workflows.id],
  }),
  step: one(steps, {
    fields: [workflows_steps.step_id],
    references: [steps.id],
  }),
}));
