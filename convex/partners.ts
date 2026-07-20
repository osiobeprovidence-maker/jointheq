import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import bcrypt from "bcryptjs";

// ─── HELPERS ───

async function generatePartnerId(ctx: any): Promise<string> {
  const count = await ctx.db.query("partners").collect();
  const num = count.length + 1;
  return `PTN-${String(num).padStart(4, "0")}`;
}

function generateReferralCode(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ─── SEARCH EXISTING USERS (for admin assignment) ───

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const q = args.query.trim().toLowerCase();
    if (q.length < 2) return [];

    // Collect existing partner userIds to exclude
    const existingPartners = await ctx.db.query("partners").collect();
    const existingUserIds = new Set(
      existingPartners
        .filter((p) => p.userId)
        .map((p) => p.userId!.toString())
    );

    const users = await ctx.db.query("users").take(500);

    return users
      .filter((u) => {
        if (existingUserIds.has(u._id.toString())) return false;
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          username.includes(q) ||
          phone.includes(q)
        );
      })
      .slice(0, 20)
      .map((u) => ({
        _id: u._id,
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        profile_image_url: u.profile_image_url,
      }));
  },
});

// ─── LIST ALL REGISTERED USERS (for admin assignment) ───

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const existingPartners = await ctx.db.query("partners").collect();
    const existingUserIds = new Set(
      existingPartners
        .filter((p) => p.userId)
        .map((p) => p.userId!.toString())
    );

    const users = await ctx.db.query("users").collect();

    return users
      .filter((u) => !existingUserIds.has(u._id.toString()))
      .map((u) => ({
        _id: u._id,
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        profile_image_url: u.profile_image_url,
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  },
});

export const createPartner = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
    partnerType: v.string(),
    commissionPerQualified: v.number(),
    paymentSchedule: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Check not already a partner
    const existing = await ctx.db
      .query("partners")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
    if (existing) throw new Error("This user is already registered as a partner");

    const partnerId = await generatePartnerId(ctx);
    const referralCode = generateReferralCode(user.username || user.email);
    const now = Date.now();

    const partnerDocId = await ctx.db.insert("partners", {
      userId: args.userId,
      partnerType: args.partnerType,
      referralCode,
      commissionPerQualified: args.commissionPerQualified,
      paymentSchedule: args.paymentSchedule,
      status: args.status,
      notes: args.notes,
      partnerId,
      totalClicks: 0,
      totalRegistrations: 0,
      qualifiedReferrals: 0,
      activeSubscribers: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      totalEarnings: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: admin._id,
    });

    // Create default campaign assignments
    const defaultCampaigns = [
      { name: "Spotify", slug: "spotify" },
      { name: "Raffle", slug: "raffle" },
      { name: "Netflix", slug: "netflix" },
      { name: "CapCut", slug: "capcut" },
    ];

    for (const campaign of defaultCampaigns) {
      await ctx.db.insert("partner_campaigns", {
        partnerId: partnerDocId,
        campaignName: campaign.name,
        campaignSlug: campaign.slug,
        commission: args.commissionPerQualified,
        status: "active",
        createdAt: now,
        createdBy: admin._id,
      });
    }

    return { partnerId, referralCode };
  },
});

// ─── ADMIN: UPDATE PARTNER ───

export const updatePartner = mutation({
  args: {
    partnerId: v.id("partners"),
    adminId: v.id("users"),
    partnerType: v.optional(v.string()),
    commissionPerQualified: v.optional(v.number()),
    paymentSchedule: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");

    const existing = await ctx.db.get(args.partnerId);
    if (!existing) throw new Error("Partner not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.partnerType !== undefined) updates.partnerType = args.partnerType;
    if (args.commissionPerQualified !== undefined) updates.commissionPerQualified = args.commissionPerQualified;
    if (args.paymentSchedule !== undefined) updates.paymentSchedule = args.paymentSchedule;
    if (args.status !== undefined) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.partnerId, updates);
  },
});

// ─── ADMIN: DELETE PARTNER ───

