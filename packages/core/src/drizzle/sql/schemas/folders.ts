import { relations } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { applications } from "./applications";
import { commonTable } from "./entity";
import { users } from "./users";

export const folders = commonTable(
  "folders",
  (t) => ({
    foldername: t.text("foldername").notNull(),
    path: t.text("path").notNull(),
    parent_folder_id: t.text("parent_folder_id").references((): AnyPgColumn => folders.id),

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
  "folder",
);

export const FolderCreateSchema = createInsertSchema(folders);
export type FolderCreate = InferInput<typeof FolderCreateSchema>;
export const FolderUpdateSchema = createUpdateSchema(folders);
export type FolderUpdate = InferInput<typeof FolderUpdateSchema>;

export const folders_relation = relations(folders, ({ one }) => ({
  parent_folder: one(folders, {
    fields: [folders.parent_folder_id],
    references: [folders.id],
  }),
  owner: one(users, {
    fields: [folders.owner_id],
    references: [users.id],
  }),
  app: one(applications, {
    fields: [folders.app_id],
    references: [applications.id],
  }),
}));
