"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

const buildHtml = (message: string, ctaText?: string, ctaUrl?: string) => {
    const paragraphs = message
        .split("\n")
        .filter(Boolean)
        .map((line) => `<p style="margin:0 0 14px;color:#333;line-height:1.6;">${line}</p>`)
        .join("");

    const cta = ctaText && ctaUrl
        ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:10px;padding:12px 22px;background:#000;color:#fff;text-decoration:none;border-radius:12px;font-weight:800;">${ctaText}</a>`
        : "";

    return `<div style="font-family:Inter,Arial,sans-serif;padding:24px;color:#111;max-width:560px;margin:0 auto;">
        ${paragraphs}
        ${cta}
    </div>`;
};

export const sendReminderEmail = internalAction({
    args: {
        logId: v.id("subscription_notification_logs"),
        email: v.optional(v.string()),
        title: v.string(),
        message: v.string(),
        ctaText: v.optional(v.string()),
        ctaUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.email) {
            await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
                logId: args.logId,
                channel: "email",
                status: "skipped",
                reason: "missing_email",
            });
            return { success: false, reason: "missing_email" };
        }

        if (!process.env.RESEND_API_KEY) {
            await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
                logId: args.logId,
                channel: "email",
                status: "skipped",
                reason: "missing_resend_key",
            });
            return { success: false, reason: "missing_resend_key" };
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
            from: "Q <hello@jointheq.sbs>",
            to: args.email,
            subject: args.title,
            html: buildHtml(args.message, args.ctaText, args.ctaUrl),
        });

        await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
            logId: args.logId,
            channel: "email",
            status: error ? "failed" : "sent",
            reason: error?.message,
        });

        if (error) return { success: false, reason: error.message };
        return { success: true };
    },
});

export const sendReminderPush = internalAction({
    args: {
        logId: v.id("subscription_notification_logs"),
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runAction(internal.pushActions.sendNotificationPush, {
            notificationId: args.notificationId,
        });

        const sent = Number(result?.sent ?? 0);
        const reason = result?.reason || (sent === 0 ? "no_active_subscription" : undefined);

        await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
            logId: args.logId,
            channel: "push",
            status: result?.success && sent > 0 ? "sent" : "skipped",
            reason,
        });

        return result;
    },
});

export const sendReminderWhatsApp = internalAction({
    args: {
        logId: v.id("subscription_notification_logs"),
        phone: v.optional(v.string()),
        title: v.string(),
        message: v.string(),
        ctaText: v.optional(v.string()),
        ctaUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.phone) {
            await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
                logId: args.logId,
                channel: "whatsapp",
                status: "skipped",
                reason: "missing_phone",
            });
            return { success: false, reason: "missing_phone" };
        }

        const endpoint = process.env.WHATSAPP_API_URL;
        const token = process.env.WHATSAPP_API_TOKEN;
        if (!endpoint || !token) {
            await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
                logId: args.logId,
                channel: "whatsapp",
                status: "skipped",
                reason: "not_connected",
            });
            return { success: false, reason: "not_connected" };
        }

        const body = `${args.title}\n\n${args.message}${args.ctaText && args.ctaUrl ? `\n\n${args.ctaText}: ${args.ctaUrl}` : ""}`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                to: args.phone,
                message: body,
            }),
        });

        await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
            logId: args.logId,
            channel: "whatsapp",
            status: response.ok ? "sent" : "failed",
            reason: response.ok ? undefined : String(response.status),
        });

        return { success: response.ok, status: response.status };
    },
});

export const sendReminderTelegram = internalAction({
    args: {
        logId: v.id("subscription_notification_logs"),
        chatId: v.optional(v.string()),
        title: v.string(),
        message: v.string(),
        ctaText: v.optional(v.string()),
        ctaUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.chatId) {
            await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
                logId: args.logId,
                channel: "telegram",
                status: "skipped",
                reason: "missing_chat_id",
            });
            return { success: false, reason: "missing_chat_id" };
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
                logId: args.logId,
                channel: "telegram",
                status: "skipped",
                reason: "missing_bot_token",
            });
            return { success: false, reason: "missing_bot_token" };
        }

        const body = `${args.title}\n\n${args.message}${args.ctaText && args.ctaUrl ? `\n\n${args.ctaText}: ${args.ctaUrl}` : ""}`;
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: args.chatId,
                text: body,
            }),
        });

        await ctx.runMutation(internal.subscriptionReminders.markChannelDelivery, {
            logId: args.logId,
            channel: "telegram",
            status: response.ok ? "sent" : "failed",
            reason: response.ok ? undefined : String(response.status),
        });

        return { success: response.ok, status: response.status };
    },
});

export const sendSuperAdminTelegramTest = internalAction({
    args: {},
    handler: async (ctx) => {
        const target = await ctx.runQuery(internal.users.getSuperAdminTelegramTarget, {});
        if (!target.chatId) {
            return { success: false, reason: "missing_chat_id", email: target.email };
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            return { success: false, reason: "missing_bot_token", email: target.email };
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: target.chatId,
                text: "JoinTheQ Telegram test\n\nTelegram renewal reminders are connected for the superadmin.",
            }),
        });
        const payload = await response.json().catch(() => null);

        return {
            success: response.ok && payload?.ok === true,
            status: response.status,
            email: target.email,
            telegramOk: payload?.ok === true,
            description: typeof payload?.description === "string" ? payload.description : undefined,
            messageId: payload?.result?.message_id,
        };
    },
});
