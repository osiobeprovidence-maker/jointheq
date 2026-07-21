import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── HELPERS ───────────────────────────────────────────

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), identity.email)).first();
  if (!user?.is_admin) throw new Error("Not admin");
  return user;
}

function getPartnerIdForUser(user: any): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("partner_id") : null;
}

// ─── BANK DETAILS ──────────────────────────────────────

export const getMyBankDetails = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), identity.email)).first();
    if (!user) return null;
    return await ctx.db.query("partner_bank_details").withIndex("by_user", (q: any) => q.eq("userId", user._id)).first();
  },
});

export const saveBankDetails = mutation({
  args: {
    bank_name: v.string(),
    account_number: v.string(),
    account_name: v.string(),
    preferred_currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), identity.email)).first();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db.query("partner_bank_details").withIndex("by_user", (q: any) => q.eq("userId", user._id)).first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bank_name: args.bank_name,
        account_number: args.account_number,
        account_name: args.account_name,
        preferred_currency: args.preferred_currency,
        verification_status: "pending",
        updated_at: now,
      });
    } else {
      await ctx.db.insert("partner_bank_details", {
        userId: user._id,
        bank_name: args.bank_name,
        account_number: args.account_number,
        account_name: args.account_name,
        preferred_currency: args.preferred_currency || "NGN",
        verification_status: "pending",
        created_at: now,
        updated_at: now,
      });
    }
    return { success: true };
  },
});

export const adminListBankDetails = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    let details = await ctx.db.query("partner_bank_details").collect();
    if (args.status) {
      details = details.filter((d) => d.verification_status === args.status);
    }
    const userIds = [...new Set(details.map((d) => d.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = Object.fromEntries(users.filter(Boolean).map((u) => [u!._id.toString(), u]));
    return details.map((d) => ({
      ...d,
      user: userMap[d.userId.toString()] || null,
    }));
  },
});

export const adminVerifyBankDetail = mutation({
  args: {
    detailId: v.id("partner_bank_details"),
    status: v.union(v.literal("verified"), v.literal("rejected"), v.literal("disabled")),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const detail = await ctx.db.get(args.detailId);
    if (!detail) throw new Error("Bank detail not found");
    await ctx.db.patch(args.detailId, {
      verification_status: args.status,
      verified_at: Date.now(),
      verified_by: admin._id,
      admin_note: args.adminNote,
    });
    return { success: true };
  },
});

// ─── PAYOUT REQUESTS ───────────────────────────────────

export const getMyPayoutRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), identity.email)).first();
    if (!user) return [];
    return await ctx.db.query("partner_payout_requests")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const createPayoutRequest = mutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), identity.email)).first();
    if (!user) throw new Error("User not found");

    const bank = await ctx.db.query("partner_bank_details")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (!bank) throw new Error("Please save your bank details before requesting a payout");
    if (bank.verification_status !== "verified") throw new Error("Your bank details must be verified before requesting a payout");

    const settings = await ctx.db.query("partnership_settings").collect();
    const minWithdrawal = settings.find((s) => s.key === "minimum_withdrawal")?.value || 5000;
    if (args.amount < minWithdrawal) throw new Error(`Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}`);

    const partner = await ctx.db.query("partners").withIndex("by_userId", (q: any) => q.eq("userId", user._id)).first();
    const partnerId = partner?._id;

    await ctx.db.insert("partner_payout_requests", {
      userId: user._id,
      partnerId,
      amount: args.amount,
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      account_name: bank.account_name,
      status: "pending",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

export const adminListPayoutRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    let requests = await ctx.db.query("partner_payout_requests")
      .withIndex("by_created_at", (q: any) => q.order("desc"))
      .collect();
    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }
    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = Object.fromEntries(users.filter(Boolean).map((u) => [u!._id.toString(), u]));
    return requests.map((r) => ({
      ...r,
      user: userMap[r.userId.toString()] || null,
    }));
  },
});

