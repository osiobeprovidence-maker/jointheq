import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { createNotification } from "./notificationHelpers";
import { createUserActivityLog } from "./activityHelpers";

const BADGE_TYPES = ["first_referral", "top_10_referrer", "referral_master", "campaign_winner"] as const;

async function getAdminUser(ctx: any, userId: Id<"users">) {
    const user = await ctx.db.get(userId);
    if (!user?.is_admin) throw new Error("Unauthorized");
    return user;
}

function getBaseUrl() {
    return "https://jointheq.sbs";
}

function getUserReferralLink(username: string | undefined) {
    return `${getBaseUrl()}/r/${username || "invite"}`;
}

function getCampaignReferralLink(campaignId: Id<"referral_campaigns">, userId: Id<"users">) {
    return `${getBaseUrl()}/campaigns/${campaignId}?ref=${userId}`;
}

async function computeCampaignLeaderboard(ctx: any, campaignId: Id<"referral_campaigns">, limit: number) {
    const referrals = await ctx.db.query("referrals")
        .withIndex("by_campaign", q => q.eq("campaign_id", campaignId))
        .filter(q => q.eq(q.field("status"), "completed"))
        .collect();

    const counts = new Map<Id<"users">, number>();
    for (const r of referrals) {
        counts.set(r.referrer_id, (counts.get(r.referrer_id) || 0) + 1);
    }

    const entries = [...counts.entries()]
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    const users = await Promise.all(
        entries.map(e => ctx.db.get(e.userId))
    );

    return entries.map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        full_name: (users[i] as any)?.full_name ?? "Unknown",
        image: (users[i] as any)?.profile_image_url,
        referralCount: e.count,
    }));
}

async function getActiveCampaignsList(ctx: any) {
    const now = Date.now();
    const campaigns = await ctx.db.query("referral_campaigns")
        .withIndex("by_active", q => q.eq("is_active", true))
        .filter(q => q.lte(q.field("start_date"), now))
        .collect();
    return campaigns.filter(c => c.end_date > now);
}

async function awardBadgeIfNeeded(ctx: any, userId: Id<"users">, campaignId: Id<"referral_campaigns"> | undefined, badgeType: string, badgeName: string) {
    const existing = await ctx.db.query("referral_badges")
        .withIndex("by_user", q => q.eq("user_id", userId))
        .filter(q => q.eq(q.field("badge_type"), badgeType))
        .first();
    if (existing) return;

    await ctx.db.insert("referral_badges", {
        user_id: userId,
        badge_type: badgeType,
        badge_name: badgeName,
        campaign_id: campaignId,
        awarded_at: Date.now(),
    });

    await createNotification(ctx, {
        userId,
        title: "New Badge Earned!",
        message: `You earned the "${badgeName}" badge! Keep referring friends to unlock more rewards.`,
        type: "promotion",
    });
}

export const getActiveCampaigns = query({
    handler: async (ctx) => {
        return await getActiveCampaignsList(ctx);
    },
});

export const getCampaign = query({
    args: { campaignId: v.id("referral_campaigns") },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign) throw new Error("Campaign not found");
        return campaign;
    },
});

export const getCampaignLeaderboard = query({
    args: { campaignId: v.id("referral_campaigns"), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await computeCampaignLeaderboard(ctx, args.campaignId, args.limit ?? 50);
    },
});

export const getCampaignWinners = query({
    args: { campaignId: v.id("referral_campaigns"), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        const rewards = await ctx.db.query("referral_rewards")
            .withIndex("by_campaign", q => q.eq("campaign_id", args.campaignId))
            .filter(q => q.eq(q.field("status"), "delivered"))
            .order("desc")
            .take(limit);

        const users = await Promise.all(
            rewards.map(r => ctx.db.get(r.user_id))
        );

        return rewards.map((r, i) => ({
            userId: r.user_id,
            full_name: (users[i] as any)?.full_name ?? "Unknown",
            image: (users[i] as any)?.profile_image_url,
            reward_name: r.reward_name,
            awarded_at: r.awarded_at,
        }));
    },
});

