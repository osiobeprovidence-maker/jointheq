import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** List all campaigns */
export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("campaigns").collect();
    },
});

/** Get active campaigns only */
export const getActive = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("campaigns")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();
    },
});

/** Get a single campaign by ID */
export const getById = query({
    args: { id: v.id("campaigns") },
    handler: async (ctx, { id }) => {
        const campaign = await ctx.db.get(id);
        if (!campaign) return null;
        const creator = campaign.created_by ? await ctx.db.get(campaign.created_by) : null;
        const participants = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", id))
            .collect();
        return { ...campaign, creator_name: creator?.full_name ?? "Admin", participant_count: participants.length };
    },
});

/** Get participant record for a specific user + campaign */
export const getParticipant = query({
    args: { campaign_id: v.id("campaigns"), user_id: v.any() },
    handler: async (ctx, args) => {
        if (!args.user_id) return null;
        try {
            return await ctx.db
                .query("campaign_participants")
                .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
                .filter((q) => q.eq(q.field("user_id"), args.user_id))
                .first();
        } catch { return null; }
    },
});

/** Get leaderboard for a campaign (top 20 by referral count) */
export const getLeaderboard = query({
    args: { campaign_id: v.id("campaigns") },
    handler: async (ctx, { campaign_id }) => {
        const participants = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        const enriched = await Promise.all(
            participants.map(async (p) => {
                const user = await ctx.db.get(p.user_id);
                return {
                    ...p,
                    full_name: user?.full_name ?? "Unknown",
                    username: user?.username ?? "",
                    avatar: user?.full_name?.[0] ?? "?",
                };
            })
        );

        // Sort by referral_count desc, then boots_earned
        return enriched
            .sort((a, b) => ((b.referral_count ?? 0) - (a.referral_count ?? 0)) || ((b.boots_earned ?? 0) - (a.boots_earned ?? 0)))
            .slice(0, 20);
    },
});

/** Get friends (people referred) by a user in a campaign */
export const getMyReferrals = query({
    args: { campaign_id: v.id("campaigns"), user_id: v.id("users") },
    handler: async (ctx, { campaign_id, user_id }) => {
        const referrals = await ctx.db
            .query("campaign_referrals")
            .withIndex("by_referrer", (q) => q.eq("referrer_id", user_id))
            .filter((q) => q.eq(q.field("campaign_id"), campaign_id))
            .collect();

        return await Promise.all(
            referrals.map(async (r) => {
                const user = await ctx.db.get(r.referred_id);
                const participant = await ctx.db
                    .query("campaign_participants")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
                    .filter((q) => q.eq(q.field("user_id"), r.referred_id))
                    .first();
                return {
                    ...r,
                    full_name: user?.full_name ?? "Unknown",
                    username: user?.username ?? "",
                    referral_count: participant?.referral_count ?? 0,
                    boots_earned: participant?.boots_earned ?? 0,
                    status: r.status,
                };
            })
        );
    },
});

/** Get my stats in a campaign */
export const getMyStats = query({
    args: { campaign_id: v.id("campaigns"), user_id: v.id("users") },
    handler: async (ctx, { campaign_id, user_id }) => {
        const participant = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .filter((q) => q.eq(q.field("user_id"), user_id))
            .first();
        if (!participant) return null;

        // Rank
        const all = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();
        const sorted = all.sort((a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0));
        const rank = sorted.findIndex((p) => p.user_id === user_id) + 1;

        return { ...participant, rank, total_participants: all.length };
    },
});

/** Admin: full analytics for a campaign */
export const getAnalytics = query({
    args: { campaign_id: v.id("campaigns") },
    handler: async (ctx, { campaign_id }) => {
        const participants = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        const referrals = await ctx.db
            .query("campaign_referrals")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        const totalBoots = participants.reduce((s, p) => s + (p.boots_earned ?? 0), 0);
        const totalCash = participants.reduce((s, p) => s + (p.cash_earned ?? 0), 0);
        const totalReferrals = referrals.length;
        const activeReferrals = referrals.filter((r) => r.status === "active").length;

        // Top referrers
        const enriched = await Promise.all(
            participants.map(async (p) => {
                const u = await ctx.db.get(p.user_id);
                return { ...p, full_name: u?.full_name ?? "Unknown", email: u?.email ?? "" };
            })
        );
        const topReferrers = enriched
            .sort((a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0))
            .slice(0, 5);

        return {
            total_participants: participants.length,
            total_referrals: totalReferrals,
            active_referrals: activeReferrals,
            total_boots_distributed: totalBoots,
            total_cash_distributed: totalCash,
            top_referrers: topReferrers,
        };
    },
});

