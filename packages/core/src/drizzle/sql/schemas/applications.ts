import { relations } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { applications_workflows } from "./applications_workflows";
import { commonTable, createToken } from "./entity";
import { users } from "./users";

export const applications = commonTable(
  "applications",
  (t) => ({
    name: t.text("name").notNull(),
    description: t.text("description"),
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
  }),
  "app",
);

export const ApplicationCreateSchema = createInsertSchema(applications);
export type ApplicationCreate = InferInput<typeof ApplicationCreateSchema>;
export const ApplicationUpdateSchema = createUpdateSchema(applications);
export type ApplicationUpdate = InferInput<typeof ApplicationUpdateSchema>;

export const app_relation = relations(applications, ({ many, one }) => ({
  owner: one(users, {
    fields: [applications.owner_id],
    references: [users.id],
  }),
  workflows: many(applications_workflows),
}));
