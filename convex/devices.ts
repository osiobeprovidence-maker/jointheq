import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUserId = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();
    },
});

export const addDevice = mutation({
    args: {
        user_id: v.id("users"),
        name: v.string(),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("devices", {
            ...args,
            last_used: Date.now(),
        });
    },
});

export const removeDevice = mutation({
    args: { id: v.id("devices") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
