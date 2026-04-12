import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { awardReputation } from "./reputation";

export const getTransactions = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wallet_transactions")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .order("desc")
            .collect();
    },
});

export const addTransaction = mutation({
    args: {
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(), // 'funding', 'payment', 'refund'
        description: v.string(),
        fee: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.user_id);
        if (!user) throw new Error("User not found");

        const fee = args.type === "funding" ? (args.fee || 0) : 0;
        const net_amount = args.amount - fee;

        const new_balance = args.type === "funding"
            ? (user.wallet_balance || 0) + net_amount
            : (user.wallet_balance || 0) - args.amount;

        await ctx.db.patch(args.user_id, { wallet_balance: new_balance });

        // Award reputation for funding
        if (args.type === "funding") {
            await awardReputation(ctx, args.user_id, {
                score: 10,
                boots: 5,
                type: "funding",
                description: `Funded wallet with ₦${args.amount}`
            });
        }

        return await ctx.db.insert("wallet_transactions", {
            user_id: args.user_id,
            amount: args.amount,
            type: args.type,
            source: args.type === "funding" ? "bank_transfer" : "wallet",
            status: "completed",
            description: args.description,
            fee: args.fee,
            created_at: Date.now(),
        });
    },
});

