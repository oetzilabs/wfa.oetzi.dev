import { relations } from "drizzle-orm";
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
  "wf"
);

export const workflow_relation = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.owner_id],
    references: [users.id],
  }),
  steps: many(workflows_steps),
}));
