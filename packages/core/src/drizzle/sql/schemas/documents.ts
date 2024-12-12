import { relations } from "drizzle-orm";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { applications } from "./applications";
import { commonTable } from "./entity";
import { folders } from "./folders";
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
    folder_id: t
      .text("folder_id")
      .notNull()
      .references(() => folders.id),
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

export const DocumentCreateSchema = createInsertSchema(documents);
export type DocumentCreate = InferInput<typeof DocumentCreateSchema>;
export const DocumentUpdateSchema = createUpdateSchema(documents);
export type DocumentUpdate = InferInput<typeof DocumentUpdateSchema>;

export const document_relation = relations(documents, ({ one }) => ({
  owner: one(users, {
    fields: [documents.owner_id],
    references: [users.id],
  }),
  app: one(applications, {
    fields: [documents.app_id],
    references: [applications.id],
  }),
  folder: one(folders, {
    fields: [documents.folder_id],
    references: [folders.id],
  }),
}));
