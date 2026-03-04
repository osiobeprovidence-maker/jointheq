import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        phone: v.optional(v.string()),
        full_name: v.string(),
        q_score: v.number(),
        q_rank: v.string(),
        wallet_balance: v.number(),
        boots_balance: v.number(),
        referral_code: v.string(),
        referred_by: v.optional(v.id("users")),
        score_history: v.optional(v.array(v.object({
            amount: v.number(),
            type: v.string(),
            description: v.string(),
            created_at: v.number(),
        }))),
        boots_history: v.optional(v.array(v.object({
            amount: v.number(),
            type: v.string(),
            description: v.string(),
            created_at: v.number(),
        }))),
        penalty_history: v.optional(v.array(v.object({
            score_penalty: v.number(),
            boots_penalty: v.number(),
            type: v.string(),
            description: v.string(),
            created_at: v.number(),
        }))),
        is_admin: v.boolean(),
        role: v.optional(v.string()), // "user" | "admin"
        password_hash: v.optional(v.string()),
        is_verified: v.boolean(),
        verification_token: v.optional(v.string()),
        verification_token_expires: v.optional(v.string()),
        verification_deadline: v.optional(v.number()), // 3-day grace period for email verification
        failed_login_attempts: v.optional(v.number()),
        lockout_until: v.optional(v.number()), // timestamp when user can try again
        created_at: v.number(),
    }).index("by_email", ["email"])
        .index("by_phone", ["phone"])
        .index("by_referral_code", ["referral_code"])
        .index("by_token", ["verification_token"])
        .index("by_referred_by", ["referred_by"]),

    devices: defineTable({
        user_id: v.id("users"),
        name: v.string(),
        type: v.string(),
        last_used: v.number(),
    }).index("by_user", ["user_id"]),

    campaigns: defineTable({
        name: v.string(),
        type: v.string(), // "jar" | "raffle" | "referral_storm" | "streak"
        description: v.string(),
        reward_type: v.string(), // "boots" | "coins" | "slot"
        reward_amount: v.number(),
        start_date: v.number(), // Timestamp
        end_date: v.number(), // Timestamp
        target_goal: v.number(),
        current_progress: v.number(),
        status: v.string(), // "active" | "paused" | "ended"
        image_url: v.optional(v.string()),
    }).index("by_status", ["status"]),

    campaign_participants: defineTable({
        campaign_id: v.id("campaigns"),
        user_id: v.id("users"),
        progress: v.number(),
        entries: v.number(), // For raffles
        joined_at: v.number(),
    }).index("by_campaign", ["campaign_id"]).index("by_user", ["user_id"]),

    boot_transactions: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    subscriptions: defineTable({
        name: v.string(),
        description: v.string(),
        logo_url: v.optional(v.string()), // URL for brand logo
        base_cost: v.number(),
        is_active: v.boolean(),
    }),

    slot_types: defineTable({
        subscription_id: v.id("subscriptions"),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        device_limit: v.number(),
        downloads_enabled: v.boolean(),
        min_q_score: v.number(),
        capacity: v.number(), // Max members for this slot type in a group
        features: v.array(v.string()), // Detailed feature list
    }).index("by_subscription", ["subscription_id"]),

    groups: defineTable({
        subscription_id: v.id("subscriptions"),
        billing_cycle_start: v.string(),
        status: v.string(),
    }).index("by_subscription", ["subscription_id"]),

    slots: defineTable({
        group_id: v.id("groups"),
        slot_type_id: v.id("slot_types"),
        user_id: v.optional(v.id("users")),
        status: v.string(),
        renewal_date: v.string(),
        allocation: v.optional(v.string()),
    }).index("by_user", ["user_id"]).index("by_group", ["group_id"]),

    messages: defineTable({
        sender_id: v.id("users"),
        receiver_id: v.optional(v.id("users")),
        content: v.string(),
        image_data: v.optional(v.string()),
        is_from_admin: v.boolean(),
        created_at: v.number(),
    }).index("by_sender", ["sender_id"]).index("by_receiver", ["receiver_id"]),

    lunar_memories: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        platform: v.optional(v.string()),
        genre: v.optional(v.string()),
        added_by: v.id("users"),
        created_at: v.number(),
    }),

    lunar_subscriptions: defineTable({
        user_id: v.id("users"),
        status: v.string(),
        expiry_date: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    transactions: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),
});
