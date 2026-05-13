import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { createNotification } from "./notificationHelpers";

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEWAL_URL = "/dashboard?tab=dashboard";

type ReminderKey = "10_days" | "5_days" | "due" | "overdue" | "cancelled";

type ReminderTemplate = {
    key: ReminderKey;
    title: string;
    message: string;
    cta_text?: string;
    cta_url?: string;
    channels: string[];
};

const DEFAULT_TEMPLATES: ReminderTemplate[] = [
    {
        key: "10_days",
        title: "10 DAYS TO RENEW",
        message: "Hi {{name}},\nYour subscription on Q is expiring in 10 days.\n\nRenew now to avoid interruption and keep enjoying all your active subscriptions without stress.",
        cta_text: "Renew Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp"],
    },
    {
        key: "5_days",
        title: "5 DAYS LEFT",
        message: "Hey {{name}},\nYour Q subscription will expire in 5 days.\n\nTo avoid losing access to your shared subscriptions and benefits, renew before the due date.",
        cta_text: "Renew Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp"],
    },
    {
        key: "due",
        title: "SUBSCRIPTION DUE",
        message: "Hi {{name}},\nYour Q subscription is now due.\n\nYour account may be restricted soon if payment is not completed.\n\nAccounts unpaid after 3 days will be automatically cancelled.",
        cta_text: "Pay Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp"],
    },
    {
        key: "overdue",
        title: "SUBSCRIPTION OVERDUE",
        message: "Your Q subscription payment is overdue.\n\nPlease renew immediately to avoid account cancellation.",
        cta_text: "Renew Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp"],
    },
    {
        key: "cancelled",
        title: "SUBSCRIPTION CANCELLED",
        message: "Your subscription has been cancelled due to non-payment.\n\nTo restore access, please subscribe again on Q.",
        channels: ["in_app", "push", "email", "whatsapp"],
    },
];

const startOfDay = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime();
};

const toDateKey = (timestamp: number) => new Date(startOfDay(timestamp)).toISOString().slice(0, 10);

