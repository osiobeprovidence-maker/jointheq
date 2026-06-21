import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const getUserActivities = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let activities;
    if (args.category) {
      activities = await ctx.db
        .query("user_activities")
        .withIndex("by_category", q => q.eq("user_id", args.userId).eq("category", args.category))
        .order("desc")
        .take(limit + 1);
    } else {
      activities = await ctx.db
        .query("user_activities")
        .withIndex("by_user_created", q => q.eq("user_id", args.userId))
        .order("desc")
        .take(limit + 1);
    }

    if (args.status) {
      activities = activities.filter(a => a.status === args.status);
    }

    if (args.search) {
      const q = args.search.toLowerCase();
      activities = activities.filter(a =>
        a.action.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }

    const hasMore = activities.length > limit;
    if (hasMore) activities = activities.slice(0, limit);

    return {
      activities,
      hasMore,
      cursor: hasMore ? activities[activities.length - 1]?._id : null,
    };
  },
});

export const getUserActivitySummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("user_activities")
      .withIndex("by_user_created", q => q.eq("user_id", args.userId))
      .collect();

    const totalWalletFunding = all
      .filter(a => a.category === "wallet" && a.status === "success" && a.amount)
      .reduce((sum, a) => sum + (a.amount ?? 0), 0);

    const totalPurchases = all.filter(a =>
      a.category === "payment" && a.status === "success"
    ).length;

    const failedPayments = all.filter(a =>
      a.category === "payment" && a.status === "failed"
    ).length;

    const activeSubscriptions = all.filter(a =>
      a.category === "subscription" &&
      (a.action === "Subscription purchased" || a.action === "Subscription renewed" || a.action === "User joined group")
    ).length;

    const lastActivity = all.length > 0
      ? all.reduce((latest, a) => a.created_at > latest.created_at ? a : latest)
      : null;

    return {
      totalTransactions: all.length,
      totalWalletFunding,
      totalPurchases,
      failedPayments,
      activeSubscriptions,
      lastActivityDate: lastActivity?.created_at ?? null,
    };
  },
});
