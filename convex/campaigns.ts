import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("campaigns").collect();
    },
});

export const getActive = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("campaigns")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();
    },
});

export const getParticipant = query({
    args: { campaign_id: v.id("campaigns"), user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .first();
    },
});

// Admin Mutations
export const create = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        description: v.string(),
        reward_type: v.string(),
        reward_amount: v.number(),
        start_date: v.number(),
        end_date: v.number(),
        target_goal: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("campaigns", {
            ...args,
            current_progress: 0,
            status: "active",
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("campaigns"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const participate = mutation({
    args: { campaign_id: v.id("campaigns"), user_id: v.id("users") },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .first();

        if (existing) throw new Error("Already participating");

        return await ctx.db.insert("campaign_participants", {
            campaign_id: args.campaign_id,
            user_id: args.user_id,
            progress: 0,
            entries: 1,
            joined_at: Date.now(),
        });
    },
});
