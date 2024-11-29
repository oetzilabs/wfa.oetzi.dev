import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { commonTable, createToken } from "./entity";
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
}));