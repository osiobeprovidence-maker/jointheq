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
            user_id: args.user_id,
            device_name: args.name,
            device_type: args.type,
            is_verified: true,
            last_used: Date.now(),
            created_at: Date.now(),
        });
    },
});

export const removeDevice = mutation({
    args: { id: v.id("devices") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
