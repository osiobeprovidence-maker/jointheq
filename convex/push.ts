import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const getSubscriptionStatus = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const subscriptions = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();

        return {
            enabled: subscriptions.length > 0,
            count: subscriptions.length,
        };
    },
});

export const saveSubscription = mutation({
    args: {
        user_id: v.id("users"),
        endpoint: v.string(),
        expiration_time: v.optional(v.number()),
        keys: v.object({
            p256dh: v.string(),
            auth: v.string(),
        }),
        user_agent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.user_id);
        if (!user) throw new Error("User not found");

        const now = Date.now();
        const existing = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                user_id: args.user_id,
                expiration_time: args.expiration_time,
                p256dh: args.keys.p256dh,
                auth: args.keys.auth,
                user_agent: args.user_agent,
                updated_at: now,
            });
            return { success: true, id: existing._id };
        }

        const id = await ctx.db.insert("push_subscriptions", {
            user_id: args.user_id,
            endpoint: args.endpoint,
            expiration_time: args.expiration_time,
            p256dh: args.keys.p256dh,
            auth: args.keys.auth,
            user_agent: args.user_agent,
            created_at: now,
            updated_at: now,
        });

        return { success: true, id };
    },
});

export const removeSubscription = mutation({
    args: { endpoint: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }

        return { success: true };
    },
});

export const getNotificationDeliveryPayload = internalQuery({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const notification = await ctx.db.get(args.notificationId);
        if (!notification?.user_id) return null;

        const subscriptions = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_user", (q) => q.eq("user_id", notification.user_id!))
            .collect();

        return {
            notification,
            subscriptions,
        };
    },
});

export const removeSubscriptionByEndpoint = internalMutation({
    args: { endpoint: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});
