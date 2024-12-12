import { relations } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { Validator } from "../../../validator";
import { applications } from "./applications";
import { commonTable } from "./entity";
import { sessions } from "./sessions";
import { steps } from "./steps";
import { tasks } from "./tasks";
import { user_organizations } from "./user_organizations";
import { workflows } from "./workflows";

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

export const UserCreateSchema = createInsertSchema(users);
export type UserCreate = InferInput<typeof UserCreateSchema>;
export const UserUpdateSchema = createUpdateSchema(users);
export type UserUpdate = InferInput<typeof UserUpdateSchema>;

export const userRelation = relations(users, ({ many }) => ({
  sessions: many(sessions),
  orgs: many(user_organizations),
  applications: many(applications),
  workflows: many(workflows),
  steps: many(steps),
  tasks: many(tasks),
}));

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
