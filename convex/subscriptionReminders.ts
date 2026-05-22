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
        channels: ["in_app", "push", "email", "whatsapp", "telegram"],
    },
    {
        key: "5_days",
        title: "5 DAYS LEFT",
        message: "Hey {{name}},\nYour Q subscription will expire in 5 days.\n\nTo avoid losing access to your shared subscriptions and benefits, renew before the due date.",
        cta_text: "Renew Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp", "telegram"],
    },
    {
        key: "due",
        title: "SUBSCRIPTION DUE",
        message: "Hi {{name}},\nYour Q subscription is now due.\n\nPlease renew now to keep your subscription active. If payment is still not confirmed after the grace period, admins will review it before any removal happens.",
        cta_text: "Pay Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp", "telegram"],
    },
    {
        key: "overdue",
        title: "SUBSCRIPTION OVERDUE",
        message: "Your Q subscription payment is overdue.\n\nPlease renew immediately to avoid account cancellation.",
        cta_text: "Renew Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp", "telegram"],
    },
    {
        key: "cancelled",
        title: "SUBSCRIPTION NEEDS REVIEW",
        message: "Your subscription is overdue and has been sent to Q admins for review.\n\nYou have not been removed automatically. Please renew now or contact support if you already paid.",
        cta_text: "Renew Now",
        cta_url: RENEWAL_URL,
        channels: ["in_app", "push", "email", "whatsapp", "telegram"],
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
            const shouldRefreshDefaultCopy =
                (template.key === "due" && existing.message.includes("automatically cancelled")) ||
                (template.key === "cancelled" && existing.message.includes("cancelled due to non-payment"));
            const shouldAddTelegram = !existing.channels.includes("telegram");

            if (shouldRefreshDefaultCopy || shouldAddTelegram) {
                await ctx.db.patch(existing._id, {
                    title: shouldRefreshDefaultCopy ? template.title : existing.title,
                    message: shouldRefreshDefaultCopy ? template.message : existing.message,
                    cta_text: shouldRefreshDefaultCopy ? template.cta_text : existing.cta_text,
                    cta_url: shouldRefreshDefaultCopy ? template.cta_url : existing.cta_url,
                    channels: [...new Set([...existing.channels, "telegram"])],
                    updated_at: Date.now(),
                });
                templates.set(template.key, (await ctx.db.get(existing._id))!);
                continue;
            }

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
        telegram: "pending",
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

    if (template.channels.includes("telegram")) {
        await ctx.scheduler.runAfter(0, internal.subscriptionReminderActions.sendReminderTelegram, {
            logId,
            chatId: user.telegram_chat_id,
            title,
            message,
            ctaText: template.cta_text,
            ctaUrl: template.cta_url,
        });
    }

    return logId;
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
        let reviewRequests = 0;
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
                await ctx.db.patch(slot._id, {
                    status: "closing",
                    auto_renew: false,
                    removal_scheduled_at: Date.now(),
                });
                reviewRequests += 1;
            }
        }

        return { success: true, sent, reviewRequests, skipped, checked: slots.length };
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
