import { relations } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
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

export const OrganizationCreateSchema = createInsertSchema(organizations);
export type OrganizationCreate = InferInput<typeof OrganizationCreateSchema>;
export const OrganizationUpdateSchema = createUpdateSchema(organizations);
export type OrganizationUpdate = InferInput<typeof OrganizationUpdateSchema>;

export const organization_relation = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.owner_id],
    references: [users.id],
  }),
  employees: many(user_organizations),
}));