/** Admin: get ALL campaign analytics summary */
export const getAllAnalytics = query({
    handler: async (ctx) => {
        const campaigns = await ctx.db.query("campaigns").collect();
        return await Promise.all(
            campaigns.map(async (c) => {
                const participants = await ctx.db
                    .query("campaign_participants")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", c._id))
                    .collect();
                const referrals = await ctx.db
                    .query("campaign_referrals")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", c._id))
                    .collect();
                return {
                    ...c,
                    participant_count: participants.length,
                    referral_count: referrals.length,
                    total_boots: participants.reduce((s, p) => s + (p.boots_earned ?? 0), 0),
                    total_cash: participants.reduce((s, p) => s + (p.cash_earned ?? 0), 0),
                };
            })
        );
    },
});

/** Get withdrawal requests (admin) */
export const getWithdrawals = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, { status }) => {
        let q = ctx.db.query("campaign_withdrawals");
        const results = status
            ? await (q as any).withIndex("by_status", (qi: any) => qi.eq("status", status)).collect()
            : await q.collect();

        return await Promise.all(
            results.map(async (w: any) => {
                const user = (await ctx.db.get(w.user_id as Id<"users">)) as any;
                const campaign = (await ctx.db.get(w.campaign_id as Id<"campaigns">)) as any;
                return {
                    ...w,
                    full_name: user?.full_name ?? "Unknown",
                    email: user?.email ?? "",
                    campaign_name: campaign?.name ?? "",
                };
            })
        );
    },
});

