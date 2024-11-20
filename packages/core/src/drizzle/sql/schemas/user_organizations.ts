import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";
import { schema } from "./utils";

export const user_organizations = schema.table(
  "user_organizations",
  (t) => ({
    user_id: t
      .text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organization_id: t
      .text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }),
  }),
  (table) => [primaryKey({ name: "user_organization_pk", columns: [table.user_id, table.organization_id] })],
);

export type UserOrganizationSelect = typeof user_organizations.$inferSelect;
export type UserOrganizationInsert = typeof user_organizations.$inferInsert;

export const user_organizations_relation = relations(user_organizations, ({ one }) => ({
  user: one(users, {
    fields: [user_organizations.user_id],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [user_organizations.organization_id],
    references: [organizations.id],
  }),
}));
