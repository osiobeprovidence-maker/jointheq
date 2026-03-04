import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { awardReputation } from "./reputation";

export const getTransactions = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("transactions")
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
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.user_id);
        if (!user) throw new Error("User not found");

        const new_balance = args.type === "funding"
            ? user.wallet_balance + args.amount
            : user.wallet_balance - args.amount;

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

        return await ctx.db.insert("transactions", {
            ...args,
            created_at: Date.now(),
        });
    },
});