export const deletePartner = mutation({
  args: { partnerId: v.id("partners"), adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");
    await ctx.db.delete(args.partnerId);
  },
});

// ─── ADMIN: LIST ALL PARTNERS ───

export const listPartners = query({
  args: {},
  handler: async (ctx) => {
    const partners = await ctx.db.query("partners").order("desc").collect();

    // Enrich with user data for userId-linked partners
    return await Promise.all(
      partners.map(async (p) => {
        if (p.userId) {
          const user = await ctx.db.get(p.userId);
          if (user) {
            return {
              ...p,
              fullName: user.full_name,
              username: user.username,
              email: user.email,
              phone: user.phone,
              profileImageUrl: user.profile_image_url,
            };
          }
        }
        return p;
      })
    );
  },
});

// ─── ADMIN: GET SINGLE PARTNER ───

export const getPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.partnerId);
    if (!p) return null;
    if (p.userId) {
      const user = await ctx.db.get(p.userId);
      if (user) {
        return {
          ...p,
          fullName: user.full_name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          profileImageUrl: user.profile_image_url,
        };
      }
    }
    return p;
  },
});

export const getPartnerByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partners")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();
  },
});

// ─── PARTNER: LOGIN ───

export const partnerLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (!partner) throw new Error("Invalid email or password");
    if (partner.status === "suspended") throw new Error("Account suspended");
    if (partner.status === "paused") throw new Error("Account paused");

    const valid = await bcrypt.compare(args.password, partner.passwordHash);
    if (!valid) throw new Error("Invalid email or password");

    await ctx.db.patch(partner._id, { lastLoginAt: Date.now() });

    return {
      _id: partner._id,
      fullName: partner.fullName,
      username: partner.username,
      email: partner.email,
      partnerType: partner.partnerType,
      referralCode: partner.referralCode,
      partnerId: partner.partnerId,
      profileImageUrl: partner.profileImageUrl,
      status: partner.status,
      commissionPerQualified: partner.commissionPerQualified,
      paymentSchedule: partner.paymentSchedule,
    };
  },
});

// ─── PARTNER: GET BY USER ID ───

export const getPartnerByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partners")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
  },
});

// ─── PARTNER: GET DASHBOARD ───

export const getPartnerDashboard = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) throw new Error("Partner not found");

    const campaigns = await ctx.db
      .query("partner_campaigns")
      .withIndex("by_partner_status", (q: any) =>
        q.eq("partnerId", args.partnerId).eq("status", "active")
      )
      .collect();

    const clicks = await ctx.db
      .query("partner_clicks")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .collect();

    const referrals = await ctx.db
      .query("partner_referrals")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .collect();

    const earnings = await ctx.db
      .query("partner_earnings")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();

    const payments = await ctx.db
      .query("partner_payments")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();

    return {
      partner,
      campaigns,
      clicks,
      referrals,
      earnings,
      payments,
    };
  },
});

// ─── TRACK CLICK ───

export const trackClick = mutation({
  args: {
    referralCode: v.string(),
    campaignSlug: v.string(),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .withIndex("by_referral_code", (q: any) => q.eq("referralCode", args.referralCode))
      .first();

    if (!partner) return { tracked: false, reason: "invalid_code" };
    if (partner.status !== "active") return { tracked: false, reason: "partner_inactive" };

    await ctx.db.insert("partner_clicks", {
      partnerId: partner._id,
      campaignSlug: args.campaignSlug,
      referralCode: args.referralCode,
      device: args.device,
      browser: args.browser,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: Date.now(),
    });

    await ctx.db.patch(partner._id, {
      totalClicks: partner.totalClicks + 1,
    });

    return { tracked: true, partnerId: partner._id };
  },
});

// ─── RECORD REFERRAL (called when a referred user registers) ───

export const recordReferral = mutation({
  args: {
    partnerId: v.id("partners"),
    campaignSlug: v.string(),
    userId: v.id("users"),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) throw new Error("Partner not found");

    await ctx.db.insert("partner_referrals", {
      partnerId: args.partnerId,
      campaignSlug: args.campaignSlug,
      userId: args.userId,
      userEmail: args.userEmail,
      qualified: false,
      status: "registered",
      commission: partner.commissionPerQualified,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.partnerId, {
      totalRegistrations: partner.totalRegistrations + 1,
    });
  },
});

