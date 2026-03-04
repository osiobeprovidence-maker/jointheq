import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const fixUsersSchema = mutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            const {
                boot_balance,
                consistency_score,
                stability_score,
                timeliness_score,
                ...validFields
            } = user as any;

            // Fix boots_balance if missing/typoed
            if (validFields.boots_balance === undefined) {
                validFields.boots_balance = boot_balance ?? 0;
            }

            // Fix q_rank if missing
            if (validFields.q_rank === undefined) {
                validFields.q_rank = validFields.is_admin ? "Elite" : "Rookie";
            }

            await ctx.db.replace(user._id, validFields);
        }
        return { count: users.length };
    },
});
