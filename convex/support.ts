import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── User Functions ─────────────────────────────────────────────────────────

export const startConversation = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Check if a conversation already exists for this user
        const existing = await ctx.db
            .query("support_conversations")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .filter((q) => q.eq(q.field("status"), "open"))
            .unique();

        if (existing) return existing._id;

        // Create new conversation
        return await ctx.db.insert("support_conversations", {
            user_id: args.userId,
            status: "open",
            last_message_at: Date.now(),
            created_at: Date.now(),
        });
    },
});

export const getMyConversation = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db
            .query("support_conversations")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .filter((q) => q.eq(q.field("status"), "open"))
            .unique();

        if (!conversation) return null;

        const messages = await ctx.db
            .query("support_messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", conversation._id))
            .order("asc")
            .collect();

        return { conversation, messages };
    },
});

// ─── Admin Functions ────────────────────────────────────────────────────────

export const getConversations = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const conversations = await ctx.db
            .query("support_conversations")
            .order("desc")
            .collect();

        return await Promise.all(
            conversations.map(async (conv) => {
                const user = await ctx.db.get(conv.user_id);
                const lastMessage = await ctx.db
                    .query("support_messages")
                    .withIndex("by_conversation", (q) => q.eq("conversation_id", conv._id))
                    .order("desc")
                    .first();

                return {
                    ...conv,
                    user_name: user?.full_name || "Unknown User",
                    user_email: user?.email || "",
                    user_avatar: user?.full_name?.[0] || "?",
                    last_message: lastMessage?.content || "No messages yet",
                    last_message_at: lastMessage?.created_at || conv.created_at,
                };
            })
        );
    },
});

export const getConversationMessages = query({
    args: { adminId: v.id("users"), conversationId: v.id("support_conversations") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const messages = await ctx.db
            .query("support_messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId))
            .order("asc")
            .collect();

        const conversation = await ctx.db.get(args.conversationId);
        const user = conversation ? await ctx.db.get(conversation.user_id) : null;

        return { messages, user };
    },
});

export const assignAdmin = mutation({
    args: { adminId: v.id("users"), conversationId: v.id("support_conversations") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        await ctx.db.patch(args.conversationId, {
            assigned_admin_id: args.adminId,
        });
    },
});

// ─── Shared Functions ───────────────────────────────────────────────────────

export const sendMessage = mutation({
    args: {
        conversationId: v.id("support_conversations"),
        senderId: v.id("users"),
        senderRole: v.string(), // "user" | "admin"
        content: v.string(),
        image_url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const sender = await ctx.db.get(args.senderId);
        if (!sender) throw new Error("Sender not found");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Security check: user can only send to their own conversation
        if (args.senderRole === "user" && conversation.user_id !== args.senderId) {
            throw new Error("Unauthorized");
        }

        // Security check: only admin can send as admin
        if (args.senderRole === "admin" && !sender.is_admin) {
            throw new Error("Unauthorized");
        }

        const messageId = await ctx.db.insert("support_messages", {
            conversation_id: args.conversationId,
            sender_id: args.senderId,
            sender_role: args.senderRole as "user" | "admin",
            content: args.content,
            image_url: args.image_url,
            created_at: Date.now(),
        });

        // Update conversation last message timestamp
        await ctx.db.patch(args.conversationId, {
            last_message_at: Date.now(),
        });

        return messageId;
    },
});

export const closeConversation = mutation({
    args: { adminId: v.id("users"), conversationId: v.id("support_conversations") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        await ctx.db.patch(args.conversationId, {
            status: "closed",
        });
    },
});