export const adminProcessPayoutRequest = mutation({
  args: {
    requestId: v.id("partner_payout_requests"),
    status: v.union(v.literal("approved"), v.literal("processing"), v.literal("completed"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Payout request not found");
    await ctx.db.patch(args.requestId, {
      status: args.status,
      admin_note: args.adminNote,
      transaction_reference: args.transactionReference,
      processed_at: Date.now(),
      processed_by: admin._id,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

// ─── ACHIEVEMENTS ──────────────────────────────────────

export const listAchievements = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partnership_achievements")
      .withIndex("by_active", (q: any) => q.eq("is_active", true))
      .collect();
  },
});

export const getUserAchievements = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), identity.email)).first();
    if (!user) return [];

    const achievements = await ctx.db.query("partnership_achievements").collect();
    const userAchievements = await ctx.db.query("user_partnership_achievements")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId.toString()));

    return achievements.map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a._id.toString()),
      progress: userAchievements.find((ua) => ua.achievementId.toString() === a._id.toString())?.progress || 0,
      max_progress: userAchievements.find((ua) => ua.achievementId.toString() === a._id.toString())?.max_progress || 0,
      unlocked_at: userAchievements.find((ua) => ua.achievementId.toString() === a._id.toString())?.unlocked_at || null,
    }));
  },
});

export const adminListAllAchievements = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    return await ctx.db.query("partnership_achievements").order("desc").collect();
  },
});

export const adminCreateAchievement = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    badge_color: v.optional(v.string()),
    criteria_type: v.optional(v.string()),
    criteria_value: v.optional(v.number()),
    reward_boots: v.optional(v.number()),
    reward_commission_bonus: v.optional(v.number()),
    is_active: v.boolean(),
    display_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.insert("partnership_achievements", {
      ...args,
      created_by: admin._id,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

export const adminUpdateAchievement = mutation({
  args: {
    achievementId: v.id("partnership_achievements"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    badge_color: v.optional(v.string()),
    criteria_type: v.optional(v.string()),
    criteria_value: v.optional(v.number()),
    reward_boots: v.optional(v.number()),
    reward_commission_bonus: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const { achievementId, ...fields } = args;
    await ctx.db.patch(achievementId, { ...fields, updated_at: Date.now() });
    return { success: true };
  },
});

export const adminDeleteAchievement = mutation({
  args: { achievementId: v.id("partnership_achievements") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.achievementId);
    return { success: true };
  },
});

export const adminAwardAchievement = mutation({
  args: {
    userId: v.id("users"),
    achievementId: v.id("partnership_achievements"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query("user_partnership_achievements")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    if (existing.some((e) => e.achievementId.toString() === args.achievementId.toString())) {
      throw new Error("User already has this achievement");
    }
    await ctx.db.insert("user_partnership_achievements", {
      userId: args.userId,
      achievementId: args.achievementId,
      unlocked_at: Date.now(),
      awarded_by: admin._id,
    });
    return { success: true };
  },
});

// ─── COMMISSION RULES ──────────────────────────────────

export const listCommissionRules = query({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db.query("partnership_commission_rules").collect();
    const catalogIds = rules.map((r) => r.subscription_catalog_id);
    const catalogs = await Promise.all(catalogIds.map((id) => ctx.db.get(id)));
    const catalogMap = Object.fromEntries(catalogs.filter(Boolean).map((c) => [c!._id.toString(), c]));
    return rules.map((r) => ({
      ...r,
      catalog: catalogMap[r.subscription_catalog_id.toString()] || null,
    }));
  },
});

export const adminSaveCommissionRule = mutation({
  args: {
    ruleId: v.optional(v.id("partnership_commission_rules")),
    subscription_catalog_id: v.id("subscription_catalog"),
    commission_type: v.string(),
    commission_value: v.number(),
    recurring_months: v.optional(v.number()),
    max_commission: v.optional(v.number()),
    min_purchase: v.optional(v.number()),
    bonus_campaign_multiplier: v.optional(v.number()),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    if (args.ruleId) {
      const { ruleId, ...fields } = args;
      await ctx.db.patch(ruleId, { ...fields, updated_at: now, updated_by: admin._id });
    } else {
      const { ruleId: _, ...fields } = args;
      await ctx.db.insert("partnership_commission_rules", {
        ...fields,
        created_at: now,
        updated_at: now,
        updated_by: admin._id,
      });
    }
    return { success: true };
  },
});

export const adminDeleteCommissionRule = mutation({
  args: { ruleId: v.id("partnership_commission_rules") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.ruleId);
    return { success: true };
  },
});

// ─── SETTINGS ──────────────────────────────────────────

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("partnership_settings").collect();
    return Object.fromEntries(all.map((s) => [s.key, s.value]));
  },
});