// ─── QUALIFY REFERRAL (called when user meets qualification criteria) ───

export const qualifyReferral = mutation({
  args: {
    referralId: v.id("partner_referrals"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");

    const partner = await ctx.db.get(referral.partnerId);
    if (!partner) throw new Error("Partner not found");

    await ctx.db.patch(args.referralId, {
      qualified: true,
      qualifiedAt: Date.now(),
      status: args.status,
      updatedAt: Date.now(),
    });

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Update partner stats
    await ctx.db.patch(referral.partnerId, {
      qualifiedReferrals: partner.qualifiedReferrals + 1,
      pendingEarnings: partner.pendingEarnings + referral.commission,
      totalEarnings: partner.totalEarnings + referral.commission,
    });

    // Upsert monthly earnings
    const existingEarning = await ctx.db
      .query("partner_earnings")
      .withIndex("by_partner_period", (q: any) =>
        q.eq("partnerId", referral.partnerId).eq("period", period)
      )
      .first();

    if (existingEarning) {
      await ctx.db.patch(existingEarning._id, {
        qualifiedReferrals: existingEarning.qualifiedReferrals + 1,
        total: existingEarning.total + referral.commission,
      });
    } else {
      await ctx.db.insert("partner_earnings", {
        partnerId: referral.partnerId,
        period,
        qualifiedReferrals: 1,
        commission: partner.commissionPerQualified,
        total: referral.commission,
        status: "pending",
        createdAt: Date.now(),
      });
    }

    // ─── CAMPAIGN ENGINE: Evaluate this referral against all active campaigns ───
    // The partner's user ID links the partners table to the campaigns system
    const partnerUserId = partner.userId;
    if (partnerUserId) {
      const myCampaignParticipants = await ctx.db
        .query("campaign_participants")
        .withIndex("by_user", (q) => q.eq("user_id", partnerUserId))
        .collect();

      for (const participant of myCampaignParticipants) {
        const campaign = await ctx.db.get(participant.campaign_id);
        if (!campaign || campaign.status !== "active") continue;
        if (campaign.end_date && (campaign.end_date as number) < Date.now()) continue;

        // Dedup: check if this referred user already has a campaign_referral for this campaign
        const existingCampaignRef = await ctx.db
          .query("campaign_referrals")
          .withIndex("by_referrer", (q) => q.eq("referrer_id", partnerUserId))
          .filter((q) =>
            q.and(
              q.eq(q.field("campaign_id"), participant.campaign_id),
              q.eq(q.field("referred_id"), referral.userId as any)
            )
          )
          .first();

        if (existingCampaignRef) continue; // Already tracked in this campaign

        // Calculate campaign-specific rewards
        let ticketsAwarded = 0;
        let campaignCash = 0;
        let campaignBoots = 0;

        const isRaffle = campaign.campaign_type === "q_raffle" || campaign.type === "raffle";

        if (isRaffle) {
          // Raffle campaigns award entries per qualified referral
          ticketsAwarded = (campaign as any).entries_per_referral ?? 1;
        }

        // Check if campaign has its own reward rules
        if (campaign.referral_boots) {
          campaignBoots = campaign.referral_boots;
        }

        // Create campaign_referral record
        await ctx.db.insert("campaign_referrals", {
          campaign_id: participant.campaign_id,
          referrer_id: partnerUserId,
          referred_id: referral.userId as any,
          status: "active",
          commission_earned: referral.commission,
          created_at: Date.now(),
        });

        // Update campaign participant stats
        const updates: Record<string, any> = {
          referral_count: (participant.referral_count ?? 0) + 1,
          qualified_referrals: (participant.qualified_referrals ?? 0) + 1,
          campaign_earnings: (participant.campaign_earnings ?? 0) + (referral.commission ?? 0),
          last_active: Date.now(),
        };

        if (ticketsAwarded > 0) {
          updates.entries = (participant.entries ?? 0) + ticketsAwarded;
        }
        if (campaignBoots > 0) {
          updates.boots_earned = (participant.boots_earned ?? 0) + campaignBoots;
        }

        await ctx.db.patch(participant._id, updates);

        // Credit boots to the user's wallet if applicable
        if (campaignBoots > 0) {
          const partnerUser = await ctx.db.get(partnerUserId);
          if (partnerUser) {
            await ctx.db.patch(partnerUserId, {
              boots_balance: (partnerUser.boots_balance ?? 0) + campaignBoots,
            });
          }
        }

        // Send notification about campaign reward
        const referredUser = await ctx.db.get(referral.userId as any);
        const referredName = referredUser?.full_name || referredUser?.email || "Someone";

        if (ticketsAwarded > 0) {
          try {
            const { createNotification } = await import("./notificationHelpers");
            await createNotification(ctx, {
              userId: partnerUserId,
              title: "🎉 Raffle Ticket Earned",
              message: `${referredName} completed a qualifying action. You earned ${ticketsAwarded} ticket(s) in "${campaign.name}"!`,
              type: "promotion",
              ctaText: "View Campaign",
              ctaUrl: `/dashboard?tab=partnership`,
            });
          } catch (e) {
            // Notification helper might not be importable in mutation context
            // Fallback: insert directly
            try {
              await ctx.db.insert("notifications", {
                user_id: partnerUserId,
                title: "🎉 Raffle Ticket Earned",
                message: `${referredName} completed a qualifying action. You earned ${ticketsAwarded} ticket(s) in "${campaign.name}"!`,
                type: "promotion",
                is_read: false,
                created_at: Date.now(),
              });
            } catch {}
          }
        } else {
          try {
            await ctx.db.insert("notifications", {
              user_id: partnerUserId,
              title: "🎉 Campaign Reward Earned",
              message: `${referredName} qualified for "${campaign.name}". Your campaign progress has been updated.`,
              type: "promotion",
              is_read: false,
              created_at: Date.now(),
            });
          } catch {}
        }
      }
    }
  },
});

// ─── ADMIN: PROCESS PAYMENT ───

export const processPayment = mutation({
  args: {
    partnerId: v.id("partners"),
    amount: v.number(),
    period: v.string(),
    transactionReference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const partner = await ctx.db.get(args.partnerId);
    if (!partner) throw new Error("Partner not found");

    await ctx.db.insert("partner_payments", {
      partnerId: args.partnerId,
      amount: args.amount,
      period: args.period,
      status: "paid",
      transactionReference: args.transactionReference,
      paidAt: Date.now(),
      notes: args.notes,
      createdAt: Date.now(),
      processedBy: identity.subject as Id<"users">,
    });

    await ctx.db.patch(args.partnerId, {
      pendingEarnings: Math.max(0, partner.pendingEarnings - args.amount),
      paidEarnings: partner.paidEarnings + args.amount,
    });

    // Mark earnings as paid
    const earnings = await ctx.db
      .query("partner_earnings")
      .withIndex("by_partner_period", (q: any) =>
        q.eq("partnerId", args.partnerId).eq("period", args.period)
      )
      .first();

    if (earnings) {
      await ctx.db.patch(earnings._id, {
        status: "paid",
        paidAt: Date.now(),
      });
    }
  },
});

// ─── ADMIN: SEND ANNOUNCEMENT ───

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("partner_announcements", {
      title: args.title,
      body: args.body,
      priority: args.priority || "normal",
      createdAt: Date.now(),
      createdBy: identity.subject as Id<"users">,
    });
  },
});