export const getUserReferrals = query({
    args: { userId: v.id("users"), campaignId: v.optional(v.id("referral_campaigns")) },
    handler: async (ctx, args) => {
        let referrals;
        if (args.campaignId) {
            referrals = await ctx.db.query("referrals")
                .withIndex("by_referrer_campaign", q => q.eq("referrer_id", args.userId).eq("campaign_id", args.campaignId))
                .collect();
        } else {
            referrals = await ctx.db.query("referrals")
                .withIndex("by_referrer", q => q.eq("referrer_id", args.userId))
                .collect();
        }

        const referredUsers = await Promise.all(
            referrals.map(r => r.referred_user_id ? ctx.db.get(r.referred_user_id) : null)
        );

        return referrals.map((r, i) => ({
            ...r,
            referred_user_name: (referredUsers[i] as any)?.full_name ?? r.referred_email ?? "Unknown",
            referred_user_image: (referredUsers[i] as any)?.profile_image_url,
        }));
    },
});

export const getUserReferralStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const campaigns = await getActiveCampaignsList(ctx);

        const results = await Promise.all(campaigns.map(async (campaign) => {
            const referrals = await ctx.db.query("referrals")
                .withIndex("by_referrer_campaign", q => q.eq("referrer_id", args.userId).eq("campaign_id", campaign._id))
                .collect();

            const completed = referrals.filter(r => r.status === "completed").length;
            const pending = referrals.filter(r => r.status === "pending").length;

            const leaderboard = await computeCampaignLeaderboard(ctx, campaign._id, 100);
            const rank = leaderboard.findIndex(e => e.userId === args.userId) + 1;

            let nextReward: string | null = null;
            if (completed < campaign.target_referral_count) {
                const needed = campaign.target_referral_count - completed;
                nextReward = `${needed} more referral(s) needed to earn ${campaign.reward_name}`;
            }

            return {
                campaign: { _id: campaign._id, name: campaign.name, reward_name: campaign.reward_name, target_referral_count: campaign.target_referral_count, end_date: campaign.end_date, banner_url: campaign.banner_url },
                completed,
                pending,
                total: referrals.length,
                rank: rank > 0 ? rank : null,
                leaderboardSize: leaderboard.length,
                nextReward,
            };
        }));

        return {
            referralLink: getUserReferralLink(user.username),
            campaigns: results,
            activeCampaign: results.find(r => r.completed < r.campaign.target_referral_count && r.campaign.end_date > Date.now()) || null,
        };
    },
});

export const getUserRewards = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const rewards = await ctx.db.query("referral_rewards")
            .withIndex("by_user", q => q.eq("user_id", args.userId))
            .order("desc")
            .collect();

        const campaigns = await Promise.all(
            rewards.map(r => ctx.db.get(r.campaign_id))
        );

        return rewards.map((r, i) => ({
            ...r,
            campaign_name: (campaigns[i] as any)?.name ?? "Unknown",
        }));
    },
});

export const getUserBadges = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.query("referral_badges")
            .withIndex("by_user", q => q.eq("user_id", args.userId))
            .order("desc")
            .collect();
    },
});

export const getReferralCampaigns = query({
    handler: async (ctx) => {
        return await ctx.db.query("referral_campaigns").order("desc").collect();
    },
});

export const createReferralCampaign = mutation({
    args: {
        adminId: v.id("users"),
        name: v.string(),
        description: v.string(),
        banner_url: v.optional(v.string()),
        target_subscription: v.optional(v.string()),
        target_referral_count: v.number(),
        reward_name: v.string(),
        reward_description: v.optional(v.string()),
        reward_image: v.optional(v.string()),
        start_date: v.number(),
        end_date: v.number(),
        is_active: v.boolean(),
    },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        const now = Date.now();
        const id = await ctx.db.insert("referral_campaigns", {
            name: args.name,
            description: args.description,
            banner_url: args.banner_url,
            target_subscription: args.target_subscription,
            target_referral_count: args.target_referral_count,
            reward_name: args.reward_name,
            reward_description: args.reward_description,
            reward_image: args.reward_image,
            start_date: args.start_date,
            end_date: args.end_date,
            is_active: args.is_active,
            created_by: args.adminId,
            created_at: now,
            updated_at: now,
        });
        return { success: true, campaignId: id };
    },
});

