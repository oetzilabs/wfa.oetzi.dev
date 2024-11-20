import { action } from "@solidjs/router";
import { Notifications } from "@wfa/core/src/entities/notifications";
import { ensureAuthenticated } from "../auth/context";

export const getAllNotifications = async () => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const sys_notifications = await Notifications.allNonHiddenByUser(ctx.user.id, "system");

  const org_notifications = await Notifications.allNonHiddenByUser(ctx.user.id, "organization");

  const company_notifications = await Notifications.allNonHiddenByUser(ctx.user.id, "company");
  const notifications = sys_notifications.concat(org_notifications, company_notifications);
  return notifications;
};

export const hideNotification = action(async (id: string, type: Notifications.Types) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const notification = await Notifications.findById(id, type);
  if (!notification) throw new Error("System Notification not found");

  const hidden = await Notifications.userHidesById(notification.id, type, ctx.user.id);
  return hidden;
});