/** Get my withdrawal requests */
export const getMyWithdrawals = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, { user_id }) => {
        return await ctx.db
            .query("campaign_withdrawals")
            .withIndex("by_user", (q) => q.eq("user_id", user_id))
            .collect();
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Admin: Create a full campaign */
export const create = mutation({
    args: {
        name: v.string(),
        type: v.string(),
        description: v.string(),
        about: v.optional(v.string()),
        rules: v.optional(v.array(v.string())),
        how_it_works: v.optional(v.array(v.string())),
        reward_structure: v.optional(v.string()),
        reward_type: v.string(),
        reward_amount: v.number(),
        referral_boots: v.optional(v.number()),
        commission_months: v.optional(v.number()),
        start_date: v.any(),
        end_date: v.any(),
        target_goal: v.number(),
        image_url: v.optional(v.string()),
        banner_url: v.optional(v.string()),
        created_by: v.optional(v.id("users")),
        // Fraud / limit controls
        max_boots_per_user_per_day: v.optional(v.number()),
        max_referrals_per_user_per_day: v.optional(v.number()),
        max_total_referrals_per_user: v.optional(v.number()),
        require_payment_for_reward: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("campaigns", {
            ...args,
            current_progress: 0,
            status: "active",
            referral_boots: args.referral_boots ?? 5,
            commission_months: args.commission_months ?? 3,
            created_at: Date.now(),
        });
    },
});

/** Admin: Edit a campaign */
export const editCampaign = mutation({
    args: {
        id: v.id("campaigns"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        about: v.optional(v.string()),
        rules: v.optional(v.array(v.string())),
        how_it_works: v.optional(v.array(v.string())),
        reward_structure: v.optional(v.string()),
        reward_type: v.optional(v.string()),
        reward_amount: v.optional(v.number()),
        referral_boots: v.optional(v.number()),
        target_goal: v.optional(v.number()),
        end_date: v.optional(v.any()),
        image_url: v.optional(v.string()),
        banner_url: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...updates }) => {
        // Remove undefined values
        const patch = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        await ctx.db.patch(id, patch);
    },
});

/** Admin: Update status (pause, end, archive) */
export const updateStatus = mutation({
    args: { id: v.id("campaigns"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

/** Join a campaign (optionally with a referral code) — with full fraud protection */
export const participate = mutation({
    args: {
        campaign_id: v.id("campaigns"),
        user_id: v.id("users"),
        referrer_id: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaign_id);
        if (!campaign || campaign.status !== "active") throw new Error("Campaign is not active");

        // ── 1. Block fraud-flagged users from earning ──────────────────────────
        const user = await ctx.db.get(args.user_id);
        if (!user) throw new Error("User not found");
        if (user.is_banned) throw new Error("Your account has been banned");
        if (user.is_suspended) throw new Error("Your account is suspended. Contact support.");

        // ── 2. Check already joined ────────────────────────────────────────────
        const existing = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .first();
        if (existing) return existing._id;

        // ── 3. Self-referral block ─────────────────────────────────────────────
        if (args.referrer_id && args.referrer_id === args.user_id) {
            throw new Error("You cannot refer yourself");
        }

        // ── 4. Check referrer daily limit ──────────────────────────────────────
        let effectiveReferrerId = args.referrer_id;
        if (args.referrer_id) {
            const dayStart = new Date();
            dayStart.setHours(0, 0, 0, 0);
            const maxPerDay = campaign.max_referrals_per_user_per_day ?? 50;

            const todayReferrals = await ctx.db
                .query("campaign_referrals")
                .withIndex("by_referrer", (q) => q.eq("referrer_id", args.referrer_id!))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("campaign_id"), args.campaign_id),
                        q.gte(q.field("created_at"), dayStart.getTime())
                    )
                )
                .collect();

            if (todayReferrals.length >= maxPerDay) {
                // Don't reward referrer today, but still let user join
                effectiveReferrerId = undefined;
            }

            // ── 5. Check lifetime cap ──────────────────────────────────────────
            if (effectiveReferrerId && campaign.max_total_referrals_per_user) {
                const totalReferrals = await ctx.db
                    .query("campaign_referrals")
                    .withIndex("by_referrer", (q) => q.eq("referrer_id", args.referrer_id!))
                    .filter((q) => q.eq(q.field("campaign_id"), args.campaign_id))
                    .collect();
                if (totalReferrals.length >= campaign.max_total_referrals_per_user) {
                    effectiveReferrerId = undefined;
                }
            }
        }

        // ── 6. Generate referral code ──────────────────────────────────────────
        const referralCode = `${args.user_id.slice(-6).toUpperCase()}-${args.campaign_id.slice(-4).toUpperCase()}`;

        // ── 7. Join campaign ───────────────────────────────────────────────────
        const participantId = await ctx.db.insert("campaign_participants", {
            campaign_id: args.campaign_id,
            user_id: args.user_id,
            referrer_id: effectiveReferrerId,
            referral_code: referralCode,
            progress: 0,
            entries: 1,
            referral_count: 0,
            boots_earned: 0,
            cash_earned: 0,
            joined_at: Date.now(),
            last_active: Date.now(),
        });

        // ── 8. Credit referral if all checks pass ──────────────────────────────
        if (effectiveReferrerId) {
            const referrer = await ctx.db.get(effectiveReferrerId);
            // Block if referrer is flagged
            const canReward = !referrer?.is_fraud_flagged && !referrer?.is_suspended;

            // Circular check (non-blocking for now — just detect)
            const chain: string[] = [effectiveReferrerId];
            let current: string = effectiveReferrerId;
            for (let i = 0; i < 8; i++) {
                const prev = await ctx.db
                    .query("campaign_referrals")
                    .withIndex("by_referred", (q) => q.eq("referred_id", current as any))
                    .filter((q) => q.eq(q.field("campaign_id"), args.campaign_id))
                    .first();
                if (!prev) break;
                chain.push(prev.referrer_id);
                current = prev.referrer_id;
            }
            const isCircular = chain.includes(args.user_id);

            // Determine fraud status for this referral
            let referralStatus = "active";
            let isFraudFlagged = false;
            let fraudReason = "";

            if (isCircular) {
                referralStatus = "suspicious";
                isFraudFlagged = true;
                fraudReason = "circular_referral";
                // Flag both users
                for (const uid of [effectiveReferrerId, args.user_id]) {
                    await ctx.db.insert("fraud_flags", {
                        user_id: uid as any,
                        type: "circular_referral",
                        severity: "high",
                        description: `Circular referral chain in campaign: ${campaign.name}`,
                        related_campaign_id: args.campaign_id,
                        status: "open",
                        created_at: Date.now(),
                    });
                }
            }

            // Record referral
            await ctx.db.insert("campaign_referrals", {
                campaign_id: args.campaign_id,
                referrer_id: effectiveReferrerId,
                referred_id: args.user_id,
                status: referralStatus,
                is_fraud_flagged: isFraudFlagged,
                fraud_reason: fraudReason || undefined,
                commission_earned: 0,
                months_remaining: campaign.commission_months ?? 3,
                created_at: Date.now(),
            });

            // Only reward non-fraudulent referrals
            if (canReward && !isCircular) {
                const bootsPerReferral = campaign.referral_boots ?? 5;

                // Update referrer participant record
                const referrerParticipant = await ctx.db
                    .query("campaign_participants")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
                    .filter((q) => q.eq(q.field("user_id"), effectiveReferrerId as any))
                    .first();

                if (referrerParticipant) {
                    const todayBoots = referrerParticipant.boots_earned ?? 0;
                    const maxBootsToday = campaign.max_boots_per_user_per_day ?? 9999;

                    // Only credit if under daily BOOTS cap
                    if (todayBoots < maxBootsToday) {
                        const actualBoots = Math.min(bootsPerReferral, maxBootsToday - todayBoots);
                        await ctx.db.patch(referrerParticipant._id, {
                            referral_count: (referrerParticipant.referral_count ?? 0) + 1,
                            boots_earned: (referrerParticipant.boots_earned ?? 0) + actualBoots,
                            last_active: Date.now(),
                        });

                        // Credit to main wallet
                        if (referrer) {
                            await ctx.db.patch(effectiveReferrerId, {
                                boots_balance: (referrer.boots_balance ?? 0) + actualBoots,
                            });
                            await ctx.db.insert("boot_transactions", {
                                user_id: effectiveReferrerId,
                                amount: actualBoots,
                                type: "campaign_referral",
                                description: `Referral bonus from: ${campaign.name}`,
                                created_at: Date.now(),
                            });
                        }
                    }
                }

                // Rapid referral detection
                const windowMs = 30 * 60 * 1000;
                const recentInWindow = await ctx.db
                    .query("campaign_referrals")
                    .withIndex("by_referrer", (q) => q.eq("referrer_id", effectiveReferrerId as any))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("campaign_id"), args.campaign_id),
                            q.gte(q.field("created_at"), Date.now() - windowMs)
                        )
                    )
                    .collect();

                if (recentInWindow.length > 10) {
                    const existingRapidFlag = await ctx.db
                        .query("fraud_flags")
                        .withIndex("by_user", (q) => q.eq("user_id", effectiveReferrerId as any))
                        .filter((q) => q.eq(q.field("type"), "rapid_signup"))
                        .first();
                    if (!existingRapidFlag) {
                        await ctx.db.insert("fraud_flags", {
                            user_id: effectiveReferrerId as any,
                            type: "rapid_signup",
                            severity: "high",
                            description: `${recentInWindow.length} referrals in 30 minutes — possible bot`,
                            related_campaign_id: args.campaign_id,
                            status: "open",
                            created_at: Date.now(),
                        });
                        await ctx.db.patch(effectiveReferrerId as any, {
                            is_fraud_flagged: true,
                            fraud_review_reason: "Suspicious rapid referral activity",
                        });
                    }
                }
            }
        }

        // ── 9. Update campaign progress ────────────────────────────────────────
        await ctx.db.patch(args.campaign_id, {
            current_progress: (campaign.current_progress ?? 0) + 1,
        });

        return participantId;
    },
});