export const updateReferralCampaign = mutation({
    args: {
        adminId: v.id("users"),
        campaignId: v.id("referral_campaigns"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        banner_url: v.optional(v.string()),
        target_subscription: v.optional(v.string()),
        target_referral_count: v.optional(v.number()),
        reward_name: v.optional(v.string()),
        reward_description: v.optional(v.string()),
        reward_image: v.optional(v.string()),
        start_date: v.optional(v.number()),
        end_date: v.optional(v.number()),
        is_active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign) throw new Error("Campaign not found");

        const updates: Record<string, any> = { updated_at: Date.now() };
        for (const [key, value] of Object.entries(args)) {
            if (value !== undefined && key !== "adminId" && key !== "campaignId") {
                updates[key] = value;
            }
        }
        await ctx.db.patch(args.campaignId, updates);
        return { success: true };
    },
});

export const deleteReferralCampaign = mutation({
    args: { adminId: v.id("users"), campaignId: v.id("referral_campaigns") },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        await ctx.db.delete(args.campaignId);
        return { success: true };
    },
});

export const recordReferralSignup = mutation({
    args: {
        referrerId: v.id("users"),
        campaignId: v.optional(v.id("referral_campaigns")),
        referredEmail: v.optional(v.string()),
        referralLink: v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("referrals", {
            campaign_id: args.campaignId,
            referrer_id: args.referrerId,
            referred_email: args.referredEmail,
            status: "pending",
            referral_link: args.referralLink,
            created_at: Date.now(),
        });

        await createNotification(ctx, {
            userId: args.referrerId,
            title: "New Referral Signup!",
            message: "Someone signed up using your referral link. Once they join a subscription, your referral will be completed!",
            type: "promotion",
        });

        try { createUserActivityLog(ctx, { userId: args.referrerId, category: "referral", action: "Referral signup", description: "New referral signup recorded", status: "pending" }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true, referralId: id };
    },
});

export const completeReferral = mutation({
    args: {
        referralId: v.id("referrals"),
        referredUserId: v.id("users"),
        subscriptionJoined: v.string(),
    },
    handler: async (ctx, args) => {
        const referral = await ctx.db.get(args.referralId);
        if (!referral || referral.status !== "pending") throw new Error("Invalid referral");

        await ctx.db.patch(args.referralId, {
            referred_user_id: args.referredUserId,
            subscription_joined: args.subscriptionJoined,
            status: "completed",
            completed_at: Date.now(),
        });

        const user = await ctx.db.get(referral.referrer_id);

        await createNotification(ctx, {
            userId: referral.referrer_id,
            title: "Referral Completed!",
            message: `Great news! Your referral joined ${args.subscriptionJoined}. You're one step closer to earning your reward!`,
            type: "promotion",
        });

        await awardBadgeIfNeeded(ctx, referral.referrer_id, referral.campaign_id ?? undefined, "first_referral", "First Referral");

        if (referral.campaign_id) {
            const completedCount = (await ctx.db.query("referrals")
                .withIndex("by_referrer_campaign", q => q.eq("referrer_id", referral.referrer_id).eq("campaign_id", referral.campaign_id))
                .filter(q => q.eq(q.field("status"), "completed"))
                .collect()).length;

            const campaign = await ctx.db.get(referral.campaign_id);
            if (campaign && completedCount >= campaign.target_referral_count) {
                const existingReward = await ctx.db.query("referral_rewards")
                    .withIndex("by_campaign", q => q.eq("campaign_id", referral.campaign_id))
                    .filter(q => q.and(
                        q.eq(q.field("user_id"), referral.referrer_id),
                        q.eq(q.field("status"), "pending_review")
                    ))
                    .first();
                if (!existingReward) {
                    await ctx.db.insert("referral_rewards", {
                        campaign_id: referral.campaign_id,
                        user_id: referral.referrer_id,
                        referral_count: completedCount,
                        reward_name: campaign.reward_name,
                        status: "pending_review",
                        awarded_at: Date.now(),
                    });

                    await createNotification(ctx, {
                        userId: referral.referrer_id,
                        title: "Reward Earned!",
                        message: `Congratulations! You've earned ${campaign.reward_name} for completing ${completedCount} referrals. An admin will review and deliver your reward soon.`,
                        type: "promotion",
                    });

                    await awardBadgeIfNeeded(ctx, referral.referrer_id, referral.campaign_id!, "campaign_winner", "Campaign Winner");
                }
            }

            const leaderboardData = await computeCampaignLeaderboard(ctx, referral.campaign_id!, 100);
            const userRank = leaderboardData.findIndex(e => e.userId === referral.referrer_id) + 1;
            if (userRank <= 10) {
                await awardBadgeIfNeeded(ctx, referral.referrer_id, referral.campaign_id!, "top_10_referrer", "Top 10 Referrer");
            }

            const totalCompleted = (await ctx.db.query("referrals")
                .filter(q => q.and(
                    q.eq(q.field("referrer_id"), referral.referrer_id),
                    q.eq(q.field("status"), "completed")
                ))
                .collect()).length;

            if (totalCompleted >= 10) {
                await awardBadgeIfNeeded(ctx, referral.referrer_id, undefined, "referral_master", "Referral Master");
            }
        }

        try { createUserActivityLog(ctx, { userId: referral.referrer_id, category: "referral", action: "Referral completed", description: `Referred user joined ${args.subscriptionJoined}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true };
    },
});

export const rejectReferral = mutation({
    args: { adminId: v.id("users"), referralId: v.id("referrals"), reason: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        await ctx.db.patch(args.referralId, { status: "rejected" });
        return { success: true };
    },
});

export const adminGetAllReferrals = query({
    args: {
        campaignId: v.optional(v.id("referral_campaigns")),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let referrals;
        if (args.campaignId) {
            referrals = await ctx.db.query("referrals")
                .withIndex("by_campaign", q => q.eq("campaign_id", args.campaignId))
                .collect();
        } else {
            referrals = await ctx.db.query("referrals").collect();
        }

        if (args.status) {
            referrals = referrals.filter(r => r.status === args.status);
        }

        referrals.sort((a, b) => b.created_at - a.created_at);

        const limit = args.limit ?? 100;
        referrals = referrals.slice(0, limit);

        const referrers = await Promise.all(referrals.map(r => ctx.db.get(r.referrer_id)));
        const referredUsers = await Promise.all(referrals.map(r => r.referred_user_id ? ctx.db.get(r.referred_user_id) : null));
        const campaigns = await Promise.all(referrals.map(r => r.campaign_id ? ctx.db.get(r.campaign_id) : null));

        return referrals.map((r, i) => ({
            ...r,
            referrer_name: (referrers[i] as any)?.full_name ?? "Unknown",
            referrer_email: (referrers[i] as any)?.email ?? "",
            referred_user_name: (referredUsers[i] as any)?.full_name ?? r.referred_email ?? "Unknown",
            campaign_name: (campaigns[i] as any)?.name ?? "Direct",
        }));
    },
});

export const adminGetRewardManagement = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let rewards = await ctx.db.query("referral_rewards").order("desc").collect();
        if (args.status) {
            rewards = rewards.filter(r => r.status === args.status);
        }

        const users = await Promise.all(rewards.map(r => ctx.db.get(r.user_id)));
        const campaigns = await Promise.all(rewards.map(r => ctx.db.get(r.campaign_id)));

        return rewards.map((r, i) => ({
            ...r,
            user_name: (users[i] as any)?.full_name ?? "Unknown",
            user_email: (users[i] as any)?.email ?? "",
            campaign_name: (campaigns[i] as any)?.name ?? "Unknown",
        }));
    },
});

export const approveReward = mutation({
    args: { adminId: v.id("users"), rewardId: v.id("referral_rewards"), note: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        const reward = await ctx.db.get(args.rewardId);
        if (!reward) throw new Error("Reward not found");

        await ctx.db.patch(args.rewardId, { status: "approved", admin_note: args.note });

        await createNotification(ctx, {
            userId: reward.user_id,
            title: "Reward Approved!",
            message: `Your reward "${reward.reward_name}" has been approved! We'll deliver it to you soon.`,
            type: "promotion",
        });

        try { createUserActivityLog(ctx, { userId: reward.user_id, category: "referral", action: "Referral reward earned", description: `Reward approved: ${reward.reward_name}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true };
    },
});

export const rejectReward = mutation({
    args: { adminId: v.id("users"), rewardId: v.id("referral_rewards"), note: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        const reward = await ctx.db.get(args.rewardId);
        if (!reward) throw new Error("Reward not found");

        await ctx.db.patch(args.rewardId, { status: "rejected", admin_note: args.note });

        await createNotification(ctx, {
            userId: reward.user_id,
            title: "Reward Update",
            message: `Your reward "${reward.reward_name}" could not be approved at this time. ${args.note ? `Reason: ${args.note}` : "Please contact support for more information."}`,
            type: "promotion",
        });

        try { createUserActivityLog(ctx, { userId: reward.user_id, category: "referral", action: "Referral reward rejected", description: `Reward rejected: ${reward.reward_name}`, status: "failed" }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true };
    },
});

export const deliverReward = mutation({
    args: { adminId: v.id("users"), rewardId: v.id("referral_rewards"), note: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        const reward = await ctx.db.get(args.rewardId);
        if (!reward) throw new Error("Reward not found");

        await ctx.db.patch(args.rewardId, {
            status: "delivered",
            delivered_at: Date.now(),
            admin_note: args.note,
        });

        await createNotification(ctx, {
            userId: reward.user_id,
            title: "Reward Delivered!",
            message: `Your reward "${reward.reward_name}" has been delivered! Check your account to enjoy it.`,
            type: "promotion",
        });

        try { createUserActivityLog(ctx, { userId: reward.user_id, category: "referral", action: "Referral payout", description: `Reward delivered: ${reward.reward_name}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true };
    },
});

export const getReferralAnalytics = query({
    handler: async (ctx) => {
        const campaigns = await ctx.db.query("referral_campaigns").collect();
        const allReferrals = await ctx.db.query("referrals").collect();
        const allRewards = await ctx.db.query("referral_rewards").collect();

        const totalParticipants = new Set(allReferrals.map(r => r.referrer_id)).size;
        const totalLinksShared = allReferrals.length;
        const successfulReferrals = allReferrals.filter(r => r.status === "completed").length;
        const conversionRate = totalLinksShared > 0 ? Math.round((successfulReferrals / totalLinksShared) * 100) : 0;
        const rewardClaims = allRewards.length;
        const mostSuccessfulCampaign = campaigns
            .map(c => ({
                name: c.name,
                count: allReferrals.filter(r => r.campaign_id === c._id && r.status === "completed").length,
            }))
            .sort((a, b) => b.count - a.count)[0];

        const referrerCounts = new Map<Id<"users">, number>();
        for (const r of allReferrals) {
            if (r.status === "completed") {
                referrerCounts.set(r.referrer_id, (referrerCounts.get(r.referrer_id) || 0) + 1);
            }
        }
        const topReferrers = [...referrerCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const topReferrerUsers = await Promise.all(
            topReferrers.map(([userId]) => ctx.db.get(userId))
        );

        return {
            totalParticipants,
            totalLinksShared,
            successfulReferrals,
            conversionRate,
            rewardClaims,
            mostSuccessfulCampaign: mostSuccessfulCampaign?.name ?? "None",
            topReferrers: topReferrers.map(([userId, count], i) => ({
                full_name: (topReferrerUsers[i] as any)?.full_name ?? "Unknown",
                count,
            })),
            referralsByStatus: {
                pending: allReferrals.filter(r => r.status === "pending").length,
                completed: successfulReferrals,
                rejected: allReferrals.filter(r => r.status === "rejected").length,
            },
        };
    },
});

export const resetLeaderboard = mutation({
    args: { adminId: v.id("users"), campaignId: v.id("referral_campaigns") },
    handler: async (ctx, args) => {
        await getAdminUser(ctx, args.adminId);
        const referrals = await ctx.db.query("referrals")
            .withIndex("by_campaign", q => q.eq("campaign_id", args.campaignId))
            .collect();

        for (const r of referrals) {
            if (r.status === "completed") {
                await ctx.db.patch(r._id, { status: "pending" });
            }
        }

        return { success: true, resetCount: referrals.filter(r => r.status === "pending").length };
    },
});

export const generateCampaignUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const resolveUploadUrl = mutation({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId as Id<"_storage">);
        if (!url) throw new Error("Failed to resolve upload URL");
        return url;
    },
});
