import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const submitManualFunding = mutation({
  args: {
    user_id: v.id("users"),
    amount: v.number(),
    sender_name: v.string(),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("manual_funding_requests", {
      user_id: args.user_id,
      amount: args.amount,
      sender_name: args.sender_name,
      reference: args.reference,
      status: "Awaiting Review",
      created_at: Date.now(),
    });
  },
});

export const getManualRequests = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status && args.status !== "All") {
      return await ctx.db
        .query("manual_funding_requests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("manual_funding_requests").order("desc").collect();
  },
});

export const getUserManualRequests = query({
  args: {
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("manual_funding_requests")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
  },
});

export const approveFunding = mutation({
  args: {
    request_id: v.id("manual_funding_requests"),
    admin_id: v.id("users"),
    admin_note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.request_id);
    if (!request) throw new Error("Request not found");
    if (request.status !== "Awaiting Review") throw new Error("Request already processed");

    const user = await ctx.db.get(request.user_id);
    if (!user) throw new Error("User not found");

    // Credit user wallet
    await ctx.db.patch(request.user_id, {
      wallet_balance: (user.wallet_balance || 0) + request.amount,
    });

    // Update request status
    await ctx.db.patch(args.request_id, {
      status: "Approved",
      processed_at: Date.now(),
      processed_by: args.admin_id,
      admin_note: args.admin_note,
    });

    // Add to transactions
    await ctx.db.insert("transactions", {
      user_id: request.user_id,
      amount: request.amount,
      type: "funding",
      description: `Manual Wallet Funding (Approved by Admin)`,
      created_at: Date.now(),
    });

    return { success: true };
  },
});

export const rejectFunding = mutation({
  args: {
    request_id: v.id("manual_funding_requests"),
    admin_id: v.id("users"),
    admin_note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.request_id);
    if (!request) throw new Error("Request not found");
    if (request.status !== "Awaiting Review") throw new Error("Request already processed");

    await ctx.db.patch(args.request_id, {
      status: "Rejected",
      processed_at: Date.now(),
      processed_by: args.admin_id,
      admin_note: args.admin_note,
    });

    return { success: true };
  },
});