export const adminSaveSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query("partnership_settings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updated_at: Date.now(), updated_by: admin._id });
    } else {
      await ctx.db.insert("partnership_settings", {
        key: args.key,
        value: args.value,
        updated_at: Date.now(),
        updated_by: admin._id,
      });
    }
    return { success: true };
  },
});

// ─── ANALYTICS ─────────────────────────────────────────

export const getAdminAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const partners = await ctx.db.query("partners").collect();
    const payoutRequests = await ctx.db.query("partner_payout_requests").collect();
    const referrals = await ctx.db.query("partner_referrals").collect();
    const achievements = await ctx.db.query("user_partnership_achievements").collect();
    const bankDetails = await ctx.db.query("partner_bank_details").collect();
    const now = Date.now();
    const monthAgo = now - 30 * 86400000;

    const activePartners = partners.filter((p) => p.status === "active");
    const newThisMonth = partners.filter((p) => p.createdAt >= monthAgo);
    const verifiedUsers = referrals.filter((r) => r.qualified);
    const payingUsers = referrals.filter((r) => r.status === "subscribed" || r.status === "qualified");
    const conversionRate = referrals.length > 0 ? (verifiedUsers.length / referrals.length) * 100 : 0;
    const totalRevenue = partners.reduce((sum, p) => sum + p.totalEarnings, 0);
    const paidCommissions = partners.reduce((sum, p) => sum + p.paidEarnings, 0);
    const outstandingCommissions = partners.reduce((sum, p) => sum + p.pendingEarnings, 0);
    const pendingPayouts = payoutRequests.filter((r) => r.status === "pending");
    const pendingBankVerifications = bankDetails.filter((d) => d.verification_status === "pending");

    const topPartners = [...partners]
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10)
      .map((p) => ({ _id: p._id, fullName: p.fullName, totalEarnings: p.totalEarnings, qualifiedReferrals: p.qualifiedReferrals }));

    return {
      totalPartners: partners.length,
      activePartners: activePartners.length,
      inactivePartners: partners.length - activePartners.length,
      newThisMonth: newThisMonth.length,
      totalReferrals: referrals.length,
      qualifiedReferrals: verifiedUsers.length,
      payingUsers: payingUsers.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalRevenue,
      paidCommissions,
      outstandingCommissions,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutsAmount: pendingPayouts.reduce((sum, r) => sum + r.amount, 0),
      pendingBankVerifications: pendingBankVerifications.length,
      totalAchievementsAwarded: achievements.length,
      topPartners,
    };
  },
});

// ─── PARTNER PROFILE (full detail) ─────────────────────

export const adminGetPartnerProfile = query({
  args: { partnerId: v.id("partners") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) throw new Error("Partner not found");

    const user = partner.userId ? await ctx.db.get(partner.userId) : null;
    const referrals = await ctx.db.query("partner_referrals")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .collect();
    const payments = await ctx.db.query("partner_payments")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .collect();
    const earnings = await ctx.db.query("partner_earnings")
      .withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId))
      .collect();
    const bankDetails = partner.userId
      ? await ctx.db.query("partner_bank_details")
          .withIndex("by_user", (q: any) => q.eq("userId", partner.userId!))
          .collect()
      : [];
    const achievements = partner.userId
      ? await ctx.db.query("user_partnership_achievements")
          .withIndex("by_user", (q: any) => q.eq("userId", partner.userId!))
          .collect()
      : [];
    const payoutRequests = partner.userId
      ? await ctx.db.query("partner_payout_requests")
          .withIndex("by_user", (q: any) => q.eq("userId", partner.userId!))
          .collect()
      : [];

    const referredUserIds = [...new Set(referrals.map((r) => r.userId))];
    const referredUsers = await Promise.all(referredUserIds.map((id) => ctx.db.get(id)));

    return {
      partner,
      user,
      referrals,
      payments,
      earnings,
      bankDetails,
      achievements,
      payoutRequests,
      referredUsers: referredUsers.filter(Boolean),
    };
  },
});
