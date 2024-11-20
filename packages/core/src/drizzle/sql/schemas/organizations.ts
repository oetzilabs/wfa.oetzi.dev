import { relations } from "drizzle-orm";
import { commonTable } from "./entity";
import { user_organizations } from "./user_organizations";
import { users } from "./users";

export const organizations = commonTable(
  "organizations",
  (t) => ({
    owner_id: t.text("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: t.text("name").notNull(),
    website: t.text("website"),
    email: t.text("email"),
  }),
  "org",
);

export type OrganizationSelect = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;

export const organization_relation = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.owner_id],
    references: [users.id],
  }),
  employees: many(user_organizations),
}));
