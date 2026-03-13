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
        is_fraud_flagged: v.optional(v.boolean()),       // Flagged for suspicious activity
        fraud_review_reason: v.optional(v.string()),     // Why they were flagged
        admin_role: v.optional(v.string()),              // "super" | "support" | "operations" | "finance" | "campaigns"
        work_username: v.optional(v.string()),             // Admin work handle e.g. support_jane
        is_admin_suspended: v.optional(v.boolean()),       // Admin access suspended (not user account)
        admin_suspended_at: v.optional(v.number()),
        score_history: v.optional(v.array(v.object({
            amount: v.number(), type: v.string(), description: v.string(), created_at: v.number(),
        }))),
        boots_history: v.optional(v.array(v.object({
            amount: v.number(), type: v.string(), description: v.string(), created_at: v.number(),
        }))),
        penalty_history: v.optional(v.array(v.object({
            score_penalty: v.number(), boots_penalty: v.number(), type: v.string(), description: v.string(), created_at: v.number(),
        }))),
        is_admin: v.boolean(),
        role: v.optional(v.string()),
        profile_image_url: v.optional(v.string()),
        password_hash: v.optional(v.string()),
        is_verified: v.boolean(),
        verification_token: v.optional(v.string()),
        verification_token_expires: v.optional(v.string()),
        verification_deadline: v.optional(v.number()),
        failed_login_attempts: v.optional(v.number()),
        lockout_until: v.optional(v.number()),
        direct_debit_card: v.optional(v.object({
            last4: v.string(), brand: v.string(), expiry: v.string(), auth_token: v.string(),
        })),
        university: v.optional(v.string()), // For campus program
        created_at: v.number(),
    }).index("by_email", ["email"])
        .index("by_phone", ["phone"])
        .index("by_referral_code", ["referral_code"])
        .index("by_token", ["verification_token"])
        .index("by_referred_by", ["referred_by"])
        .index("by_username", ["username"])
        .index("by_fraud", ["is_fraud_flagged"]),

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
        type: v.optional(v.string()),
        description: v.string(),
        about: v.optional(v.string()),
        rules: v.optional(v.array(v.string())),
        how_it_works: v.optional(v.array(v.string())),
        reward_structure: v.optional(v.string()),
        reward_type: v.optional(v.string()),
        reward_amount: v.optional(v.number()),
        referral_boots: v.optional(v.number()),
        commission_months: v.optional(v.number()),
        start_date: v.any(),
        end_date: v.any(),
        target_goal: v.optional(v.number()),
        current_progress: v.optional(v.number()),
        status: v.string(),
        image_url: v.optional(v.string()),
        banner_url: v.optional(v.string()),
        created_by: v.optional(v.id("users")),
        created_at: v.optional(v.number()),
        // Fraud / limit controls
        max_boots_per_user_per_day: v.optional(v.number()),  // e.g. 50 BOOTS cap per day
        max_referrals_per_user_per_day: v.optional(v.number()), // e.g. 10 referrals counted per day
        max_total_referrals_per_user: v.optional(v.number()), // lifetime cap per user
        require_payment_for_reward: v.optional(v.boolean()),  // only reward after payment
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
        referrer_id: v.id("users"),
        referred_id: v.id("users"),
        status: v.string(),                        // "pending" | "active" | "inactive" | "suspicious"
        is_fraud_flagged: v.optional(v.boolean()),
        fraud_reason: v.optional(v.string()),      // e.g. "same_device" | "same_ip" | "circular"
        commission_earned: v.optional(v.number()),
        months_remaining: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_campaign", ["campaign_id"])
        .index("by_referrer", ["referrer_id"])
        .index("by_referred", ["referred_id"])
        .index("by_fraud", ["is_fraud_flagged"]),

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
        category: v.optional(v.string()), // "Streaming" | "Music" | "Design" | "AI" | "Productivity"
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

    // ── Fraud & Security ──────────────────────────────────────────────────────
    user_fingerprints: defineTable({
        user_id: v.id("users"),
        device_fingerprint: v.optional(v.string()),  // Browser/device hash
        ip_address: v.optional(v.string()),
        user_agent: v.optional(v.string()),
        created_at: v.number(),
        last_seen: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_device", ["device_fingerprint"])
        .index("by_ip", ["ip_address"]),

    fraud_flags: defineTable({
        user_id: v.id("users"),
        type: v.string(),          // "same_device" | "same_ip" | "circular_referral" | "rapid_signup" | "suspicious_withdrawal"
        severity: v.string(),      // "low" | "medium" | "high"
        description: v.string(),
        related_user_ids: v.optional(v.array(v.id("users"))),
        related_campaign_id: v.optional(v.id("campaigns")),
        status: v.string(),        // "open" | "reviewing" | "cleared" | "confirmed"
        reviewed_by: v.optional(v.id("users")),
        created_at: v.number(),
        resolved_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_type", ["type"]),

    // ── Campus Territory Program ──────────────────────────────────────────────
    campus_territories: defineTable({
        campus_name: v.string(),
        city: v.string(),
        country: v.string(),
        leader_id: v.optional(v.id("users")),        // Campus Leader
        total_users: v.optional(v.number()),
        total_ambassadors: v.optional(v.number()),
        total_subscriptions: v.optional(v.number()),
        is_active: v.boolean(),
        created_at: v.number(),
    }).index("by_leader", ["leader_id"]),

    campus_territory_ambassadors: defineTable({
        territory_id: v.id("campus_territories"),
        user_id: v.id("users"),
        role: v.string(),                            // "leader" | "ambassador"
        referral_count: v.optional(v.number()),
        total_earned: v.optional(v.number()),
        is_active: v.boolean(),
        joined_at: v.number(),
    }).index("by_territory", ["territory_id"])
        .index("by_user", ["user_id"]),

    campus_events: defineTable({
        name: v.string(),
        territory_id: v.optional(v.id("campus_territories")),
        campus_name: v.string(),
        city: v.string(),
        event_date: v.number(),
        host_id: v.optional(v.id("users")),          // Campus Leader hosting
        description: v.optional(v.string()),
        type: v.string(),                             // "onboarding" | "referral_comp" | "demo" | "meetup"
        expected_participants: v.optional(v.number()),
        actual_attendance: v.optional(v.number()),
        new_users_acquired: v.optional(v.number()),
        subscriptions_created: v.optional(v.number()),
        status: v.string(),                           // "upcoming" | "ongoing" | "completed" | "cancelled"
        created_by: v.optional(v.id("users")),
        created_at: v.number(),
    }).index("by_territory", ["territory_id"])
        .index("by_status", ["status"])
        .index("by_date", ["event_date"]),
    // ── Admin Workforce System ────────────────────────────────────────────────
    admin_invitations: defineTable({
        email: v.string(),
        role: v.string(),               // "support" | "operations" | "finance" | "campaigns"
        work_username: v.string(),       // e.g. support_jane
        invited_by: v.id("users"),
        token: v.string(),               // Unique invite token
        status: v.string(),              // "pending" | "accepted" | "expired"
        expires_at: v.number(),
        created_at: v.number(),
        accepted_at: v.optional(v.number()),
        accepted_by: v.optional(v.id("users")),
    }).index("by_token", ["token"])
        .index("by_email", ["email"])
        .index("by_status", ["status"]),

    admin_tasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        assigned_to: v.id("users"),      // Admin assigned to
        assigned_by: v.id("users"),      // Super admin who created it
        deadline: v.number(),
        priority: v.string(),            // "low" | "medium" | "high" | "urgent"
        status: v.string(),              // "pending" | "in_progress" | "completed" | "overdue"
        category: v.optional(v.string()), // "support" | "operations" | "finance" | "campaigns" | "general"
        notes: v.optional(v.string()),   // Admin progress notes
        completed_at: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_assignee", ["assigned_to"])
        .index("by_assigner", ["assigned_by"])
        .index("by_status", ["status"]),

    admin_logs: defineTable({
        admin_id: v.id("users"),
        action: v.string(),              // e.g. "approved_withdrawal" | "banned_user" | "created_campaign"
        target_type: v.optional(v.string()), // "user" | "campaign" | "listing" | "withdrawal" | "ticket"
        target_id: v.optional(v.string()), // ID of the affected record
        target_name: v.optional(v.string()), // Human-readable description
        details: v.optional(v.string()), // Extra context
        created_at: v.number(),
    }).index("by_admin", ["admin_id"])
        .index("by_action", ["action"])
        .index("by_created", ["created_at"]),

    admin_notifications: defineTable({
        admin_id: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.string(),                // "task_assigned" | "task_overdue" | "task_due_soon" | "general"
        is_read: v.boolean(),
        related_task_id: v.optional(v.id("admin_tasks")),
        created_at: v.number(),
    }).index("by_admin", ["admin_id"])
        .index("by_read", ["is_read"]),

    // ── Support Chat System ──────────────────────────────────────────────────
    support_conversations: defineTable({
        user_id: v.id("users"),
        assigned_admin_id: v.optional(v.id("users")),
        status: v.string(), // "open" | "closed"
        last_message_at: v.number(),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_admin", ["assigned_admin_id"])
        .index("by_last_message", ["last_message_at"]),

    support_messages: defineTable({
        conversation_id: v.id("support_conversations"),
        sender_id: v.id("users"),
        sender_role: v.string(), // "user" | "admin"
        content: v.string(),
        image_url: v.optional(v.string()), // For attach screenshot
        created_at: v.number(),
    }).index("by_conversation", ["conversation_id"]),

    // ── Campus Applications ──────────────────────────────────────────────────
    campus_applications: defineTable({
        user_id: v.id("users"),
        university: v.string(),
        reason: v.string(),
        social_handle: v.optional(v.string()), // e.g. Instagram/Twitter
        status: v.string(), // "pending" | "approved" | "rejected"
        reviewed_by: v.optional(v.id("users")),
        created_at: v.number(),
        updated_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"]),

    migrated_subscriptions: defineTable({
        user_id: v.id("users"),
        email: v.string(),
        phone: v.string(),
        platform: v.string(),
        profile_name: v.string(),
        payment_day: v.number(),
        last_payment_date: v.string(),
        role: v.string(), // "Group Manager" | "Member"
        group_size: v.optional(v.number()),
        device_count: v.string(),
        device_types: v.array(v.string()),
        status: v.string(),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"])
        .index("by_platform", ["platform"]),
});
