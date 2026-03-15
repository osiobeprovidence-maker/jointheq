import { v } from "convex/values";
import { mutation } from "./_generated/server";
import bcrypt from "bcryptjs";

/**
 * ONE-TIME SETUP: Create super admin user riderezzy@gmail.com
 * Call this once to initialize your super admin account
 */
export const createSuperAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if user already exists
        const existingUser = await ctx.db.query("users")
            .withIndex("by_email", q => q.eq("email", "riderezzy@gmail.com"))
            .unique();

        if (existingUser) {
            if (existingUser.admin_role === "super") {
                return { success: false, message: "Already super admin", role: "super", userId: existingUser._id };
            }
            // Make existing user super admin
            await ctx.db.patch(existingUser._id, {
                admin_role: "super",
                is_admin: true,
            });
            return { success: true, message: "Upgraded to super admin", role: "super", userId: existingUser._id };
        }

        // Create new super admin user
        const token = crypto.randomUUID();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const password = "SuperSecretAdmin123!";
        const password_hash = bcrypt.hashSync(password, 10);

        const userId = await ctx.db.insert("users", {
            email: "riderezzy@gmail.com",
            full_name: "Super Admin",
            username: "superadmin",
            password_hash,
            verification_token: token,
            verification_token_expires: tokenExpires,
            referral_code: "Q-ADMIN-000001",
            q_score: 0,
            q_rank: "Rookie",
            wallet_balance: 0,
            boots_balance: 0,
            score_history: [],
            boots_history: [],
            penalty_history: [],
            is_admin: true,
            admin_role: "super",
            role: "admin",
            is_verified: true,
            verification_deadline: undefined,
            created_at: Date.now(),
        });

        await ctx.db.insert("admin_logs", {
            admin_id: userId,
            action: "created_super_admin",
            target_type: "user",
            target_name: "riderezzy@gmail.com",
            created_at: Date.now(),
        });

        return {
            success: true,
            message: "Super admin created!",
            role: "super",
            userId,
            tempPassword: password,
            warning: "CHANGE THE PASSWORD IMMEDIATELY!"
        };
    },
});
