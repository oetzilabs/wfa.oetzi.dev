import { relations } from "drizzle-orm";
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

export const app_relation = relations(applications, ({ many, one }) => ({
  owner: one(users, {
    fields: [applications.owner_id],
    references: [users.id],
  }),
}));