// ─── GET ANNOUNCEMENTS ───

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("partner_announcements")
      .order("desc")
      .collect();
  },
});

// ─── ADMIN: MANAGE CAMPAIGNS ───

export const updatePartnerCampaign = mutation({
  args: {
    campaignId: v.id("partner_campaigns"),
    status: v.optional(v.string()),
    commission: v.optional(v.number()),
    description: v.optional(v.string()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.commission !== undefined) updates.commission = args.commission;
    if (args.description !== undefined) updates.description = args.description;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    await ctx.db.patch(args.campaignId, updates);
  },
});

// ─── ADMIN: ADD CAMPAIGN TO PARTNER ───

export const addPartnerCampaign = mutation({
  args: {
    partnerId: v.id("partners"),
    campaignName: v.string(),
    campaignSlug: v.string(),
    commission: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("partner_campaigns", {
      partnerId: args.partnerId,
      campaignName: args.campaignName,
      campaignSlug: args.campaignSlug,
      commission: args.commission,
      description: args.description,
      status: "active",
      createdAt: Date.now(),
      createdBy: identity.subject as Id<"users">,
    });
  },
});

// ─── ADMIN: GET PARTNER REFERRALS ───

export const getPartnerReferrals = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partner_referrals")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();
  },
});

// ─── ADMIN: GET PARTNER CLICKS ───

