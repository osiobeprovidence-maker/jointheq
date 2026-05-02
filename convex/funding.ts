import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createNotification } from "./notificationHelpers";

const FUNDING_FEE = 20;
const MIN_FUNDING_AMOUNT = 1000;
const REVIEW_TIMEOUT_MS = 24 * 60 * 60 * 1000;

const isOverdue = (request: { status: string; created_at: number }) =>
  request.status === "Awaiting Review" && Date.now() - request.created_at >= REVIEW_TIMEOUT_MS;

const withComputedStatus = <T extends { status: string; created_at: number }>(request: T) => ({
  ...request,
  status: isOverdue(request) ? "Failed" : request.status,
});

export const generateUniqueAmount = mutation({
  args: {
    base_amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.base_amount < MIN_FUNDING_AMOUNT) {
      throw new Error("Minimum funding amount is N1,000");
    }

    const uniqueAmount = args.base_amount + FUNDING_FEE;
    const existing = await ctx.db
      .query("manual_funding_requests")
      .withIndex("by_unique_amount", (q) =>
        q.eq("unique_amount", uniqueAmount).eq("status", "Awaiting Review")
      )
      .first();

    if (!existing || isOverdue(existing)) return uniqueAmount;

    throw new Error("A payment with this amount is already awaiting review. Please try a different amount.");
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
    if (args.base_amount < MIN_FUNDING_AMOUNT) {
      throw new Error("Minimum funding amount is N1,000");
    }

    if (args.unique_amount !== args.base_amount + FUNDING_FEE) {
      throw new Error("Funding charge must be N20");
    }

    const requestId = await ctx.db.insert("manual_funding_requests", {
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

    await createNotification(ctx, {
      userId: args.user_id,
      title: "Payment proof submitted",
      message: `We received your wallet funding request for N${args.base_amount.toLocaleString()}. Admin review is now pending.`,
      type: "funding",
    });

    return requestId;
  },
});

export const getManualRequests = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db.query("manual_funding_requests").order("desc").collect();
    const computedRequests = requests.map(withComputedStatus);
    if (args.status && args.status !== "All") {
      return computedRequests.filter((request) => request.status === args.status);
    }
    return computedRequests;
  },
});

export const getUserManualRequests = query({
  args: {
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("manual_funding_requests")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
    return requests.map(withComputedStatus);
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
    if (isOverdue(request)) {
      await ctx.db.patch(args.request_id, {
        status: "Failed",
        processed_at: Date.now(),
        processed_by: args.admin_id,
        admin_note: "Payment review window expired after 24 hours.",
      });
      throw new Error("Payment review window expired after 24 hours.");
    }

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

    await createNotification(ctx, {
      userId: request.user_id,
      title: "Wallet funded",
      message: `Your payment was approved and N${request.base_amount.toLocaleString()} has been added to your wallet.`,
      type: "payment",
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

    await createNotification(ctx, {
      userId: request.user_id,
      title: "Payment review failed",
      message: args.admin_note
        ? `Your wallet funding request was rejected: ${args.admin_note}`
        : "Your wallet funding request was rejected. Please check the transfer details and try again.",
      type: "alert",
    });

    return { success: true };
  },
});
