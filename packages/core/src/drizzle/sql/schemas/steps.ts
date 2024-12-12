import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { commonTable, createToken } from "./entity";
import { steps_tasks } from "./steps_tasks";
import { users } from "./users";
import { workflows_steps } from "./workflows_steps";

export const steps = commonTable(
  "steps",
  (t) => ({
    name: t.text("name").notNull(),
    token: t
      .text("token")
      .notNull()
      .$defaultFn(() => createToken()),
    previous_step_id: t.text("previous_step_id").references((): AnyPgColumn => steps.id),
    owner_id: t
      .text("owner_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
  }),
  "step",
);

export const StepsCreateSchema = createInsertSchema(steps);
export type StepsCreate = InferInput<typeof StepsCreateSchema>;
export const StepsUpdateSchema = createUpdateSchema(steps);
export type StepsUpdate = InferInput<typeof StepsUpdateSchema>;

export const steps_relation = relations(steps, ({ one, many }) => ({
  owner: one(users, {
    fields: [steps.owner_id],
    references: [users.id],
  }),
  used_in: many(workflows_steps),
  previous_step: one(steps, {
    fields: [steps.previous_step_id],
    references: [steps.id],
  }),
  tasks: many(steps_tasks),
}));
