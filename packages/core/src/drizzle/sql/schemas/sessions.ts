import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { Validator } from "../../../validator";
import { user_organizations } from "./user_organizations";
import { users } from "./users";
import { schema } from "./utils";

export const sessions = schema.table("session", (t) => ({
  id: t.text("id").primaryKey(),
  createdAt: t
    .timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
    .notNull()
    .defaultNow(),
  updatedAt: t.timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }),
  userId: t
    .varchar("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  expiresAt: t
    .timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    })
    .notNull(),
  access_token: t.text("access_token"),
  organization_id: t.text("organization_id"),
  application_id: t.text("application_id"),
}));

export const sessionRelation = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  employee: many(user_organizations),
}));

export type SessionSelect = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export const SessionUpdateSchema = createInsertSchema(sessions)
  .partial()
  .omit({ createdAt: true, updatedAt: true })
  .extend({ id: Validator.prefixed_cuid2 });
