import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { createNotificationForAllUsers, createNotificationsForUsers } from "./notificationHelpers";

export const list = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        return await ctx.db
            .query("promotional_notifications")
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        message: v.string(),
        target: v.string(), // "all", "active_subscribers", "inactive_users"
        type: v.string(), // "promotion", "alert", "update"
        scheduled_for: v.optional(v.number()),
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const now = Date.now();
        const status = args.scheduled_for && args.scheduled_for > now ? "scheduled" : "sent";

        const promotionId = await ctx.db.insert("promotional_notifications", {
            title: args.title,
            message: args.message,
            target: args.target,
            type: args.type,
            scheduled_for: args.scheduled_for,
            status: status === "sent" ? "sent" : "scheduled",
            sent_at: status === "sent" ? now : undefined,
            created_by: args.adminId,
            created_at: now,
        });

        if (status === "sent") {
            await ctx.scheduler.runAfter(0, internal.promotions.sendInternal, { promotionId });
        } else if (args.scheduled_for) {
            const scheduledId = await ctx.scheduler.runAt(args.scheduled_for, internal.promotions.sendInternal, { promotionId });
            await ctx.db.patch(promotionId, { scheduled_id: scheduledId });
        }

        return promotionId;
    },
});

export const cancel = mutation({
    args: { promotionId: v.id("promotional_notifications"), adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const promotion = await ctx.db.get(args.promotionId);
        if (!promotion) throw new Error("Promotion not found");
        if (promotion.status !== "scheduled") throw new Error("Only scheduled promotions can be cancelled");

        if (promotion.scheduled_id) {
            await ctx.scheduler.cancel(promotion.scheduled_id);
        }

        await ctx.db.patch(args.promotionId, {
            status: "cancelled",
            scheduled_id: undefined,
        });

        return { success: true };
    },
});

export const resend = mutation({
    args: { promotionId: v.id("promotional_notifications"), adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const promotion = await ctx.db.get(args.promotionId);
        if (!promotion) throw new Error("Promotion not found");

        const now = Date.now();
        const newPromotionId = await ctx.db.insert("promotional_notifications", {
            title: promotion.title,
            message: promotion.message,
            target: promotion.target,
            type: promotion.type,
            status: "sent",
            sent_at: now,
            created_by: args.adminId,
            created_at: now,
        });

        await ctx.scheduler.runAfter(0, internal.promotions.sendInternal, { promotionId: newPromotionId });

        return newPromotionId;
    },
});

export const sendInternal = internalMutation({
    args: { promotionId: v.id("promotional_notifications") },
    handler: async (ctx, args) => {
        const promotion = await ctx.db.get(args.promotionId);
        if (!promotion) return;
        if (promotion.status === "cancelled" || promotion.status === "sent" && promotion.sent_at && Date.now() - promotion.sent_at > 60000) {
            // Already sent or cancelled. The 1 minute buffer is just in case of immediate calls.
            // But actually we want to allow re-sending if it's a new record.
        }

        let users: any[] = [];
        if (promotion.target === "all") {
            await createNotificationForAllUsers(ctx, {
                title: promotion.title,
                message: promotion.message,
                type: promotion.type,
            });
        } else if (promotion.target === "active_subscribers") {
            // Logic to find active subscribers
            const allUsers = await ctx.db.query("users").collect();
            for (const user of allUsers) {
                const slots = await ctx.db.query("subscription_slots")
                    .withIndex("by_user", q => q.eq("user_id", user._id))
                    .collect();
                const activeSlots = slots.filter(s => s.status === "filled");
                if (activeSlots.length > 0) {
                    users.push(user);
                }
            }
            await createNotificationsForUsers(ctx, users, {
                title: promotion.title,
                message: promotion.message,
                type: promotion.type,
            });
        } else if (promotion.target === "inactive_users") {
             const allUsers = await ctx.db.query("users").collect();
             for (const user of allUsers) {
                const slots = await ctx.db.query("subscription_slots")
                    .withIndex("by_user", q => q.eq("user_id", user._id))
                    .collect();
                const activeSlots = slots.filter(s => s.status === "filled");
                if (activeSlots.length === 0) {
                    users.push(user);
                }
            }
            await createNotificationsForUsers(ctx, users, {
                title: promotion.title,
                message: promotion.message,
                type: promotion.type,
            });
        }

        await ctx.db.patch(args.promotionId, {
            status: "sent",
            sent_at: Date.now(),
            scheduled_id: undefined,
        });
    },
});
