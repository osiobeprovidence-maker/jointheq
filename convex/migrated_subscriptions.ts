import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submitMigration = mutation({
    args: {
        user_id: v.id("users"),
        platform: v.string(),
        profile_name: v.string(),
        payment_day: v.number(),
        last_payment_date: v.string(),
        device_count: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Get user details for snapshotting
        const user = await ctx.db.get(args.user_id);
        if (!user) throw new Error("User not found");

        // 2. Create the migrated subscription record
        const migrationId = await ctx.db.insert("migrated_subscriptions", {
            user_id: args.user_id,
            email: user.email,
            phone: user.phone || "Not Set",
            platform: args.platform,
            profile_name: args.profile_name,
            payment_day: args.payment_day,
            last_payment_date: args.last_payment_date,
            role: "Member", // Default to Member for migrated users
            device_count: args.device_count,
            device_types: [], // Deprecated in favor of device_count string
            status: "Migrated Slot",
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
        assigned_group: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const patch: any = { status: args.status };
        if (args.assigned_group) patch.assigned_group = args.assigned_group;
        await ctx.db.patch(args.id, patch);
    },
});
