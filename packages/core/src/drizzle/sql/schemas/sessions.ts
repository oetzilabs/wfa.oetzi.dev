import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Validator } from "../../../validator";
import { user_organizations } from "./user_organizations";
import { users } from "./users";
import { schema } from "./utils";

export const sessions = schema.table("session", (t) => ({
  id: t.text("id").primaryKey(),
  cookie_token: t.text("cookie_token").notNull(),
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
  refresh_token: t.text("refresh_token"),
  organization_id: t.text("organization_id"),
  application_id: t.text("application_id"),
  browser: t.text("browser"),
  ip: t.text("ip"),
  fingerprint: t.text("fingerprint"),
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
