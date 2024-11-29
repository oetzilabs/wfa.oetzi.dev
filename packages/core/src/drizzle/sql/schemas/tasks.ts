import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { commonTable, createToken } from "./entity";
import { steps_tasks } from "./steps_tasks";
import { users } from "./users";

export const tasks = commonTable(
  "tasks",
  (t) => ({
    name: t.text("name").notNull(),
    custom: t.boolean("custom").notNull().default(false),
    token: t
      .text("token")
      .notNull()
      .$defaultFn(() => createToken()),
    owner_id: t
      .text("owner_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    previous_task_id: t.text("previous_task_id").references((): AnyPgColumn => tasks.id),
  }),
  "task",
);

export const tasks_relation = relations(tasks, ({ one, many }) => ({
  owner: one(users, {
    fields: [tasks.owner_id],
    references: [users.id],
  }),
  used_in: many(steps_tasks),
  previous_task: one(tasks, {
    fields: [tasks.previous_task_id],
    references: [tasks.id],
  }),
}));