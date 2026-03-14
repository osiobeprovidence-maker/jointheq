import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Migration: Setup Wallets and Pillar Data
 * Ensures all existing users have a wallet record and correct role format.
 */
export const setupPillarData = mutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let walletCount = 0;
        let roleFixCount = 0;

        for (const user of users) {
            // 1. Ensure wallet exists
            const wallet = await ctx.db.query("wallets")
                .withIndex("by_user", (q) => q.eq("user_id", user._id))
                .first();

            if (!wallet) {
                await ctx.db.insert("wallets", {
                    user_id: user._id,
                    balance: user.wallet_balance || 0,
                    updated_at: Date.now(),
                });
                walletCount++;
            }

            // 2. Fix roles if needed
            if (!user.role || !["subscriber", "owner", "admin"].includes(user.role)) {
                const newRole = user.is_admin ? "admin" : "subscriber";
                await ctx.db.patch(user._id, { role: newRole });
                roleFixCount++;
            }
        }

        return {
            usersProcessed: users.length,
            walletsCreated: walletCount,
            rolesFixed: roleFixCount
        };
    },
});
