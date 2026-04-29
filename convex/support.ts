import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { createNotification } from "./notificationHelpers";
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
            handled_by: "ai",
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

export const getSupportStats = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const all = await ctx.db.query("support_conversations").collect();
        
        return {
            open: all.filter(c => c.status === "open").length,
            resolved: all.filter(c => c.status === "resolved").length,
            ai_handled: all.filter(c => c.handled_by === "ai" && c.status === "open").length,
            agent_handled: all.filter(c => c.handled_by === "agent" && c.status === "open").length,
        };
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

        return { messages, user, conversation };
    },
});

export const assignAdmin = mutation({
    args: { adminId: v.id("users"), conversationId: v.id("support_conversations") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        await ctx.db.patch(args.conversationId, {
            assigned_admin_id: args.adminId,
            handled_by: "agent",
            updated_at: Date.now(),
        });
    },
});

export const escalateToAgent = mutation({
    args: { conversationId: v.id("support_conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Simple assignment logic: find first available admin or riderezzy@gmail.com
        const admin = await ctx.db
            .query("users")
            .withIndex("by_is_admin", (q) => q.eq("is_admin", true))
            .filter(q => q.eq(q.field("email"), "riderezzy@gmail.com"))
            .first();

        await ctx.db.patch(args.conversationId, {
            handled_by: "agent",
            assigned_admin_id: admin?._id,
            updated_at: Date.now(),
        });

        // Insert system message
        await ctx.db.insert("support_messages", {
            conversation_id: args.conversationId,
            sender_id: conversation.user_id, // technically it's a system message
            sender_role: "ai",
            content: "I’ll connect you with a support agent. Please wait while someone joins the chat.",
            created_at: Date.now(),
        });
    },
});

export const resolveConversation = mutation({
    args: { conversationId: v.id("support_conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        await ctx.db.patch(args.conversationId, {
            status: "resolved",
            updated_at: Date.now(),
        });

        // Clear messages for this conversation as requested
        const messages = await ctx.db
            .query("support_messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }
    },
});


// ─── Shared Functions ───────────────────────────────────────────────────────

export const sendAIMessage = mutation({
    args: {
        conversationId: v.id("support_conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const msgId = await ctx.db.insert("support_messages", {
            conversation_id: args.conversationId,
            sender_id: conversation.user_id, // AI speaks on behalf of the platform to that user
            sender_role: "ai",
            content: args.content,
            created_at: Date.now(),
        });

        await ctx.db.patch(args.conversationId, {
            last_message_at: Date.now(),
        });

        await createNotification(ctx, {
            userId: conversation.user_id,
            title: "New support message",
            message: args.content.length > 120 ? `${args.content.slice(0, 117)}...` : args.content,
            type: "message",
        });

        return msgId;
    },
});

export const sendMessage = mutation({
    args: {
        conversationId: v.id("support_conversations"),
        senderId: v.id("users"),
        senderRole: v.string(), // "user" | "admin" | "ai"
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
            sender_role: args.senderRole as "user" | "admin" | "ai",
            content: args.content,
            image_url: args.image_url,
            created_at: Date.now(),
        });

        // Update conversation last message timestamp
        await ctx.db.patch(args.conversationId, {
            last_message_at: Date.now(),
            updated_at: Date.now(),
        });

        if (args.senderRole === "admin" || args.senderRole === "ai") {
            await createNotification(ctx, {
                userId: conversation.user_id,
                title: args.senderRole === "admin" ? "New support reply" : "Support update",
                message: args.content.length > 120 ? `${args.content.slice(0, 117)}...` : args.content,
                type: "message",
            });
        }

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
