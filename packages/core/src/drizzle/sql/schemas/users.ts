import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { Validator } from "../../../validator";
import { applications } from "./applications";
import { commonTable } from "./entity";
import { sessions } from "./sessions";
import { user_organizations } from "./user_organizations";

export const users = commonTable(
  "users",
  (t) => ({
    name: t.text("name").notNull(),
    email: t.text("email").notNull(),
    image: t.text("image"),
    verifiedAt: t.timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),
  }),
  "user",
);

export const userRelation = relations(users, ({ many }) => ({
  sessions: many(sessions),
  orgs: many(user_organizations),
  applcations: many(applications),
}));

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export const UserUpdateSchema = createInsertSchema(users)
  .partial()
  .omit({ createdAt: true, updatedAt: true })
  .extend({ id: Validator.prefixed_cuid2 });
