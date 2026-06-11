import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // PILLAR 1: Users
    users: defineTable({
        email: v.string(),
        phone: v.optional(v.string()),
        telegram_chat_id: v.optional(v.string()),
        full_name: v.string(),
        username: v.optional(v.string()),
        qic: v.optional(v.string()),
        work_username: v.optional(v.string()),
        role: v.optional(v.string()), // "subscriber" | "owner" | "admin"
        wallet_balance: v.number(),
        boot_balance: v.optional(v.number()),
        boots_balance: v.optional(v.number()),
        created_at: v.number(),
        q_score: v.number(),
        q_rank: v.optional(v.string()),
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
        last_sign_in_at: v.optional(v.number()),
        last_sign_in_provider: v.optional(v.string()),
        sign_in_history: v.optional(v.array(v.object({
            provider: v.string(),
            signed_in_at: v.number(),
        }))),
        password_hash: v.optional(v.string()),
        verification_token: v.optional(v.string()),
        verification_token_expires: v.optional(v.string()),
        reset_password_token: v.optional(v.string()),
        reset_password_token_expires: v.optional(v.number()),
        verification_deadline: v.optional(v.number()),
        direct_debit_card: v.optional(v.object({
            last4: v.string(),
            brand: v.string(),
            expiry: v.string(),
            auth_token: v.string(),
        })),
        quest_withdrawal_account: v.optional(v.object({
            bank_name: v.string(),
            bank_code: v.optional(v.string()),
            account_number: v.string(),
            account_name: v.string(),
            updated_at: v.number(),
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
        fraud_review_reason: v.optional(v.string()),
        is_admin_suspended: v.optional(v.boolean()),
        admin_suspended_at: v.optional(v.number()),
        accepted_terms: v.optional(v.boolean()),
        accepted_terms_version: v.optional(v.string()),
        accepted_at: v.optional(v.number()),
    }).index("by_email", ["email"])
        .index("by_username", ["username"])
        .index("by_referral_code", ["referral_code"])
        .index("by_referred_by", ["referred_by"])
        .index("by_phone", ["phone"])
        .index("by_token", ["verification_token"])
        .index("by_qic", ["qic"])
        .index("by_reset_password_token", ["reset_password_token"])
        .index("by_is_admin", ["is_admin"])
        .index("by_work_username", ["work_username"])
        .index("by_fraud", ["is_fraud_flagged"]),

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
        instructions_text: v.optional(v.string()),
        instructions_image_url: v.optional(v.string()),
        category: v.optional(v.string()),
        request_id: v.optional(v.string()),
    }).index("by_owner", ["owner_id"])
        .index("by_status", ["status"])
        .index("by_request_id", ["request_id"]),

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
        auto_renew: v.optional(v.boolean()),
        removal_scheduled_at: v.optional(v.number()),
        created_at: v.optional(v.number()),
    }).index("by_subscription", ["subscription_id"])
        .index("by_user", ["user_id"])
        .index("by_group", ["group_id"])
        .index("by_status", ["status"]),

    canceled_subscriptions: defineTable({
        user_id: v.optional(v.id("users")),
        user_name: v.optional(v.string()),
        user_email: v.optional(v.string()),
        source_type: v.string(),
        source_id: v.string(),
        subscription_name: v.optional(v.string()),
        slot_name: v.optional(v.string()),
        platform: v.optional(v.string()),
        account_email: v.optional(v.string()),
        price: v.optional(v.number()),
        renewal_date: v.optional(v.string()),
        reason: v.optional(v.string()),
        canceled_by: v.optional(v.id("users")),
        canceled_at: v.number(),
        restored_by: v.optional(v.id("users")),
        restored_at: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_source", ["source_type", "source_id"])
        .index("by_canceled_at", ["canceled_at"]),

    // PILLAR 4: Wallets
    wallets: defineTable({
        user_id: v.id("users"),
        q_wallet_balance: v.number(),
        quest_wallet_balance: v.number(),
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_user", ["user_id"]),

    // PILLAR 5: Wallet Transactions
    wallet_transactions: defineTable({
        user_id: v.id("users"),
        amount: v.number(),
        type: v.string(),
        source: v.optional(v.string()),
        wallet_type: v.optional(v.string()),
        reference: v.optional(v.string()),
        status: v.string(),
        description: v.optional(v.string()),
        related_quest_id: v.optional(v.id("quests")),
        fee: v.optional(v.number()),
        wallet_balance: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_type", ["type"])
        .index("by_status", ["status"])
        .index("by_reference", ["reference"]),

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
        auto_renew: v.optional(v.boolean()),
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

        // ─── QUEUE MARKETPLACE SYSTEM ────────────────────────────────────────
        queues: defineTable({
            // Creator info
            creator_id: v.id("users"), // who created (user or admin)
            admin_id: v.optional(v.id("users")), // reviewing admin
        
            // Service details
            service_name: v.string(),
            description: v.string(),
            category: v.string(),
            service_image_url: v.optional(v.string()),
            notes: v.optional(v.string()), // creator's notes
        
            // Queue stage
            stage: v.string(), // "interest" | "official"
        
            // Pricing & capacity
            total_cost: v.number(),
            max_members: v.number(),
            current_members: v.number(),
            current_price_per_member: v.number(),
            service_fee: v.optional(v.number()), // Q service fee
        
            // Queue status
            status: v.string(), // "interest", "active", "full", "closed", "cancelled"
            visibility: v.boolean(), // whether queue is visible in marketplace
            closing_date: v.number(), // timestamp
        
            // Metadata
            created_at: v.number(),
            updated_at: v.number(),
            completed_at: v.optional(v.number()),
            cancelled_reason: v.optional(v.string()),
        }).index("by_admin", ["admin_id"])
            .index("by_creator", ["creator_id"])
            .index("by_stage", ["stage"])
            .index("by_status", ["status"])
            .index("by_category", ["category"])
            .index("by_visibility", ["visibility"])
            .index("by_closing_date", ["closing_date"]),

        queue_plans: defineTable({
            queue_id: v.id("queues"),
            name: v.string(), // e.g. "Grok Lite", "Grok Pro"
            price: v.number(), // base price per month
            description: v.optional(v.string()),
            max_members: v.number(),
            current_members: v.number(),
            created_at: v.number(),
        }).index("by_queue", ["queue_id"])
            .index("by_queue_name", ["queue_id", "name"]),

        queue_members: defineTable({
            queue_id: v.id("queues"),
            user_id: v.id("users"),
            status: v.string(), // "pending", "approved", "rejected", "left"
            plan_id: v.optional(v.id("queue_plans")), // selected plan
            join_date: v.number(),
            approved_date: v.optional(v.number()),
            approved_by: v.optional(v.id("users")), // admin who approved
            member_notes: v.optional(v.string()),
        }).index("by_queue", ["queue_id"])
            .index("by_user", ["user_id"])
            .index("by_status", ["status"])
            .index("by_plan", ["plan_id"])
            .index("by_queue_user", ["queue_id", "user_id"]),

        queue_invitations: defineTable({
            // Invitation details
            queue_id: v.id("queues"),
            sender_id: v.id("users"), // admin who sent
            recipient_id: v.id("users"),
        
            // Invitation status
            status: v.string(), // "pending", "accepted", "declined", "expired"
            message: v.optional(v.string()),
            expires_at: v.number(),
        
            // Timeline
            sent_at: v.number(),
            responded_at: v.optional(v.number()),
        
            // Notifications
            email_sent: v.boolean(),
            in_app_notification_id: v.optional(v.id("notifications")),
        }).index("by_queue", ["queue_id"])
            .index("by_recipient", ["recipient_id"])
            .index("by_status", ["status"])
            .index("by_sender", ["sender_id"])
            .index("by_expires_at", ["expires_at"]),

        queue_announcements: defineTable({
            queue_id: v.id("queues"),
            admin_id: v.id("users"),
            title: v.string(),
            message: v.string(),
            sent_to_all: v.boolean(),
            created_at: v.number(),
        }).index("by_queue", ["queue_id"])
            .index("by_admin", ["admin_id"]),

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
        request_id: v.optional(v.string()),
    }).index("by_catalog", ["subscription_catalog_id"])
        .index("by_listing_key", ["subscription_catalog_id", "account_email", "billing_cycle_start", "plan_owner"])
        .index("by_request_id", ["request_id"]),

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
        purpose: v.optional(v.string()),
        task_id: v.optional(v.id("tasks")),
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
        task_id: v.optional(v.id("tasks")),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    tasks: defineTable({
        creatorUserId: v.id("users"),
        title: v.string(),
        platform: v.optional(v.string()),
        targetLocation: v.optional(v.string()),
        taskType: v.optional(v.string()),
        type: v.string(),
        description: v.string(),
        instructions: v.string(),
        externalUrl: v.optional(v.string()),
        bootsReward: v.number(),
        requiredCompletions: v.number(),
        completedCount: v.number(),
        proofType: v.string(),
        deadline: v.number(),
        totalCost: v.number(),
        paymentSource: v.string(),
        status: v.string(),
        createdAt: v.number(),
        reviewedAt: v.optional(v.number()),
        reviewedBy: v.optional(v.id("users")),
        adminNote: v.optional(v.string()),
    }).index("by_status", ["status"])
        .index("by_creator", ["creatorUserId"])
        .index("by_deadline", ["deadline"]),

    quests: defineTable({
        creatorId: v.id("users"),
        title: v.string(),
        description: v.string(),
        questLink: v.string(),
        instructions: v.string(),
        proofRequirement: v.string(),
        coverImageUrl: v.optional(v.string()),
        request_id: v.optional(v.string()),
        category: v.optional(v.string()),
        location: v.optional(v.string()),
        audienceType: v.optional(v.string()),
        rewardPerUser: v.number(),
        totalBudget: v.number(),
        serviceFee: v.optional(v.number()),
        paymentAmount: v.optional(v.number()),
        totalSlots: v.number(),
        usedSlots: v.number(),
        paymentStatus: v.string(), // "pending", "paid", "failed"
        paymentMethod: v.optional(v.string()), // "q_wallet", "paystack"
        paymentReference: v.optional(v.string()),
        status: v.string(), // "draft", "pending_payment", "live", "pending_review", "paused", "rejected", "completed"
        isFeatured: v.optional(v.boolean()),
        adminNote: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_status", ["status"])
        .index("by_creator", ["creatorId"])
        .index("by_payment_reference", ["paymentReference"])
        .index("by_request_id", ["request_id"]),

    quest_completions: defineTable({
        questId: v.id("quests"),
        userId: v.id("users"),
        proofUrl: v.optional(v.string()),
        proofText: v.optional(v.string()),
        status: v.string(), // "pending_review", "approved", "rejected", "paid"
        payoutReference: v.optional(v.string()),
        creditedAt: v.optional(v.number()),
        adminNote: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_quest", ["questId"])
        .index("by_user", ["userId"])
        .index("by_status", ["status"])
        .index("by_quest_user", ["questId", "userId"]),

    task_submissions: defineTable({
        taskId: v.id("tasks"),
        userId: v.id("users"),
        proofType: v.string(),
        proofValue: v.optional(v.string()),
        screenshotUrl: v.optional(v.string()),
        status: v.string(),
        submittedAt: v.number(),
        reviewedAt: v.optional(v.number()),
        reviewedBy: v.optional(v.id("users")),
        adminNote: v.optional(v.string()),
    }).index("by_task", ["taskId"])
        .index("by_user", ["userId"])
        .index("by_status", ["status"]),

    support_conversations: defineTable({
        user_id: v.id("users"),
        status: v.string(),
        assigned_admin_id: v.optional(v.id("users")),
        handled_by: v.optional(v.string()), // "ai" | "agent"
        issue_category: v.optional(v.string()),
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
        image_url: v.optional(v.string()),
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
        updated_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_admin", ["assigned_admin_id"])
        .index("by_status", ["status"]),

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
        about: v.optional(v.string()),
        reward_structure: v.optional(v.string()),
        how_it_works: v.optional(v.array(v.string())),
        rules: v.optional(v.array(v.string())),
        referral_boots: v.optional(v.number()),
        commission_months: v.optional(v.number()),
        // Fraud / limit controls
        max_boots_per_user_per_day: v.optional(v.number()),
        max_referrals_per_user_per_day: v.optional(v.number()),
        max_total_referrals_per_user: v.optional(v.number()),
        require_payment_for_reward: v.optional(v.boolean()),
        banner_url: v.optional(v.string()),
        image_url: v.optional(v.string()),
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
        referrer_id: v.optional(v.id("users")),
        referral_code: v.optional(v.string()),
    }).index("by_campaign", ["campaign_id"]).index("by_user", ["user_id"]),

    // --- ADDITIONAL TABLES FOR ADMIN WORKFORCE & OTHER FEATURES ---
    admin_tasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        priority: v.string(),
        assigned_to: v.optional(v.id("users")),
        assigned_admin_id: v.optional(v.id("users")),
        created_by: v.optional(v.id("users")),
        completed_at: v.optional(v.number()),
        deadline: v.number(),
        created_at: v.number(),
        updated_at: v.optional(v.number()),
        assigned_by: v.optional(v.id("users")),
    }).index("by_status", ["status"])
        .index("by_assignee", ["assigned_to"])
        .index("by_admin", ["assigned_admin_id"]),



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

    campaign_referrals: defineTable({
        campaign_id: v.id("campaigns"),
        referrer_id: v.id("users"),
        referred_id: v.id("users"),
        status: v.string(),
        is_fraud_flagged: v.optional(v.boolean()),
        fraud_reason: v.optional(v.string()),
        months_remaining: v.optional(v.number()),
        commission_earned: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_referrer", ["referrer_id"])
        .index("by_campaign", ["campaign_id"])
        .index("by_referred", ["referred_id"])
        .index("by_created_at", ["created_at"])
        .index("by_fraud", ["is_fraud_flagged"]),

    fraud_flags: defineTable({
        user_id: v.id("users"),
        reason: v.optional(v.string()),
        status: v.string(),
        severity: v.optional(v.string()),
        type: v.optional(v.string()),
        description: v.optional(v.string()),
        related_user_ids: v.optional(v.array(v.id("users"))),
        related_campaign_id: v.optional(v.id("campaigns")),
        reviewed_by: v.optional(v.id("users")),
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
        last_used: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    lunar_memories: defineTable({
        user_id: v.optional(v.id("users")),
        memory_type: v.optional(v.string()),
        content: v.optional(v.string()),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        platform: v.optional(v.string()),
        genre: v.optional(v.string()),
        added_by: v.optional(v.id("users")),
        created_at: v.number(),
    }).index("by_user", ["user_id"]),

    lunar_subscriptions: defineTable({
        user_id: v.id("users"),
        subscription_id: v.optional(v.id("subscriptions")),
        status: v.string(),
        expiry_date: v.optional(v.string()),
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

    // Marketplace - consolidated table for marketplace listings (replaces groups for marketplace data)
    marketplace: defineTable({
        // Core listing info
        subscription_catalog_id: v.id("subscription_catalog"),
        owner_user_id: v.optional(v.id("users")), // Original listing owner (if user-submitted)
        admin_creator_id: v.optional(v.id("users")), // Admin who created (if admin-created)

        // Listing details
        platform_name: v.string(),
        account_email: v.string(),
        plan_owner: v.string(), // "admin" or username
        billing_cycle_start: v.string(),
        status: v.string(), // "active", "paused", "closed"

        // Capacity tracking (denormalized for performance)
        total_slots: v.number(),
        filled_slots: v.number(),
        available_slots: v.number(),

        // Pricing
        slot_price: v.number(),
        owner_payout: v.optional(v.number()),

        // Metadata
        category: v.optional(v.string()),
        admin_note: v.optional(v.string()),
        request_id: v.optional(v.string()), // For idempotency
        display_order: v.optional(v.number()),

        // Timestamps
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_catalog", ["subscription_catalog_id"])
        .index("by_status", ["status"])
        .index("by_owner", ["owner_user_id"])
        .index("by_request_id", ["request_id"])
        .index("by_account_email", ["account_email"]),

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

    user_fingerprints: defineTable({
        user_id: v.id("users"),
        device_fingerprint: v.optional(v.string()),
        ip_address: v.optional(v.string()),
        user_agent: v.optional(v.string()),
        created_at: v.number(),
        last_seen: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_device", ["device_fingerprint"])
        .index("by_ip", ["ip_address"]),

    campaign_withdrawals: defineTable({
        user_id: v.id("users"),
        campaign_id: v.id("campaigns"),
        amount: v.number(),
        status: v.string(),
        bank_name: v.string(),
        account_number: v.string(),
        account_name: v.string(),
        admin_note: v.optional(v.string()),
        processed_at: v.optional(v.number()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"]),

    // PILLAR 9: Campus Program
    campus_territories: defineTable({
        campus_name: v.string(),
        city: v.string(),
        country: v.string(),
        leader_id: v.optional(v.id("users")),
        total_users: v.optional(v.number()),
        total_ambassadors: v.optional(v.number()),
        total_subscriptions: v.optional(v.number()),
        is_active: v.boolean(),
        created_at: v.number(),
    }).index("by_campus", ["campus_name"]),

    campus_territory_ambassadors: defineTable({
        territory_id: v.id("campus_territories"),
        user_id: v.id("users"),
        role: v.string(),
        referral_count: v.number(),
        total_earned: v.number(),
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
        host_id: v.optional(v.id("users")),
        description: v.optional(v.string()),
        type: v.string(),
        expected_participants: v.optional(v.number()),
        actual_attendance: v.optional(v.number()),
        new_users_acquired: v.optional(v.number()),
        subscriptions_created: v.optional(v.number()),
        status: v.string(),
        created_by: v.optional(v.id("users")),
        created_at: v.number(),
    }).index("by_status", ["status"])
        .index("by_territory", ["territory_id"]),

    campus_applications: defineTable({
        user_id: v.id("users"),
        university: v.string(),
        social_handle: v.optional(v.string()),
        reason: v.string(),
        status: v.string(),
        reviewed_by: v.optional(v.id("users")),
        created_at: v.number(),
        updated_at: v.optional(v.number()),
    }).index("by_user", ["user_id"])
        .index("by_status", ["status"]),

    platform_settings: defineTable({
        key: v.string(),
        value: v.any(),
        updated_at: v.number(),
        updated_by: v.optional(v.id("users")),
    }).index("by_key", ["key"]),

    notifications: defineTable({
        user_id: v.optional(v.id("users")),
        title: v.string(),
        message: v.string(),
        type: v.string(),
        cta_text: v.optional(v.string()),
        cta_url: v.optional(v.string()),
        is_read: v.boolean(),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_read", ["user_id", "is_read"]),

    subscription_notification_templates: defineTable({
        key: v.string(),
        title: v.string(),
        message: v.string(),
        cta_text: v.optional(v.string()),
        cta_url: v.optional(v.string()),
        channels: v.array(v.string()),
        updated_at: v.number(),
        updated_by: v.optional(v.id("users")),
    }).index("by_key", ["key"]),

    subscription_notification_logs: defineTable({
        slot_id: v.id("subscription_slots"),
        user_id: v.id("users"),
        event_key: v.string(),
        cycle_due_date: v.string(),
        send_date: v.string(),
        notification_id: v.optional(v.id("notifications")),
        title: v.string(),
        message: v.string(),
        cta_text: v.optional(v.string()),
        cta_url: v.optional(v.string()),
        channels: v.any(),
        status: v.string(),
        created_at: v.number(),
    }).index("by_slot_event_cycle", ["slot_id", "event_key", "cycle_due_date"])
        .index("by_slot_event_send_date", ["slot_id", "event_key", "send_date"])
        .index("by_created_at", ["created_at"]),

    // ─── ENHANCED ADMIN SYSTEM ────────────────────────────────────────────────

    // Admin Activity Logs
    push_subscriptions: defineTable({
        user_id: v.id("users"),
        endpoint: v.string(),
        expiration_time: v.optional(v.number()),
        p256dh: v.string(),
        auth: v.string(),
        user_agent: v.optional(v.string()),
        created_at: v.number(),
        updated_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_endpoint", ["endpoint"]),

    user_login_logs: defineTable({
        user_id: v.id("users"),
        provider: v.string(),
        ip_address: v.optional(v.string()),
        user_agent: v.optional(v.string()),
        success: v.boolean(),
        failure_reason: v.optional(v.string()),
        created_at: v.number(),
    }).index("by_user", ["user_id"])
        .index("by_created_at", ["created_at"]),

    admin_logs: defineTable({
        admin_id: v.id("users"),
        admin_role: v.optional(v.string()),
        action_type: v.optional(v.string()),
        action: v.optional(v.string()),
        target_type: v.optional(v.string()),
        target_id: v.optional(v.string()),
        target_name: v.optional(v.string()),
        details: v.optional(v.string()),
        reason: v.optional(v.string()),
        metadata: v.optional(v.any()),
        created_at: v.number(),
    }).index("by_admin", ["admin_id"])
        .index("by_action_type", ["action_type"])
        .index("by_created_at", ["created_at"])
        .index("by_target", ["target_type", "target_id"]),

    // Slot Waitlist
    slot_waitlist: defineTable({
        user_id: v.id("users"),
        subscription_catalog_id: v.id("subscription_catalog"),
        slot_type_id: v.optional(v.id("slot_types")),
        status: v.string(),
        priority: v.optional(v.number()),
        notes: v.optional(v.string()),
        added_by: v.optional(v.id("users")),
        added_at: v.number(),
        expires_at: v.optional(v.number()),
        filled_at: v.optional(v.number()),
        filled_slot_id: v.optional(v.id("subscription_slots")),
    }).index("by_user", ["user_id"])
        .index("by_subscription", ["subscription_catalog_id"])
        .index("by_status", ["status"]),

    // Payment Overrides
    payment_overrides: defineTable({
        slot_id: v.id("subscription_slots"),
        user_id: v.id("users"),
        original_status: v.string(),
        new_status: v.string(),
        original_amount: v.optional(v.number()),
        override_amount: v.optional(v.number()),
        admin_id: v.id("users"),
        admin_note: v.optional(v.string()),
        reason: v.string(),
        created_at: v.number(),
    }).index("by_slot", ["slot_id"])
        .index("by_user", ["user_id"])
        .index("by_admin", ["admin_id"]),

    // Group Management Logs
    group_changes: defineTable({
        group_id: v.id("groups"),
        user_id: v.optional(v.id("users")),
        action: v.string(),
        from_group_id: v.optional(v.id("groups")),
        to_group_id: v.optional(v.id("groups")),
        admin_id: v.id("users"),
        reason: v.optional(v.string()),
        metadata: v.optional(v.any()),
        created_at: v.number(),
    }).index("by_group", ["group_id"])
        .index("by_user", ["user_id"])
        .index("by_admin", ["admin_id"]),

    // Admin Roles & Permissions
    admin_roles: defineTable({
        role_name: v.string(),
        permissions: v.array(v.string()),
        description: v.optional(v.string()),
        created_at: v.number(),
        updated_at: v.optional(v.number()),
    }).index("by_role_name", ["role_name"]),

    // Bulk Operations Queue
    bulk_operations: defineTable({
        admin_id: v.id("users"),
        operation_type: v.string(),
        status: v.string(),
        total_items: v.number(),
        processed_items: v.number(),
        failed_items: v.number(),
        metadata: v.optional(v.any()),
        created_at: v.number(),
        completed_at: v.optional(v.number()),
        results: v.optional(v.any()),
    }).index("by_admin", ["admin_id"])
        .index("by_status", ["status"]),
    // Promotional Notifications (Admin Dashboard)
    promotional_notifications: defineTable({
        title: v.string(),
        message: v.string(),
        target: v.string(), // "all", "active_subscribers", "inactive_users"
        type: v.string(), // "promotion", "alert", "update"
        scheduled_for: v.optional(v.number()),
        sent_at: v.optional(v.number()),
        status: v.string(), // "draft", "scheduled", "sent", "cancelled"
        created_by: v.id("users"),
        created_at: v.number(),
        scheduled_id: v.optional(v.id("_scheduled_functions")), // ID for the scheduled task in Convex
    }).index("by_status", ["status"])
      .index("by_scheduled_for", ["scheduled_for"]),
});

