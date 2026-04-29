import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { createNotification } from "./notificationHelpers";

export const getMessages = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .filter((q) =>
                q.or(
                    q.eq(q.field("sender_id"), args.user_id),
                    q.eq(q.field("receiver_id"), args.user_id)
                )
            )
            .order("asc")
            .collect();
    },
});

export const sendMessage = mutation({
    args: {
        sender_id: v.id("users"),
        receiver_id: v.optional(v.id("users")),
        content: v.string(),
        image_data: v.optional(v.string()),
        is_from_admin: v.boolean(),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            ...args,
            created_at: Date.now(),
        });

        if (args.is_from_admin && args.receiver_id) {
            await createNotification(ctx, {
                userId: args.receiver_id,
                title: "New admin message",
                message: args.content.length > 120 ? `${args.content.slice(0, 117)}...` : args.content,
                type: "message",
            });
        }

        return messageId;
    },
});
