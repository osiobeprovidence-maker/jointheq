import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createUserActivityLog } from "./activityHelpers";

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
        campaign_type: v.optional(v.string()),
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
        max_boots_per_user_per_day: v.optional(v.number()),
        max_referrals_per_user_per_day: v.optional(v.number()),
        max_total_referrals_per_user: v.optional(v.number()),
        require_payment_for_reward: v.optional(v.boolean()),
        visibility: v.optional(v.string()),
        eligible_countries: v.optional(v.array(v.string())),
        eligible_user_types: v.optional(v.array(v.string())),
        min_rank: v.optional(v.string()),
        verification_required: v.optional(v.boolean()),
        subscription_required: v.optional(v.boolean()),
        max_rewards: v.optional(v.number()),
        approval_method: v.optional(v.string()),
        duplicate_protection: v.optional(v.boolean()),
        leaderboard_enabled: v.optional(v.boolean()),
        leaderboard_size: v.optional(v.number()),
        ranking_method: v.optional(v.string()),
        notify_participants: v.optional(v.boolean()),
        reminder_schedule: v.optional(v.string()),
        social_tasks_enabled: v.optional(v.boolean()),
        prize_pool: v.optional(v.number()),
        number_of_winners: v.optional(v.number()),
        draw_date: v.optional(v.number()),
        draw_method: v.optional(v.string()),
        entry_rules: v.optional(v.array(v.string())),
        bonus_entry_rules: v.optional(v.array(v.string())),
        min_requirements: v.optional(v.array(v.string())),
        winner_announcement_date: v.optional(v.number()),
        entries_per_referral: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("campaigns", {
            ...args,
            current_progress: 0,
            status: "active",
            referral_boots: args.referral_boots ?? 5,
            commission_months: args.commission_months ?? 3,
            entries_per_referral: args.entries_per_referral ?? 1,
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
        if (campaign.visibility === "invite_only") throw new Error("This campaign is invite-only");

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
            qualified_referrals: 0,
            pending_referrals: 0,
            rejected_referrals: 0,
            campaign_earnings: 0,
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
                            try { await createUserActivityLog(ctx, { userId: effectiveReferrerId, category: "rewards", action: "Referral BOOTS earned", description: `Earned ${actualBoots} BOOTS from "${campaign.name}" referral`, status: "success", amount: actualBoots }); } catch (e) { console.error("Failed to log activity:", e); }
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

/** Buy a raffle ticket (user) */
export const buyRaffleTicket = mutation({
    args: {
        user_id: v.id("users"),
        campaign_id: v.id("campaigns"),
        ticket_count: v.number(),
        cost_per_ticket: v.number(),
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaign_id);
        if (!campaign || campaign.status !== "active") throw new Error("Campaign is not active");
        if (campaign.type !== "raffle") throw new Error("This is not a raffle campaign");

        const user = await ctx.db.get(args.user_id);
        if (!user) throw new Error("User not found");

        const totalCost = args.ticket_count * args.cost_per_ticket;
        if (user.wallet_balance < totalCost) throw new Error("Insufficient wallet balance");

        // Deduct from wallet
        await ctx.db.patch(args.user_id, {
            wallet_balance: user.wallet_balance - totalCost,
        });

        // Record transaction
        await ctx.db.insert("transactions", {
            user_id: args.user_id,
            amount: -totalCost,
            type: "raffle_ticket",
            description: `Bought ${args.ticket_count} ticket(s) for ${campaign.name}`,
            created_at: Date.now(),
        });

        // Update participant entries
        const participant = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .first();

        if (participant) {
            await ctx.db.patch(participant._id, {
                entries: (participant.entries ?? 0) + args.ticket_count,
            });
        } else {
            const referralCode = `${args.user_id.slice(-6).toUpperCase()}-${args.campaign_id.slice(-4).toUpperCase()}`;
            await ctx.db.insert("campaign_participants", {
                campaign_id: args.campaign_id,
                user_id: args.user_id,
                referral_code: referralCode,
                progress: 0,
                entries: args.ticket_count,
                joined_at: Date.now(),
            });
        }

        // Update campaign progress
        await ctx.db.patch(args.campaign_id, {
            current_progress: (campaign.current_progress ?? 0) + args.ticket_count,
        });

        return { success: true };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NEW CAMPAIGN ENGINE QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get campaigns available for a partner to join (public + active) */
export const getAvailableCampaigns = query({
    args: { user_id: v.optional(v.id("users")) },
    handler: async (ctx, { user_id }) => {
        const now = Date.now();
        const campaigns = await ctx.db
            .query("campaigns")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        const enriched = await Promise.all(
            campaigns.map(async (c) => {
                const participantCount = await ctx.db
                    .query("campaign_participants")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", c._id))
                    .collect();
                let hasJoined = false;
                if (user_id) {
                    const existing = participantCount.find((p) => p.user_id === user_id);
                    hasJoined = !!existing;
                }
                const socialTasks = await ctx.db
                    .query("campaign_social_tasks")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", c._id))
                    .collect();
                return {
                    ...c,
                    participant_count: participantCount.length,
                    has_joined: hasJoined,
                    social_task_count: socialTasks.length,
                    time_remaining: c.end_date ? Math.max(0, (c.end_date as number) - now) : 0,
                };
            })
        );

        // Show public first, then invite-only
        return enriched.sort((a, b) => {
            if (a.visibility === "public" && b.visibility !== "public") return -1;
            if (a.visibility !== "public" && b.visibility === "public") return 1;
            return (a.created_at ?? 0) - (b.created_at ?? 0);
        });
    },
});

/** Full campaign detail with current user's participation data */
export const getCampaignDetail = query({
    args: { campaign_id: v.id("campaigns"), user_id: v.optional(v.id("users")) },
    handler: async (ctx, { campaign_id, user_id }) => {
        const campaign = await ctx.db.get(campaign_id);
        if (!campaign) return null;

        const participants = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        const socialTasks = await ctx.db
            .query("campaign_social_tasks")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        const achievements = await ctx.db
            .query("campaign_achievements")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        // Leaderboard
        const sorted = [...participants].sort(
            (a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0)
        );
        const leaderboard = await Promise.all(
            sorted.slice(0, campaign.leaderboard_size ?? 20).map(async (p, i) => {
                const user = await ctx.db.get(p.user_id);
                return {
                    rank: i + 1,
                    user_id: p.user_id,
                    full_name: user?.full_name ?? "Unknown",
                    username: user?.username ?? "",
                    avatar: user?.full_name?.[0] ?? "?",
                    referral_count: p.referral_count ?? 0,
                    qualified_referrals: p.qualified_referrals ?? 0,
                    campaign_earnings: p.campaign_earnings ?? 0,
                    entries: p.entries ?? 0,
                };
            })
        );

        let myParticipation = null;
        let myRank = null;
        if (user_id) {
            const my = participants.find((p) => p.user_id === user_id) ?? null;
            if (my) {
                myParticipation = my;
                myRank = sorted.findIndex((p) => p.user_id === user_id) + 1;
            }
            const userAchievements = await ctx.db
                .query("user_campaign_achievements")
                .withIndex("by_user", (q) => q.eq("user_id", user_id))
                .filter((q) => q.eq(q.field("campaign_id"), campaign_id))
                .collect();
            return {
                ...campaign,
                participant_count: participants.length,
                leaderboard,
                my_participation: { ...myParticipation, rank: myRank, total_participants: participants.length },
                social_tasks: socialTasks,
                achievements,
                my_achievements: userAchievements.map((a) => a.achievement_id),
                time_remaining: campaign.end_date ? Math.max(0, (campaign.end_date as number) - Date.now()) : 0,
            };
        }

        return {
            ...campaign,
            participant_count: participants.length,
            leaderboard,
            my_participation: null,
            social_tasks: socialTasks,
            achievements,
            my_achievements: [],
            time_remaining: campaign.end_date ? Math.max(0, (campaign.end_date as number) - Date.now()) : 0,
        };
    },
});

/** Get all campaigns a user has joined */
export const getMyCampaigns = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, { user_id }) => {
        const myParticipants = await ctx.db
            .query("campaign_participants")
            .withIndex("by_user", (q) => q.eq("user_id", user_id))
            .collect();

        return await Promise.all(
            myParticipants.map(async (p) => {
                const campaign = await ctx.db.get(p.campaign_id);
                const allParticipants = await ctx.db
                    .query("campaign_participants")
                    .withIndex("by_campaign", (q) => q.eq("campaign_id", p.campaign_id))
                    .collect();
                const sorted = [...allParticipants].sort(
                    (a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0)
                );
                const rank = sorted.findIndex((s) => s.user_id === user_id) + 1;
                return {
                    ...p,
                    campaign_name: campaign?.name ?? "Unknown",
                    campaign_type: campaign?.campaign_type ?? campaign?.type,
                    campaign_banner: campaign?.banner_url,
                    campaign_end_date: campaign?.end_date,
                    campaign_status: campaign?.status,
                    total_participants: allParticipants.length,
                    rank,
                    time_remaining: campaign?.end_date ? Math.max(0, (campaign.end_date as number) - Date.now()) : 0,
                };
            })
        );
    },
});

/** Get campaign leaderboard with pagination */
export const getCampaignLeaderboardPaginated = query({
    args: { campaign_id: v.id("campaigns"), offset: v.optional(v.number()), limit: v.optional(v.number()) },
    handler: async (ctx, { campaign_id, offset = 0, limit = 20 }) => {
        const participants = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();

        const sorted = participants.sort(
            (a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0)
        );

        const page = sorted.slice(offset, offset + limit);
        const enriched = await Promise.all(
            page.map(async (p, i) => {
                const user = await ctx.db.get(p.user_id);
                return {
                    rank: offset + i + 1,
                    user_id: p.user_id,
                    full_name: user?.full_name ?? "Unknown",
                    username: user?.username ?? "",
                    avatar: user?.full_name?.[0] ?? "?",
                    referral_count: p.referral_count ?? 0,
                    qualified_referrals: p.qualified_referrals ?? 0,
                    campaign_earnings: p.campaign_earnings ?? 0,
                    entries: p.entries ?? 0,
                    conversion_rate: p.conversion_rate ?? 0,
                };
            })
        );

        return { leaderboard: enriched, total: sorted.length };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Admin: invite a partner to an invite-only campaign */
export const invitePartnerToCampaign = mutation({
    args: {
        campaign_id: v.id("campaigns"),
        partner_id: v.id("users"),
        invited_by: v.id("users"),
        invitation_code: v.string(),
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaign_id);
        if (!campaign) throw new Error("Campaign not found");
        if (campaign.visibility !== "invite_only") throw new Error("Campaign is not invite-only");

        const existing = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), args.partner_id))
            .first();
        if (existing) throw new Error("Partner already in campaign");

        const referralCode = `${args.partner_id.slice(-6).toUpperCase()}-${args.campaign_id.slice(-4).toUpperCase()}`;
        await ctx.db.insert("campaign_participants", {
            campaign_id: args.campaign_id,
            user_id: args.partner_id,
            referral_code: referralCode,
            progress: 0,
            entries: 0,
            referral_count: 0,
            qualified_referrals: 0,
            pending_referrals: 0,
            rejected_referrals: 0,
            campaign_earnings: 0,
            boots_earned: 0,
            cash_earned: 0,
            joined_at: Date.now(),
            last_active: Date.now(),
            invited_by: args.invited_by,
            invitation_code: args.invitation_code,
        });

        return { referral_code: referralCode };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL TASKS
// ─────────────────────────────────────────────────────────────────────────────

export const createSocialTask = mutation({
    args: {
        campaign_id: v.id("campaigns"),
        name: v.string(),
        description: v.optional(v.string()),
        platform: v.optional(v.string()),
        icon: v.optional(v.string()),
        reward_type: v.optional(v.string()),
        reward_amount: v.optional(v.number()),
        verification_method: v.optional(v.string()),
        destination_url: v.optional(v.string()),
        display_order: v.optional(v.number()),
        created_by: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("campaign_social_tasks", {
            ...args,
            is_active: true,
            created_at: Date.now(),
        });
    },
});

export const updateSocialTask = mutation({
    args: {
        task_id: v.id("campaign_social_tasks"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        platform: v.optional(v.string()),
        icon: v.optional(v.string()),
        reward_type: v.optional(v.string()),
        reward_amount: v.optional(v.number()),
        verification_method: v.optional(v.string()),
        destination_url: v.optional(v.string()),
        is_active: v.optional(v.boolean()),
        display_order: v.optional(v.number()),
    },
    handler: async (ctx, { task_id, ...updates }) => {
        const patch = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        await ctx.db.patch(task_id, patch);
    },
});

export const deleteSocialTask = mutation({
    args: { task_id: v.id("campaign_social_tasks") },
    handler: async (ctx, { task_id }) => {
        await ctx.db.delete(task_id);
    },
});

export const getSocialTasks = query({
    args: { campaign_id: v.id("campaigns") },
    handler: async (ctx, { campaign_id }) => {
        return await ctx.db
            .query("campaign_social_tasks")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();
    },
});

/** Complete a social task and earn the reward */
export const completeSocialTask = mutation({
    args: {
        task_id: v.id("campaign_social_tasks"),
        user_id: v.id("users"),
    },
    handler: async (ctx, { task_id, user_id }) => {
        const task = await ctx.db.get(task_id);
        if (!task) throw new Error("Task not found");
        if (!task.is_active) throw new Error("Task is no longer active");

        // Check not already completed
        const participant = await ctx.db
            .query("campaign_participants")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", task.campaign_id))
            .filter((q) => q.eq(q.field("user_id"), user_id))
            .first();
        if (!participant) throw new Error("You must join the campaign first");

        const completed = participant.social_tasks_completed ?? [];
        if (completed.includes(task_id)) throw new Error("Task already completed");

        // Mark complete
        await ctx.db.patch(participant._id, {
            social_tasks_completed: [...completed, task_id],
            entries: (participant.entries ?? 0) + (task.reward_type === "entries" ? (task.reward_amount ?? 0) : 0),
            campaign_earnings: (participant.campaign_earnings ?? 0) + (
                task.reward_type === "cash" ? (task.reward_amount ?? 0) : 0
            ),
            boots_earned: (participant.boots_earned ?? 0) + (
                task.reward_type === "boots" ? (task.reward_amount ?? 0) : 0
            ),
            last_active: Date.now(),
        });

        // Credit wallet if boots or cash
        if (task.reward_type === "boots" && task.reward_amount) {
            const user = await ctx.db.get(user_id);
            if (user) {
                await ctx.db.patch(user_id, {
                    boots_balance: (user.boots_balance ?? 0) + task.reward_amount,
                });
            }
        }

        return { completed: true };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const createCampaignAchievement = mutation({
    args: {
        campaign_id: v.id("campaigns"),
        name: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        criteria_type: v.optional(v.string()),
        criteria_value: v.optional(v.number()),
        reward_type: v.optional(v.string()),
        reward_amount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("campaign_achievements", {
            ...args,
            created_at: Date.now(),
        });
    },
});

export const getCampaignAchievements = query({
    args: { campaign_id: v.id("campaigns") },
    handler: async (ctx, { campaign_id }) => {
        return await ctx.db
            .query("campaign_achievements")
            .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign_id))
            .collect();
    },
});

export const earnAchievement = mutation({
    args: {
        achievement_id: v.id("campaign_achievements"),
        user_id: v.id("users"),
        campaign_id: v.id("campaigns"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_campaign_achievements")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("achievement_id"), args.achievement_id))
            .first();
        if (existing) throw new Error("Achievement already earned");

        await ctx.db.insert("user_campaign_achievements", {
            user_id: args.user_id,
            campaign_id: args.campaign_id,
            achievement_id: args.achievement_id,
            earned_at: Date.now(),
        });
    },
});

/** Backfill: recalculate campaign entries/tickets from historical qualified referrals */
export const backfillCampaignTickets = mutation({
    args: { campaign_id: v.optional(v.id("campaigns")) },
    handler: async (ctx, { campaign_id }) => {
        let campaigns;
        if (campaign_id) {
            const c = await ctx.db.get(campaign_id);
            campaigns = c ? [c] : [];
        } else {
            campaigns = await ctx.db
                .query("campaigns")
                .filter((q) => q.neq(q.field("status"), "archived"))
                .collect();
        }

        let totalUpdated = 0;

        for (const campaign of campaigns) {
            const isRaffle = campaign.campaign_type === "q_raffle" || campaign.type === "raffle";
            if (!isRaffle) continue;

            const participants = await ctx.db
                .query("campaign_participants")
                .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign._id))
                .collect();

            for (const participant of participants) {
                // Count qualified campaign_referrals for this participant in this campaign
                const referrals = await ctx.db
                    .query("campaign_referrals")
                    .withIndex("by_referrer", (q) => q.eq("referrer_id", participant.user_id))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("campaign_id"), campaign._id),
                            q.eq(q.field("status"), "active")
                        )
                    )
                    .collect();

                const referralCount = referrals.length;

                // Also check partner_referrals that might not yet have campaign_referral records
                const partner = await ctx.db
                    .query("partners")
                    .withIndex("by_userId", (q) => q.eq("userId", participant.user_id))
                    .first();

                if (partner) {
                    const qualifiedPartnerRefs = await ctx.db
                        .query("partner_referrals")
                        .withIndex("by_partner", (q) => q.eq("partnerId", partner._id))
                        .filter((q) => q.eq(q.field("qualified"), true))
                        .collect();

                    // Check each qualified referral to see if it's already in campaign_referrals
                    for (const pr of qualifiedPartnerRefs) {
                        if (!pr.userId) continue;
                        const existing = await ctx.db
                            .query("campaign_referrals")
                            .withIndex("by_referrer", (q) => q.eq("referrer_id", participant.user_id))
                            .filter((q) =>
                                q.and(
                                    q.eq(q.field("campaign_id"), campaign._id),
                                    q.eq(q.field("referred_id"), pr.userId as any)
                                )
                            )
                            .first();

                        if (!existing) {
                            await ctx.db.insert("campaign_referrals", {
                                campaign_id: campaign._id,
                                referrer_id: participant.user_id,
                                referred_id: pr.userId as any,
                                status: "active",
                                commission_earned: pr.commission ?? 0,
                                created_at: Date.now(),
                            });
                            referralCount + 1;
                            totalUpdated++;
                        }
                    }
                }

                // Recalculate entries/tickets
                const entriesPerRef = (campaign as any).entries_per_referral ?? 1;
                const newEntries = referralCount * entriesPerRef;
                const newEarnings = referrals.reduce((sum, r) => sum + (r.commission_earned ?? 0), 0);

                await ctx.db.patch(participant._id, {
                    referral_count: referralCount,
                    qualified_referrals: referralCount,
                    entries: Math.max(newEntries, participant.entries ?? 0),
                    campaign_earnings: Math.max(newEarnings, participant.campaign_earnings ?? 0),
                    last_active: Date.now(),
                });

                if (referralCount > 0) {
                    totalUpdated++;
                }
            }

            // Update campaign progress
            const allParticipants = await ctx.db
                .query("campaign_participants")
                .withIndex("by_campaign", (q) => q.eq("campaign_id", campaign._id))
                .collect();
            const totalEntries = allParticipants.reduce((s, p) => s + (p.entries ?? 0), 0);
            await ctx.db.patch(campaign._id, {
                current_progress: totalEntries,
            });
        }

        return { updated: totalUpdated };
    },
});

/** Seed dummy campaigns for testing */
export const seedDummy = internalMutation({
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

        await ctx.db.insert("campaigns", {
            name: "Easter Raffle Draw",
            type: "raffle",
            description: "Buy tickets for a chance to win ₦50,000 cash prize! Each ticket is just ₦100.",
            about: "The grand Easter raffle. 10 lucky winners will be selected at the end of the campaign. The more tickets you have, the higher your chances!",
            rules: ["Tickets are non-refundable", "Winners announced on April 20th", "Must be a registered user to participate"],
            how_it_works: ["Join the campaign", "Buy as many tickets as you want", "Wait for the draw date", "Check your notifications for results"],
            reward_structure: "Grand Prize: ₦50,000 | 2nd Place: ₦25,000 | 3rd-10th: 1000 BOOTS each.",
            reward_type: "cash",
            reward_amount: 50000,
            referral_boots: 0,
            commission_months: 0,
            start_date: Date.now(),
            end_date: Date.now() + (21 * 24 * 60 * 60 * 1000),
            target_goal: 5000,
            current_progress: 240,
            status: "active",
            created_at: Date.now(),
        });
    },
});