export const getPartnerClicks = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partner_clicks")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();
  },
});

// ─── ADMIN: GET PARTNER EARNINGS ───

export const getPartnerEarnings = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partner_earnings")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();
  },
});

// ─── ADMIN: GET PARTNER PAYMENTS ───

export const getPartnerPayments = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partner_payments")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();
  },
});

// ─── ADMIN: OVERALL ANALYTICS ───

export const getPartnerAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const partners = await ctx.db.query("partners").collect();
    const activePartners = partners.filter(p => p.status === "active");
    const totalClicks = partners.reduce((sum, p) => sum + p.totalClicks, 0);
    const totalRegistrations = partners.reduce((sum, p) => sum + p.totalRegistrations, 0);
    const qualifiedReferrals = partners.reduce((sum, p) => sum + p.qualifiedReferrals, 0);
    const totalCommissionOwed = partners.reduce((sum, p) => sum + p.pendingEarnings, 0);

    // Top performing partners
    const topPartners = [...partners]
      .sort((a, b) => b.qualifiedReferrals - a.qualifiedReferrals)
      .slice(0, 10);

    // Recent referrals
    const allReferrals = await ctx.db
      .query("partner_referrals")
      .order("desc")
      .take(50);

    const conversionRate = totalClicks > 0
      ? ((qualifiedReferrals / totalClicks) * 100).toFixed(1)
      : "0.0";

    return {
      totalPartners: partners.length,
      activePartners: activePartners.length,
      totalClicks,
      totalRegistrations,
      qualifiedReferrals,
      totalCommissionOwed,
      topPartners,
      recentReferrals: allReferrals,
      conversionRate,
    };
  },
});

// ─── ADMIN: MANAGE QUALIFICATION RULES ───

export const getQualificationRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partner_qualification_rules").collect();
  },
});

export const updateQualificationRule = mutation({
  args: {
    ruleId: v.id("partner_qualification_rules"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(args.ruleId, {
      enabled: args.enabled,
      updatedAt: Date.now(),
      updatedBy: identity.subject as Id<"users">,
    });
  },
});

export const seedQualificationRules = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("partner_qualification_rules").collect();
    if (existing.length > 0) return;

    const rules = [
      { name: "Account Created", key: "account_created", enabled: true },
      { name: "Email Verified", key: "email_verified", enabled: true },
      { name: "Phone Verified", key: "phone_verified", enabled: false },
      { name: "First Subscription Purchased", key: "first_subscription", enabled: true },
      { name: "Spotify Slot Joined", key: "spotify_joined", enabled: false },
      { name: "Payment Completed", key: "payment_completed", enabled: true },
    ];

    const now = Date.now();
    for (const rule of rules) {
      await ctx.db.insert("partner_qualification_rules", {
        ...rule,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// ─── ADMIN: MARKETING ASSETS ───

export const createMarketingAsset = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    url: v.string(),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    downloadable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("partner_marketing_assets", {
      title: args.title,
      description: args.description,
      type: args.type,
      url: args.url,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      downloadable: args.downloadable,
      createdAt: Date.now(),
      createdBy: identity.subject as Id<"users">,
    });
  },
});

export const getMarketingAssets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partner_marketing_assets").order("desc").collect();
  },
});
