import { relations } from "drizzle-orm";
import { json, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { commonTable } from "./entity";

export type SystemNotificationAction =
  | {
      type: "hide";
      label: string;
    }
  | {
      type: "open:link";
      label: string;
      href: string;
    };

export const system_notifications = commonTable(
  "system_notifications",
  (t) => ({
    title: t.text("title").notNull(),
    message: t.text("message"),
    action: t.json("action").$type<SystemNotificationAction>().default({ type: "hide", label: "Close" }),
  }),
  "system_notification",
);

export const SystemNotificationCreateSchema = createInsertSchema(system_notifications);
export type SystemNotificationCreate = InferInput<typeof SystemNotificationCreateSchema>;
export const SystemNotificationUpdateSchema = createUpdateSchema(system_notifications);
export type SystemNotificationUpdate = InferInput<typeof SystemNotificationUpdateSchema>;

export type SystemNotificationSelect = typeof system_notifications.$inferSelect;
export type SystemNotificationInsert = typeof system_notifications.$inferInsert;

export const system_notification_relation = relations(system_notifications, ({ one }) => ({}));
