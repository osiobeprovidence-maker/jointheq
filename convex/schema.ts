import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // PILLAR 1: Users
    users: defineTable({
        email: v.string(),
        phone: v.optional(v.string()),
        full_name: v.string(),
        username: v.optional(v.string()),
        work_username: v.optional(v.string()),
        role: v.optional(v.string()), // "subscriber" | "owner" | "admin"
        wallet_balance: v.number(),
        boots_balance: v.number(),
        created_at: v.number(),
        q_score: v.number(),
        q_rank: v.string(),
        referral_code: v.string(),
        referred_by: v.optional(v.id("users")),
        is_suspended: v.optional(v.boolean()),
        is_banned: v.optional(v.boolean()),
        is_fraud_flagged: v.optional(v.boolean()),
        admin_role: v.optional(v.string()),
        is_admin: v.boolean(),
        is_verified: v.boolean(),
        profile_image_url: v.optional(v.string()),
        university: v.optional(v.string()),
        password_hash: v.optional(v.string()),
        verification_token: v.optional(v.string()),
        verification_token_expires: v.optional(v.string()),
        verification_deadline: v.optional(v.number()),
        direct_debit_card: v.optional(v.object({
            last4: v.string(),
            brand: v.string(),
            expiry: v.string(),
            auth_token: v.string(),
        })),
        score_history: v.optional(v.array(v.object({
            amount: v.number(),
            type: v.string(),
            description: v.string(),
            timestamp: v.optional(v.number()),
            created_at: v.optional(v.number()),
        }))),
        boots_history: v.optional(v.array(v.object({
            amount: v.number(),
            type: v.string(),
            description: v.string(),
            timestamp: v.optional(v.number()),
            created_at: v.optional(v.number()),
        }))),
        penalty_history: v.optional(v.array(v.object({
            type: v.string(),
            description: v.string(),
            score_penalty: v.number(),
            boots_penalty: v.number(),
            timestamp: v.optional(v.number()),
            created_at: v.optional(v.number()),
        }))),
        failed_login_attempts: v.optional(v.number()),
        lockout_until: v.optional(v.number()),
    }).index("by_email", ["email"])
        .index("by_username", ["username"])
        .index("by_referral_code", ["referral_code"])
        .index("by_referred_by", ["referred_by"])
        .index("by_phone", ["phone"])
        .index("by_token", ["verification_token"])
        .index("by_is_admin", ["is_admin"])
        .index("by_work_username", ["work_username"]),

    // PILLAR 2: Subscriptions (Accounts)
    subscriptions: defineTable({
        owner_id: v.optional(v.id("users")),
        platform: v.optional(v.string()),
        platform_catalog_id: v.optional(v.id("subscription_catalog")),
        login_email: v.optional(v.string()),
        login_password: v.optional(v.string()),
        renewal_date: v.optional(v.string()),
        total_slots: v.optional(v.number()),
        slot_price: v.optional(v.number()),
        status: v.optional(v.string()),
        group_id: v.optional(v.id("groups")),
        admin_note: v.optional(v.string()),
        owner_payout_amount: v.optional(v.number()),
        created_at: v.optional(v.number()),
        updated_at: v.optional(v.number()),
        base_cost: v.optional(v.number()),
        description: v.optional(v.string()),
        is_active: v.optional(v.boolean()),
        name: v.optional(v.string()),
    }).index("by_owner", ["owner_id"])
        .index("by_status", ["status"]),

    // PILLAR 3: Subscription Slots
    subscription_slots: defineTable({
        subscription_id: v.optional(v.id("subscriptions")),
        group_id: v.optional(v.id("groups")),
        slot_type_id: v.optional(v.id("slot_types")),
        slot_number: v.optional(v.number()),
        user_id: v.optional(v.id("users")),
        profile_name: v.optional(v.string()),
        status: v.string(),
        renewal_date: v.optional(v.string()),
        allocation: v.optional(v.string()),
        created_at: v.optional(v.number()),
    }).index("by_subscription", ["subscription_id"])
        .index("by_user", ["user_id"])
        .index("by_group", ["group_id"])
        .index("by_status", ["status"]),

    // PILLAR 4: Wallets
    wallets: defineTable({
        user_id: v.id("users"),
        balance: v.number(),
        updated_at: v.number(),
    }).index("by_user", ["user_id"]),

    // PILLAR 5: Wallet Transactions
    wallet_transactions: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(),
        source: v.string(),
        status: v.string(),
        description: v.optional(v.string()),
        fee: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_type", ["type"])
        .index("by_status", ["status"]),

    // PILLAR 6: Subscription Payments
    subscription_payments: defineTable({
        slot_id: v.id("subscription_slots"),
        user_id: v.id("users"),
        amount: v.number(),
        status: v.string(),
        payment_date: v.string(),
        transaction_id: v.optional(v.id("wallet_transactions")),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    // PILLAR 7: Migration Records
    migration_records: defineTable({
        user_id: v.id("users"),
        platform: v.string(),
        profile_name: v.string(),
        payment_day: v.number(),
        status: v.string(),
        created_at: v.number(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        device_count: v.optional(v.number()),
    }).index("by_user", ["user_id"]),

    // PILLAR 8: Migrated Subscriptions (New Migration System)
    migrated_subscriptions: defineTable({
        user_id: v.id("users"),
        email: v.string(),
        phone: v.string(),
        platform: v.string(),
        profile_name: v.string(),
        payment_day: v.number(),
        last_payment_date: v.string(),
        role: v.string(),
        device_count: v.string(),
        device_types: v.optional(v.array(v.string())),
        status: v.string(),
        assigned_group: v.optional(v.string()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_platform", ["platform"]),

    // --- SUPPORTING TABLES ---
    subscription_catalog: defineTable({
        name: v.string(),
        description: v.string(),
        logo_url: v.optional(v.string()),
        category: v.optional(v.string()),
        is_active: v.boolean(),
        base_cost: v.number(),
    }),

    slot_types: defineTable({
        subscription_id: v.optional(v.union(v.id("subscription_catalog"), v.id("subscriptions"))),
        name: v.string(),
        price: v.number(),
        capacity: v.optional(v.number()),
        access_type: v.optional(v.string()),
        device_limit: v.number(),
        downloads_enabled: v.boolean(),
        min_q_score: v.number(),
        features: v.optional(v.array(v.string())),
    }).index("by_subscription", ["subscription_id"]),

    groups: defineTable({
        subscription_catalog_id: v.optional(v.id("subscription_catalog")),
        subscription_id: v.optional(v.id("subscriptions")),
        billing_cycle_start: v.string(),
        status: v.string(),
        account_email: v.optional(v.string()),
        plan_owner: v.optional(v.string()),
    }).index("by_catalog", ["subscription_catalog_id"]),

    messages: defineTable({
        sender_id: v.id("users"),
        receiver_id: v.optional(v.id("users")),
        content: v.string(),
        image_data: v.optional(v.string()),
        is_from_admin: v.boolean(),
        created_at: v.number(),
    }).index("by_sender", ["sender_id"]).index("by_receiver", ["receiver_id"]),

    manual_funding_requests: defineTable({
        user_id: v.id("users"),
        base_amount: v.number(),
        unique_amount: v.number(),
        sender_name: v.string(),
        bank_name: v.optional(v.string()),
        screenshot_id: v.optional(v.string()),
        reference: v.optional(v.string()),
        status: v.string(),
        created_at: v.number(),
        processed_at: v.optional(v.number()),
        processed_by: v.optional(v.id("users")),
        admin_note: v.optional(v.string()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_unique_amount", ["unique_amount", "status"]),

    boot_transactions: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    support_conversations: defineTable({
        user_id: v.id("users"),
        status: v.string(),
        assigned_admin_id: v.optional(v.id("users")),
        created_at: v.number(),
        updated_at: v.optional(v.number()),
        last_message_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_admin", ["assigned_admin_id"])
        .index("by_last_message", ["updated_at"]),

    support_messages: defineTable({
        conversation_id: v.id("support_conversations"),
        sender_id: v.id("users"),
        sender_role: v.optional(v.string()),
        content: v.string(),
        created_at: v.number(),
    }).index("by_conversation", ["conversation_id"])
        .index("by_sender", ["sender_id"]),

    support_tickets: defineTable({
        user_id: v.id("users"),
        category: v.string(),
        subject: v.string(),
        status: v.string(),
        assigned_admin_id: v.optional(v.id("users")),
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_user", ["user_id"]),

    campus_reps: defineTable({
        user_id: v.id("users"),
        campus_name: v.string(),
        commission_rate: v.number(),
        total_referred: v.number(),
        total_earned: v.number(),
        is_active: v.boolean(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    campaigns: defineTable({
        name: v.string(),
        description: v.string(),
        status: v.string(),
        created_at: v.optional(v.number()),
        created_by: v.optional(v.id("users")),
        reward_type: v.optional(v.string()),
        reward_amount: v.optional(v.number()),
        reward_formula: v.optional(v.string()),
        boot_pool_max: v.optional(v.number()),
        boots_issued: v.optional(v.number()),
        start_date: v.optional(v.union(v.number(), v.string())),
        end_date: v.optional(v.union(v.number(), v.string())),
        target_goal: v.optional(v.number()),
        current_progress: v.optional(v.number()),
        type: v.optional(v.string()),
    }).index("by_status", ["status"]),

    campaign_participants: defineTable({
        campaign_id: v.id("campaigns"),
        user_id: v.id("users"),
        progress: v.optional(v.number()),
        joined_at: v.optional(v.number()),
        referral_count: v.optional(v.number()),
        boots_earned: v.optional(v.number()),
        cash_earned: v.optional(v.number()),
        entries: v.optional(v.number()),
        last_active: v.optional(v.number()),
        referral_code: v.optional(v.string()),
    }).index("by_campaign", ["campaign_id"]).index("by_user", ["user_id"]),

    // --- ADDITIONAL TABLES FOR ADMIN WORKFORCE & OTHER FEATURES ---
    admin_tasks: defineTable({
        title: v.string(),
        description: v.string(),
        status: v.string(),
        priority: v.string(),
        assigned_to: v.optional(v.id("users")),
        assigned_admin_id: v.optional(v.id("users")),
        created_by: v.optional(v.id("users")),
        completed_at: v.optional(v.number()),
        deadline: v.number(),
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_status", ["status"])
        .index("by_assignee", ["assigned_to"])
        .index("by_admin", ["assigned_admin_id"]),

    admin_logs: defineTable({
        admin_id: v.id("users"),
        action: v.string(),
        target_type: v.string(),
        target_id: v.optional(v.string()),
        target_name: v.string(),
        details: v.optional(v.string()),
        created_at: v.number(),
    }).index("by_admin", ["admin_id"])
        .index("by_created_at", ["created_at"]),

    admin_notifications: defineTable({
        admin_id: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.optional(v.string()),
        is_read: v.boolean(),
        related_task_id: v.optional(v.id("admin_tasks")),
        created_at: v.number(),
    }).index("by_admin", ["admin_id"])
        .index("by_created_at", ["created_at"]),

    transactions: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        status: v.optional(v.string()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_created_at", ["created_at"]),

    slots: defineTable({
        user_id: v.id("users"),
        subscription_id: v.optional(v.id("subscriptions")),
        group_id: v.optional(v.id("groups")),
        slot_type_id: v.optional(v.id("slot_types")),
        status: v.string(),
        renewal_date: v.optional(v.string()),
        created_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_subscription", ["subscription_id"]),

    campaign_referrals: defineTable({
        campaign_id: v.id("campaigns"),
        referrer_id: v.id("users"),
        referred_id: v.id("users"),
        status: v.string(),
        created_at: v.number(),
    }).index("by_referrer", ["referrer_id"])
        .index("by_campaign", ["campaign_id"])
        .index("by_created_at", ["created_at"]),

    fraud_flags: defineTable({
        user_id: v.id("users"),
        reason: v.string(),
        status: v.string(),
        created_at: v.number(),
        resolved_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_created_at", ["created_at"]),

    devices: defineTable({
        user_id: v.id("users"),
        device_name: v.string(),
        device_type: v.string(),
        is_verified: v.boolean(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    lunar_memories: defineTable({
        user_id: v.id("users"),
        memory_type: v.string(),
        content: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    lunar_subscriptions: defineTable({
        user_id: v.id("users"),
        subscription_id: v.id("subscriptions"),
        status: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    funding_requests: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        status: v.string(),
        payment_method: v.string(),
        reference: v.optional(v.string()),
        created_at: v.number(),
        processed_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"]),

    listings: defineTable({
        owner_id: v.id("users"),
        subscription_catalog_id: v.id("subscription_catalog"),
        status: v.string(),
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_owner", ["owner_id"])
        .index("by_status", ["status"]),

    reputation: defineTable({
        user_id: v.id("users"),
        score: v.number(),
        reason: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    admin_invitations: defineTable({
        email: v.string(),
        role: v.string(),
        work_username: v.string(),
        invited_by: v.id("users"),
        token: v.string(),
        status: v.string(),
        expires_at: v.number(),
        created_at: v.number(),
        accepted_at: v.optional(v.number()),
        accepted_by: v.optional(v.id("users")),
    }).index("by_email", ["email"])
        .index("by_token", ["token"])
        .index("by_status", ["status"]),
});
