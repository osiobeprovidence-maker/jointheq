import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const generateUniqueAmount = mutation({
  args: {
    base_amount: v.number(),
  },
  handler: async (ctx, args) => {
    let attempts = 0;
    while (attempts < 50) {
      // Generate random extra between 10 and 20 (rotating, not constant)
      const randomExtra = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
      const uniqueAmount = args.base_amount + randomExtra;

      // Check if any "Awaiting Review" request already has this unique amount
      const existing = await ctx.db
        .query("manual_funding_requests")
        .withIndex("by_unique_amount", (q) =>
          q.eq("unique_amount", uniqueAmount).eq("status", "Awaiting Review")
        )
        .first();

      if (!existing) return uniqueAmount;
      attempts++;
    }
    throw new Error("Unable to generate a unique amount. Please try again later.");
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const submitManualFunding = mutation({
  args: {
    user_id: v.id("users"),
    base_amount: v.number(),
    unique_amount: v.number(),
    sender_name: v.string(),
    bank_name: v.optional(v.string()),
    screenshot_id: v.optional(v.string()),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("manual_funding_requests", {
      user_id: args.user_id,
      base_amount: args.base_amount,
      unique_amount: args.unique_amount,
      sender_name: args.sender_name,
      bank_name: args.bank_name,
      screenshot_id: args.screenshot_id,
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

    // Credit user wallet with BASE AMOUNT (not unique amount)
    await ctx.db.patch(request.user_id, {
      wallet_balance: (user.wallet_balance || 0) + request.base_amount,
    });

    // Update request status
    await ctx.db.patch(args.request_id, {
      status: "Approved",
      processed_at: Date.now(),
      processed_by: args.admin_id,
      admin_note: args.admin_note,
    });

    // Add to transactions
    await ctx.db.insert("wallet_transactions", {
      user_id: request.user_id,
      amount: request.base_amount,
      type: "funding",
      source: "bank_transfer",
      status: "completed",
      description: `Manual Wallet Funding (Ref: ${request.unique_amount})`,
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
