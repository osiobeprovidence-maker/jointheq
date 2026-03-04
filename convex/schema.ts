import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        phone: v.optional(v.string()),
        full_name: v.string(),
        username: v.optional(v.string()),
        q_score: v.number(),
        q_rank: v.string(),
        wallet_balance: v.number(),
        boots_balance: v.number(),
        referral_code: v.string(),
        referred_by: v.optional(v.id("users")),
        is_suspended: v.optional(v.boolean()),
        is_banned: v.optional(v.boolean()),
        admin_role: v.optional(v.string()), // "super" | "support" | "operations" | "finance"
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
        direct_debit_card: v.optional(v.object({
            last4: v.string(),
            brand: v.string(),
            expiry: v.string(),
            auth_token: v.string(), // Secure token for recurring debit
        })),
        created_at: v.number(),
    }).index("by_email", ["email"])
        .index("by_phone", ["phone"])
        .index("by_referral_code", ["referral_code"])
        .index("by_token", ["verification_token"])
        .index("by_referred_by", ["referred_by"])
        .index("by_username", ["username"]),

    support_tickets: defineTable({
        user_id: v.id("users"),
        category: v.string(), // "billing" | "access" | "account" | "other"
        subject: v.string(),
        status: v.string(), // "open" | "in_progress" | "resolved" | "escalated"
        assigned_admin_id: v.optional(v.id("users")),
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_admin", ["assigned_admin_id"]),

    campus_reps: defineTable({
        user_id: v.id("users"),
        campus_name: v.string(),
        commission_rate: v.number(), // default 0.02 (2%)
        total_referred: v.number(),
        total_earned: v.number(),
        is_active: v.boolean(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    devices: defineTable({
        user_id: v.id("users"),
        name: v.string(),
        type: v.string(),
        last_used: v.number(),
    }).index("by_user", ["user_id"]),

    campaigns: defineTable({
        name: v.string(),
        type: v.optional(v.string()), // "referral" | "engagement" | "campus" | "promotion" | "jar" | "referral_storm" | "streak" | "raffle"
        description: v.string(),
        about: v.optional(v.string()),           // Long-form about text
        rules: v.optional(v.array(v.string())),  // List of rules
        how_it_works: v.optional(v.array(v.string())),  // Step-by-step
        reward_structure: v.optional(v.string()), // Description of what users earn
        reward_type: v.optional(v.string()),      // "boots" | "cash" | "subscription"
        reward_amount: v.optional(v.number()),
        referral_boots: v.optional(v.number()),   // BOOTS earned per referral (default 5)
        commission_months: v.optional(v.number()), // Campus Q: months commission runs (default 3)
        start_date: v.any(),
        end_date: v.any(),
        target_goal: v.optional(v.number()),
        current_progress: v.optional(v.number()),
        status: v.string(),                       // "active" | "paused" | "ended" | "archived"
        image_url: v.optional(v.string()),
        banner_url: v.optional(v.string()),
        created_by: v.optional(v.id("users")),   // Admin who created it
        created_at: v.optional(v.number()),
        // Backward compat
        boot_pool_max: v.optional(v.number()),
        boots_issued: v.optional(v.number()),
        reward_formula: v.optional(v.string()),
    }).index("by_status", ["status"])
        .index("by_type", ["type"]),

    campaign_participants: defineTable({
        campaign_id: v.id("campaigns"),
        user_id: v.id("users"),
        referrer_id: v.optional(v.id("users")),   // Who referred this participant
        referral_code: v.optional(v.string()),     // Unique code for sharing
        progress: v.number(),
        entries: v.number(),
        referral_count: v.optional(v.number()),    // How many they referred
        boots_earned: v.optional(v.number()),      // BOOTS earned in campaign
        cash_earned: v.optional(v.number()),       // Cash commissions earned
        joined_at: v.number(),
        last_active: v.optional(v.number()),
    }).index("by_campaign", ["campaign_id"])
        .index("by_user", ["user_id"])
        .index("by_referrer", ["referrer_id"]),

    campaign_referrals: defineTable({
        campaign_id: v.id("campaigns"),
        referrer_id: v.id("users"),               // Who made the referral
        referred_id: v.id("users"),               // Who was referred
        status: v.string(),                        // "pending" | "active" | "inactive"
        commission_earned: v.optional(v.number()),
        months_remaining: v.optional(v.number()), // For Campus Q 3-month rule
        created_at: v.number(),
    }).index("by_campaign", ["campaign_id"])
        .index("by_referrer", ["referrer_id"])
        .index("by_referred", ["referred_id"]),

    campaign_withdrawals: defineTable({
        user_id: v.id("users"),
        campaign_id: v.id("campaigns"),
        amount: v.number(),
        status: v.string(),                        // "pending" | "approved" | "rejected"
        bank_name: v.optional(v.string()),
        account_number: v.optional(v.string()),
        account_name: v.optional(v.string()),
        admin_note: v.optional(v.string()),
        created_at: v.number(),
        processed_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_campaign", ["campaign_id"]),

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
        capacity: v.optional(v.number()), // Max members for this slot type in a group
        features: v.optional(v.array(v.string())), // Detailed feature list
        access_type: v.optional(v.string()), // "code_access" | "invite_link" | "email_invite" | "login_with_code"
    }).index("by_subscription", ["subscription_id"]),

    groups: defineTable({
        subscription_id: v.id("subscriptions"),
        billing_cycle_start: v.string(), // When the ADMIN needs to pay
        status: v.string(),
        account_email: v.optional(v.string()), // The actual account credential email
        plan_owner: v.optional(v.string()), // Who owns/bought the account
    }).index("by_subscription", ["subscription_id"])
        .index("by_billing_cycle", ["billing_cycle_start"]),

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
