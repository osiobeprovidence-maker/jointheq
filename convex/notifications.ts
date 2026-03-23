import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .order("desc")
            .collect();
    },
});

export const getUnreadCount = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_read", (q) => q.eq("user_id", args.user_id).eq("is_read", false))
            .collect();
        return unread.length;
    },
});

export const markAsRead = mutation({
    args: { notification_id: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notification_id, { is_read: true });
        return { success: true };
    },
});

export const markAllAsRead = mutation({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_read", (q) => q.eq("user_id", args.user_id).eq("is_read", false))
            .collect();

        for (const notif of unread) {
            await ctx.db.patch(notif._id, { is_read: true });
        }
        return { success: true, count: unread.length };
    },
});

export const remove = mutation({
    args: { notification_id: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.notification_id);
        return { success: true };
    },
});
