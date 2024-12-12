import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { applications } from "./applications";
import { organizations } from "./organizations";
import { schema } from "./utils";

export const organizations_applications = schema.table(
  "organizations_applications",
  (t) => ({
    app_id: t
      .text("app_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    organization_id: t
      .text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }),
  }),
  (table) => [primaryKey({ columns: [table.app_id, table.organization_id], name: "organizations_applications_pk" })],
);

export const OrganizationApplicationCreateSchema = createInsertSchema(organizations_applications);
export type OrganizationApplicationCreate = InferInput<typeof OrganizationApplicationCreateSchema>;
export const OrganizationApplicationUpdateSchema = createUpdateSchema(organizations_applications);
export type OrganizationApplicationUpdate = InferInput<typeof OrganizationApplicationUpdateSchema>;

export type UserOrganizationSelect = typeof organizations_applications.$inferSelect;
export type UserOrganizationInsert = typeof organizations_applications.$inferInsert;

export const organizations_applications_relation = relations(organizations_applications, ({ one }) => ({
  application: one(applications, {
    fields: [organizations_applications.app_id],
    references: [applications.id],
  }),
  organization: one(organizations, {
    fields: [organizations_applications.organization_id],
    references: [organizations.id],
  }),
}));
