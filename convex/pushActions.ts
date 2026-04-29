"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

const getVapidConfig = () => {
    const subject = process.env.VAPID_SUBJECT || "mailto:support@jointheq.sbs";
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        return null;
    }

    return { subject, publicKey, privateKey };
};

export const sendNotificationPush = internalAction({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const config = getVapidConfig();
        if (!config) {
            console.warn("Push skipped: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not configured.");
            return { success: false, reason: "missing_vapid_keys" };
        }

        const delivery = await ctx.runQuery(internal.push.getNotificationDeliveryPayload, {
            notificationId: args.notificationId,
        });

        if (!delivery || delivery.subscriptions.length === 0) {
            return { success: true, sent: 0 };
        }

        webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

        const payload = JSON.stringify({
            title: delivery.notification.title,
            body: delivery.notification.message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: String(delivery.notification._id),
            data: {
                url: "/dashboard?tab=notifications",
                notificationId: String(delivery.notification._id),
                type: delivery.notification.type,
            },
        });

        let sent = 0;
        let removed = 0;

        for (const subscription of delivery.subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        expirationTime: subscription.expiration_time ?? null,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth,
                        },
                    },
                    payload,
                );
                sent += 1;
            } catch (error: any) {
                const statusCode = error?.statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    await ctx.runMutation(internal.push.removeSubscriptionByEndpoint, {
                        endpoint: subscription.endpoint,
                    });
                    removed += 1;
                    continue;
                }

                console.warn("Push delivery failed", {
                    endpoint: subscription.endpoint,
                    statusCode,
                    message: error?.message,
                });
            }
        }

        return { success: true, sent, removed };
    },
});
