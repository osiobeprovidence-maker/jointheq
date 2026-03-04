import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getLunarMemories = query({
    handler: async (ctx) => {
        return await ctx.db.query("lunar_memories").order("desc").collect();
    },
});

export const addLunarMemory = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        platform: v.optional(v.string()),
        genre: v.optional(v.string()),
        added_by: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("lunar_memories", {
            ...args,
            created_at: Date.now(),
        });
    },
});

export const getLunarSubscription = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("lunar_subscriptions")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .unique();
    },
});

export const subscribeToLunar = mutation({
    args: { user_id: v.id("users"), duration_days: v.number() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("lunar_subscriptions")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .unique();

        const expiry_date = new Date();
        if (existing && new Date(existing.expiry_date) > expiry_date) {
            expiry_date.setTime(new Date(existing.expiry_date).getTime() + args.duration_days * 24 * 60 * 60 * 1000);
        } else {
            expiry_date.setDate(expiry_date.getDate() + args.duration_days);
        }

        if (existing) {
            await ctx.db.patch(existing._id, { expiry_date: expiry_date.toISOString(), status: "active" });
            return existing._id;
        } else {
            return await ctx.db.insert("lunar_subscriptions", {
                user_id: args.user_id,
                status: "active",
                expiry_date: expiry_date.toISOString(),
                created_at: Date.now(),
            });
        }
    },
});
