import { relations } from "drizzle-orm";
import { commonTable } from "./entity";
import { schema } from "./utils";

// AWS complaint types
export const mailcomplaint_type = schema.enum("mailcomplaint_type", ["Spam", "Abuse", "Other", "Unknown"]);

export const mailcomplaint = commonTable(
  "mailcomplaint",
  (t) => ({
    email: t.text("email").notNull(),
    enabled: t.boolean("enabled").notNull().default(true),
    type: mailcomplaint_type("type").notNull(),
    t: t.text("t").notNull(),
    complaintTimestamp: t.timestamp("complaintTimestamp", { mode: "date" }).notNull(),
    feedbackId: t.text("feedbackId").notNull(),
    locked: t.boolean("locked").notNull().default(false),
  }),
  "mailcomplaint",
);

export type MailComplaintSelect = typeof mailcomplaint.$inferSelect;
export type MailComplaintInsert = typeof mailcomplaint.$inferInsert;

export const mailcomplaint_relation = relations(mailcomplaint, ({ one }) => ({}));

export const mailcomplaint_type_values = mailcomplaint_type.enumValues;
export type MailComplaintType = (typeof mailcomplaint_type.enumValues)[number];
