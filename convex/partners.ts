import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
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

// ─── ADMIN: CREATE PARTNER ───

export const createPartner = mutation({
  args: {
    fullName: v.string(),
    username: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    partnerType: v.string(),
    referralCode: v.optional(v.string()),
    commissionPerQualified: v.number(),
    paymentSchedule: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingPartner = await ctx.db
      .query("partners")
      .withIndex("by_username", (q: any) => q.eq("username", args.username))
      .first();
    if (existingPartner) throw new Error("Username already taken");

    const existingEmail = await ctx.db
      .query("partners")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();
    if (existingEmail) throw new Error("Email already in use");

    const passwordHash = await bcrypt.hash(args.password, 10);
    const partnerId = await generatePartnerId(ctx);
    const referralCode = args.referralCode || generateReferralCode(args.username);
    const now = Date.now();

    await ctx.db.insert("partners", {
      fullName: args.fullName,
      username: args.username,
      email: args.email,
      phone: args.phone,
      profileImageUrl: args.profileImageUrl,
      partnerType: args.partnerType,
      referralCode,
      commissionPerQualified: args.commissionPerQualified,
      paymentSchedule: args.paymentSchedule,
      status: args.status,
      notes: args.notes,
      passwordHash,
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
      createdBy: identity.subject as Id<"users">,
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
        partnerId: "" as any, // will update after getting the partner
        campaignName: campaign.name,
        campaignSlug: campaign.slug,
        commission: args.commissionPerQualified,
        status: "active",
        createdAt: now,
        createdBy: identity.subject as Id<"users">,
      });
    }

    return { partnerId, referralCode };
  },
});

// ─── ADMIN: UPDATE PARTNER ───

export const updatePartner = mutation({
  args: {
    partnerId: v.id("partners"),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    partnerType: v.optional(v.string()),
    commissionPerQualified: v.optional(v.number()),
    paymentSchedule: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.partnerId);
    if (!existing) throw new Error("Partner not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.profileImageUrl !== undefined) updates.profileImageUrl = args.profileImageUrl;
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
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.partnerId);
  },
});

// ─── ADMIN: LIST ALL PARTNERS ───

export const listPartners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partners").order("desc").collect();
  },
});

// ─── ADMIN: GET SINGLE PARTNER ───

export const getPartner = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.partnerId);
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
