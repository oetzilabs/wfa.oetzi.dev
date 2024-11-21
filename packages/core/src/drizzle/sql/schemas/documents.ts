import { relations } from "drizzle-orm";
import { applications } from "./applications";
import { commonTable } from "./entity";
import { users } from "./users";
import { schema } from "./utils";

export const document_status = schema.enum("document_status", ["uploaded", "in_process", "completed", "errored"]);

export type DocumentStatus = (typeof document_status.enumValues)[number];
export const document_statuses = document_status.enumValues;

export const documents = commonTable(
  "documents",
  (t) => ({
    filename: t.text("name").notNull(),
    filepath: t.text("filepath").notNull(),
    hash: t.text("hash"),
    status: document_status("status").default("uploaded"),

    app_id: t
      .text("app_id")
      .notNull()
      .references(() => applications.id),
    owner_id: t
      .text("owner_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
  }),
  "doc",
);

export const document_relation = relations(documents, ({ one }) => ({
  owner: one(users, {
    fields: [documents.owner_id],
    references: [users.id],
  }),
  app: one(applications, {
    fields: [documents.app_id],
    references: [applications.id],
  }),
}));