/** Request a withdrawal (user) */
export const requestWithdrawal = mutation({
    args: {
        user_id: v.id("users"),
        campaign_id: v.id("campaigns"),
        amount: v.number(),
        bank_name: v.string(),
        account_number: v.string(),
        account_name: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.amount < 5000) throw new Error("Minimum withdrawal is ₦5,000");
        if (args.amount > 20000) throw new Error("Maximum withdrawal per request is ₦20,000");

        // Block fraud-flagged users until reviewed
        const user = await ctx.db.get(args.user_id);
        if (user?.is_fraud_flagged) {
            throw new Error("Your account requires manual verification before withdrawals. Contact support.");
        }
        if (user?.is_suspended || user?.is_banned) {
            throw new Error("Your account is restricted. Contact support.");
        }

        // Check weekly limit: max 2 per week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const thisWeekWithdrawals = await ctx.db
            .query("campaign_withdrawals")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.gte(q.field("created_at"), weekStart.getTime()))
            .collect();
        if (thisWeekWithdrawals.length >= 2) {
            throw new Error("You can only withdraw twice per week. Try again next week.");
        }

        // Check monthly limit (max 8)
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthlyWithdrawals = await ctx.db
            .query("campaign_withdrawals")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.gte(q.field("created_at"), monthStart.getTime()))
            .collect();
        if (monthlyWithdrawals.length >= 8) throw new Error("You've reached the maximum 8 withdrawals this month");

        // Verify user has enough cash earned
        const participant = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .first();
        if (!participant || (participant.cash_earned ?? 0) < args.amount) {
            throw new Error("Insufficient campaign earnings");
        }

        // Flag large withdrawals for review
        if (args.amount > 15000) {
            await ctx.db.insert("fraud_flags", {
                user_id: args.user_id,
                type: "suspicious_withdrawal",
                severity: "low",
                description: `Large withdrawal request: ₦${args.amount.toLocaleString()}`,
                related_campaign_id: args.campaign_id,
                status: "open",
                created_at: Date.now(),
            });
        }

        return await ctx.db.insert("campaign_withdrawals", {
            user_id: args.user_id,
            campaign_id: args.campaign_id,
            amount: args.amount,
            status: "pending",
            bank_name: args.bank_name,
            account_number: args.account_number,
            account_name: args.account_name,
            created_at: Date.now(),
        });
    },
});

