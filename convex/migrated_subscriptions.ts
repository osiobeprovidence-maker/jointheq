import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submitMigration = mutation({
    args: {
        email: v.string(),
        phone: v.string(),
        platform: v.string(),
        profile_name: v.string(),
        payment_day: v.number(),
        last_payment_date: v.string(),
        role: v.string(),
        group_size: v.optional(v.number()),
        device_count: v.string(),
        device_types: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        // 1. Check if user exists
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        let userId;
        if (!user) {
            // Create a new user record
            userId = await ctx.db.insert("users", {
                email: args.email,
                phone: args.phone,
                full_name: args.profile_name, // fallback to profile name
                q_score: 0,
                q_rank: "Bronze",
                wallet_balance: 0,
                boots_balance: 0,
                referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                is_admin: false,
                is_verified: false,
                created_at: Date.now(),
            });
        } else {
            userId = user._id;
        }

        // 2. Create the migrated subscription record
        const migrationId = await ctx.db.insert("migrated_subscriptions", {
            user_id: userId,
            email: args.email,
            phone: args.phone,
            platform: args.platform,
            profile_name: args.profile_name,
            payment_day: args.payment_day,
            last_payment_date: args.last_payment_date,
            role: args.role,
            group_size: args.group_size,
            device_count: args.device_count,
            device_types: args.device_types,
            status: "Migrated – Pending Group Assignment",
            created_at: Date.now(),
        });

        return migrationId;
    },
});

export const getMigrations = query({
    args: {
        platform: v.optional(v.string()),
        payment_day: v.optional(v.number()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let migrations = await ctx.db.query("migrated_subscriptions").order("desc").collect();

        if (args.platform && args.platform !== "All") {
            migrations = migrations.filter((m) => m.platform === args.platform);
        }
        if (args.payment_day) {
            migrations = migrations.filter((m) => m.payment_day === args.payment_day);
        }
        if (args.status && args.status !== "All") {
            migrations = migrations.filter((m) => m.status === args.status);
        }

        return migrations;
    },
});

export const updateMigrationStatus = mutation({
    args: {
        id: v.id("migrated_subscriptions"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});
