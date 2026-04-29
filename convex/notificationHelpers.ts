import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

type NotificationType =
    | "admin"
    | "alert"
    | "funding"
    | "listing"
    | "message"
    | "payment"
    | "promotion"
    | "subscription"
    | "system";

type NotificationInput = {
    userId: Id<"users">;
    title: string;
    message: string;
    type: NotificationType | string;
};

export const createNotification = async (ctx: any, input: NotificationInput) => {
    const notificationId = await ctx.db.insert("notifications", {
        user_id: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        is_read: false,
        created_at: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.pushActions.sendNotificationPush, {
        notificationId,
    });

    return notificationId;
};

export const createNotificationsForUsers = async (
    ctx: any,
    users: Array<{ _id: Id<"users">; is_admin?: boolean; is_suspended?: boolean; is_banned?: boolean }>,
    input: Omit<NotificationInput, "userId">,
) => {
    let sent = 0;

    for (const user of users) {
        if (user.is_admin || user.is_suspended || user.is_banned) continue;
        await createNotification(ctx, {
            userId: user._id,
            ...input,
        });
        sent += 1;
    }

    return sent;
};

export const createNotificationForAllUsers = async (
    ctx: any,
    input: Omit<NotificationInput, "userId">,
) => {
    const users = await ctx.db.query("users").collect();
    return await createNotificationsForUsers(ctx, users, input);
};
