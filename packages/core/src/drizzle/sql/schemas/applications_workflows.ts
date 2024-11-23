import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { applications } from "./applications";
import { schema } from "./utils";
import { workflows } from "./workflows";

export const applications_workflows = schema.table(
  "applications_workflows",
  (t) => ({
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
  }),
  (table) => [
    {
      pk: primaryKey({
        columns: [table.application_id, table.workflow_id],
      }),
    },
  ]
);

export const applications_workflows_relation = relations(applications_workflows, ({ one }) => ({
  application: one(applications, {
    fields: [applications_workflows.application_id],
    references: [applications.id],
  }),
  workflow: one(workflows, {
    fields: [applications_workflows.workflow_id],
    references: [workflows.id],
  }),
}));