/** Admin: process a withdrawal (approve/reject) */
export const processWithdrawal = mutation({
    args: {
        withdrawal_id: v.id("campaign_withdrawals"),
        status: v.string(), // "approved" | "rejected"
        admin_note: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const withdrawal = await ctx.db.get(args.withdrawal_id);
        if (!withdrawal) throw new Error("Withdrawal not found");

        await ctx.db.patch(args.withdrawal_id, {
            status: args.status,
            admin_note: args.admin_note,
            processed_at: Date.now(),
        });

        // If approved, deduct from participant cash_earned
        if (args.status === "approved") {
            const participant = await ctx.db
                .query("campaign_participants")
                .withIndex("by_campaign", (q) => q.eq("campaign_id", withdrawal.campaign_id))
                .filter((q) => q.eq(q.field("user_id"), withdrawal.user_id))
                .first();
            if (participant) {
                await ctx.db.patch(participant._id, {
                    cash_earned: Math.max(0, (participant.cash_earned ?? 0) - withdrawal.amount),
                });
            }
        }
    },
});

/** Seed dummy campaigns for testing */
export const seedDummy = mutation({
    args: {},
    handler: async (ctx) => {
        const old = await ctx.db.query("campaigns").collect();
        for (const c of old) await ctx.db.delete(c._id);

        await ctx.db.insert("campaigns", {
            name: "Easter Reward Jar",
            type: "jar",
            description: "Help fill the jar by inviting friends to join subscriptions. Every payment adds to the jar!",
            about: "This seasonal campaign rewards users who grow their network on JoinTheQ during the Easter season.",
            rules: ["Must have an active subscription", "No fake referrals", "One account per person"],
            how_it_works: ["Join the campaign", "Share your referral link", "Earn BOOTS for every friend who subscribes"],
            reward_structure: "500 BOOTS for filling the jar. 5 BOOTS per referral.",
            reward_type: "boots",
            reward_amount: 500,
            referral_boots: 5,
            commission_months: 3,
            start_date: Date.now(),
            end_date: Date.now() + (14 * 24 * 60 * 60 * 1000),
            target_goal: 1000,
            current_progress: 150,
            status: "active",
            created_at: Date.now(),
        });

        await ctx.db.insert("campaigns", {
            name: "Campus Q Program",
            type: "campus",
            description: "Students earn real money bringing friends to JoinTheQ. 2% commission on every subscription.",
            about: "Campus Q is JoinTheQ's student ambassador program. Earn recurring commissions for 3 months on every user you bring to the platform.",
            rules: ["Must be a student", "No self-referrals", "Referrals must complete a subscription purchase", "Same-device referrals are flagged"],
            how_it_works: ["Join the Campus Q campaign", "Copy your referral link", "Share on WhatsApp, Telegram, SMS", "Earn 2% commission when friends subscribe", "Earn 5 BOOTS per new referral"],
            reward_structure: "2% per subscription for 3 months. Max ₦20,000 per withdrawal.",
            reward_type: "cash",
            reward_amount: 0,
            referral_boots: 5,
            commission_months: 3,
            start_date: Date.now(),
            end_date: Date.now() + (90 * 24 * 60 * 60 * 1000),
            target_goal: 500,
            current_progress: 0,
            status: "active",
            created_at: Date.now(),
        });

        await ctx.db.insert("campaigns", {
            name: "Viral Referral Storm",
            type: "referral",
            description: "The top 3 referrers this week get massive BOOTS boosters!",
            about: "A weekly competitive referral event. The more you refer, the higher you rank. Top 3 get bonus BOOTS.",
            rules: ["Must join before referring", "Top 3 determined by referral count", "Referrals must be genuine new users"],
            how_it_works: ["Join", "Refer as many friends as possible", "Check the leaderboard daily", "Top 3 earn bonus at week's end"],
            reward_structure: "1st: 1000 BOOTS | 2nd: 500 BOOTS | 3rd: 250 BOOTS. Plus 5 BOOTS per referral.",
            reward_type: "boots",
            reward_amount: 1000,
            referral_boots: 5,
            commission_months: 0,
            start_date: Date.now(),
            end_date: Date.now() + (7 * 24 * 60 * 60 * 1000),
            target_goal: 50,
            current_progress: 12,
            status: "active",
            created_at: Date.now(),
        });
    },
});
