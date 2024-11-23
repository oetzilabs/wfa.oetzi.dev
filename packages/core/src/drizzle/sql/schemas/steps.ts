import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { commonTable } from "./entity";
import { workflows_steps } from "./workflows_steps";

export const steps = commonTable(
  "steps",
  (t) => ({
    name: t.text("name").notNull(),
    previous_step_id: t.text("previous_step_id").references((): AnyPgColumn => steps.id),
  }),
  "step"
);

export const steps_relation = relations(steps, ({ one, many }) => ({
  used_in: many(workflows_steps),
  previous_step: one(steps, {
    fields: [steps.previous_step_id],
    references: [steps.id],
  }),
}));
