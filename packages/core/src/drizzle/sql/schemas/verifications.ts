import { relations } from "drizzle-orm";
import { commonTable } from "./entity";
import { users } from "./users";
import { schema } from "./utils";

export const verificationStatus = schema.enum("verification_status", ["pending", "verified", "rejected"]);

export const verifications = commonTable(
  "verifications",
  (t) => ({
    owner_id: t
      .text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: t.text("code").notNull(),
    status: verificationStatus("status").notNull().default("pending"),
  }),
  "verification",
);

export type VerificationSelect = typeof verifications.$inferSelect;
export type VerificationInsert = typeof verifications.$inferInsert;

export const verification_relation = relations(verifications, ({ one, many }) => ({
  owner_id: one(users, {
    fields: [verifications.owner_id],
    references: [users.id],
  }),
}));