const parseDate = (value?: string) => {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const personalize = (template: string, user: Doc<"users">) => {
    const name = user.full_name?.trim() || user.username?.trim() || "there";
    return template.replace(/\{\{name\}\}/g, name);
};

const shouldSkipUser = (user: Doc<"users">) => user.is_admin || user.is_suspended || user.is_banned;

const ensureDefaultTemplates = async (ctx: any) => {
    const templates = new Map<string, Doc<"subscription_notification_templates">>();

    for (const template of DEFAULT_TEMPLATES) {
        const existing = await ctx.db
            .query("subscription_notification_templates")
            .withIndex("by_key", (q: any) => q.eq("key", template.key))
            .first();

        if (existing) {
            templates.set(template.key, existing);
            continue;
        }

        const id = await ctx.db.insert("subscription_notification_templates", {
            ...template,
            updated_at: Date.now(),
        });
        templates.set(template.key, (await ctx.db.get(id))!);
    }

    return templates;
};

const hasLog = async (
    ctx: any,
    slotId: Id<"subscription_slots">,
    eventKey: ReminderKey,
    cycleDueDate: string,
    sendDate: string,
) => {
    if (eventKey === "overdue") {
        return await ctx.db
            .query("subscription_notification_logs")
            .withIndex("by_slot_event_send_date", (q: any) =>
                q.eq("slot_id", slotId).eq("event_key", eventKey).eq("send_date", sendDate),
            )
            .first();
    }

    return await ctx.db
        .query("subscription_notification_logs")
        .withIndex("by_slot_event_cycle", (q: any) =>
            q.eq("slot_id", slotId).eq("event_key", eventKey).eq("cycle_due_date", cycleDueDate),
        )
        .first();
};

const sendReminder = async (
    ctx: any,
    slot: Doc<"subscription_slots">,
    user: Doc<"users">,
    template: Doc<"subscription_notification_templates">,
    cycleDueDate: string,
    sendDate: string,
) => {
    const title = personalize(template.title, user);
    const message = personalize(template.message, user);
    const channels = {
        in_app: "pending",
        push: "queued",
        email: "pending",
        whatsapp: "pending",
    };

    const notificationId = await createNotification(ctx, {
        userId: user._id,
        title,
        message,
        type: "subscription",
        ctaText: template.cta_text,
        ctaUrl: template.cta_url,
        skipPush: true,
    });

    channels.in_app = "sent";

    const logId = await ctx.db.insert("subscription_notification_logs", {
        slot_id: slot._id,
        user_id: user._id,
        event_key: template.key,
        cycle_due_date: cycleDueDate,
        send_date: sendDate,
        notification_id: notificationId,
        title,
        message,
        cta_text: template.cta_text,
        cta_url: template.cta_url,
        channels,
        status: "queued",
        created_at: Date.now(),
    });

    if (template.channels.includes("push")) {
        await ctx.scheduler.runAfter(0, internal.subscriptionReminderActions.sendReminderPush, {
            logId,
            notificationId,
        });
    }

    if (template.channels.includes("email")) {
        await ctx.scheduler.runAfter(0, internal.subscriptionReminderActions.sendReminderEmail, {
            logId,
            email: user.email,
            title,
            message,
            ctaText: template.cta_text,
            ctaUrl: template.cta_url,
        });
    }

    if (template.channels.includes("whatsapp")) {
        await ctx.scheduler.runAfter(0, internal.subscriptionReminderActions.sendReminderWhatsApp, {
            logId,
            phone: user.phone,
            title,
            message,
            ctaText: template.cta_text,
            ctaUrl: template.cta_url,
        });
    }

    return logId;
};

const updateMarketplaceCounts = async (ctx: any, slot: Doc<"subscription_slots">) => {
    if (!slot.group_id) return;
    const group = await ctx.db.get(slot.group_id);
    if (!group?.account_email || !group.subscription_catalog_id) return;

    const marketplace = await ctx.db
        .query("marketplace")
        .withIndex("by_account_email", (q: any) => q.eq("account_email", group.account_email))
        .filter((q: any) => q.eq(q.field("subscription_catalog_id"), group.subscription_catalog_id))
        .first();

    if (!marketplace) return;

    const filled = Math.max(0, (marketplace.filled_slots || 0) - 1);
    const total = marketplace.total_slots || 0;
    await ctx.db.patch(marketplace._id, {
        filled_slots: filled,
        available_slots: Math.max(0, total - filled),
        updated_at: Date.now(),
    });
};

export const processDailySubscriptionReminders = internalMutation({
    args: {},
    handler: async (ctx) => {
        const templates = await ensureDefaultTemplates(ctx);
        const today = startOfDay(Date.now());
        const sendDate = toDateKey(today);
        const slots = await ctx.db
            .query("subscription_slots")
            .withIndex("by_status", (q) => q.eq("status", "filled"))
            .collect();

        let sent = 0;
        let cancelled = 0;
        let skipped = 0;

        for (const slot of slots) {
            if (!slot.user_id) {
                skipped += 1;
                continue;
            }

            const dueAt = parseDate(slot.renewal_date);
            if (!dueAt) {
                skipped += 1;
                continue;
            }

            const user = await ctx.db.get(slot.user_id);
            if (!user || shouldSkipUser(user)) {
                skipped += 1;
                continue;
            }

            const dueDay = startOfDay(dueAt);
            const daysUntilDue = Math.floor((dueDay - today) / DAY_MS);
            const cycleDueDate = toDateKey(dueDay);

            let eventKey: ReminderKey | null = null;
            if (daysUntilDue === 10) eventKey = "10_days";
            if (daysUntilDue === 5) eventKey = "5_days";
            if (daysUntilDue === 0) eventKey = "due";
            if (daysUntilDue < 0 && daysUntilDue > -3) eventKey = "overdue";
            if (daysUntilDue <= -3) eventKey = "cancelled";

            if (!eventKey) continue;
            if (await hasLog(ctx, slot._id, eventKey, cycleDueDate, sendDate)) continue;

            const template = templates.get(eventKey);
            if (!template) {
                skipped += 1;
                continue;
            }

            await sendReminder(ctx, slot, user, template, cycleDueDate, sendDate);
            sent += 1;

            if (eventKey === "cancelled") {
                const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
                const subscription = slotType?.subscription_id ? await ctx.db.get(slotType.subscription_id as any) : null;

                await ctx.db.insert("canceled_subscriptions", {
                    user_id: slot.user_id,
                    user_name: user.full_name || user.username || "Unknown",
                    user_email: user.email || "",
                    source_type: "slot",
                    source_id: String(slot._id),
                    subscription_name: (subscription as any)?.name || "Subscription",
                    slot_name: slotType?.name || slot.profile_name || "Slot",
                    price: slotType?.price || 0,
                    renewal_date: slot.renewal_date,
                    reason: "Automatically canceled after overdue renewal window",
                    canceled_at: Date.now(),
                    created_at: Date.now(),
                });

                await ctx.db.patch(slot._id, {
                    user_id: undefined,
                    status: "open",
                    renewal_date: undefined,
                    auto_renew: false,
                    removal_scheduled_at: undefined,
                });
                await updateMarketplaceCounts(ctx, slot);
                cancelled += 1;
            }
        }

        return { success: true, sent, cancelled, skipped, checked: slots.length };
    },
});

export const markChannelDelivery = internalMutation({
    args: {
        logId: v.id("subscription_notification_logs"),
        channel: v.string(),
        status: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const log = await ctx.db.get(args.logId);
        if (!log) return;

        await ctx.db.patch(args.logId, {
            channels: {
                ...log.channels,
                [args.channel]: args.reason ? `${args.status}:${args.reason}` : args.status,
            },
            status: "processed",
        });
    },
});

export const listTemplates = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        return await ctx.db.query("subscription_notification_templates").collect();
    },
});

export const updateTemplate = mutation({
    args: {
        adminId: v.id("users"),
        key: v.string(),
        title: v.string(),
        message: v.string(),
        cta_text: v.optional(v.string()),
        cta_url: v.optional(v.string()),
        channels: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("subscription_notification_templates")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();

        const payload = {
            title: args.title,
            message: args.message,
            cta_text: args.cta_text,
            cta_url: args.cta_url,
            channels: args.channels,
            updated_at: Date.now(),
            updated_by: args.adminId,
        };

        if (existing) {
            await ctx.db.patch(existing._id, payload);
            return existing._id;
        }

        return await ctx.db.insert("subscription_notification_templates", {
            key: args.key,
            ...payload,
        });
    },
});
