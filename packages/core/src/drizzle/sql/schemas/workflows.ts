import { relations } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { commonTable } from "./entity";
import { users } from "./users";
import { workflows_steps } from "./workflows_steps";

export const workflows = commonTable(
  "workflows",
  (t) => ({
    name: t.text("name").notNull(),
    description: t.text("description"),
    owner_id: t
      .text("owner_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
  }),
  "wf",
);

export const WorkflowsCreateSchema = createInsertSchema(workflows);
export type WorkflowsCreate = InferInput<typeof WorkflowsCreateSchema>;
export const WorkflowsUpdateSchema = createUpdateSchema(workflows);
export type WorkflowsUpdate = InferInput<typeof WorkflowsUpdateSchema>;

export const workflow_relation = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.owner_id],
    references: [users.id],
  }),
  steps: many(workflows_steps),
}));
