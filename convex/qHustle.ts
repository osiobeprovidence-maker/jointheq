import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const SETTINGS_KEY = "default";
const DEFAULT_PAYOUT_AMOUNT = 150;
const MIN_WITHDRAWAL_AMOUNT = 3000;

async function getSettingsRow(ctx: any) {
  return await ctx.db
    .query("q_hustle_settings")
    .withIndex("by_setting_key", (q: any) => q.eq("setting_key", SETTINGS_KEY))
    .unique();
}

async function ensureSettingsRow(ctx: any, updatedBy?: Id<"users">, payoutAmount?: number) {
  const now = Date.now();
  const settings = await getSettingsRow(ctx);

  if (!settings) {
    const id = await ctx.db.insert("q_hustle_settings", {
      setting_key: SETTINGS_KEY,
      payout_amount: payoutAmount ?? DEFAULT_PAYOUT_AMOUNT,
      updated_at: now,
      ...(updatedBy ? { updated_by: updatedBy } : {}),
    });
    return await ctx.db.get(id);
  }

  if (typeof payoutAmount === "number") {
    await ctx.db.patch(settings._id, {
      payout_amount: payoutAmount,
      updated_at: now,
      ...(updatedBy ? { updated_by: updatedBy } : {}),
    });
    return await ctx.db.get(settings._id);
  }

  return settings;
}

async function getUserReferrals(ctx: any, userId: Id<"users">) {
  return await ctx.db
    .query("q_hustle_referrals")
    .withIndex("by_referrer", (q: any) => q.eq("referrer_id", userId))
    .order("desc")
    .collect();
}

async function getUserWithdrawals(ctx: any, userId: Id<"users">) {
  return await ctx.db
    .query("q_hustle_withdrawals")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .order("desc")
    .collect();
}

function buildStats(referrals: any[], withdrawals: any[]) {
  const approvedReferrals = referrals.filter((ref) => ref.status === "approved");
  const pendingReferrals = referrals.filter((ref) => ref.status === "pending");
  const approvedWithdrawals = withdrawals.filter((wd) => wd.status === "approved");
  const pendingWithdrawals = withdrawals.filter((wd) => wd.status === "pending");

  const totalEarnings = approvedReferrals.reduce((sum, ref) => sum + (ref.earnings || 0), 0);
  const totalWithdrawn = approvedWithdrawals.reduce((sum, wd) => sum + (wd.amount || 0), 0);
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, wd) => sum + (wd.amount || 0), 0);

  return {
    totalReferrals: referrals.length,
    approvedReferrals: approvedReferrals.length,
    pendingReferrals: pendingReferrals.length,
    totalEarnings,
    availableBalance: totalEarnings - totalWithdrawn - pendingWithdrawalAmount,
  };
}

async function assertAdmin(ctx: any, adminId: Id<"users">) {
  const admin = await ctx.db.get(adminId);
  if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
    throw new Error("Admin access required");
  }
  return admin;
}

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await getSettingsRow(ctx);
    return {
      payoutAmount: settings?.payout_amount ?? DEFAULT_PAYOUT_AMOUNT,
      minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
    };
  },
});

export const getUserDashboard = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    const settings = await getSettingsRow(ctx);
    const referrals = await getUserReferrals(ctx, args.userId);
    const withdrawals = await getUserWithdrawals(ctx, args.userId);
    const stats = buildStats(referrals, withdrawals);

    return {
      user: {
        _id: user._id,
        full_name: user.full_name,
        referral_code: user.referral_code,
      },
      settings: {
        payoutAmount: settings?.payout_amount ?? DEFAULT_PAYOUT_AMOUNT,
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
      },
      referrals,
      withdrawals,
      stats,
      referralLink: `/register/${user.referral_code}`,
    };
  },
});

export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    const settings = await getSettingsRow(ctx);
    const referrals = await ctx.db.query("q_hustle_referrals").withIndex("by_created_at").order("desc").collect();
    const withdrawals = await ctx.db.query("q_hustle_withdrawals").withIndex("by_requested_at").order("desc").collect();
    const users = await ctx.db.query("users").collect();
    const userById = new Map(users.map((user: any) => [String(user._id), user]));

    const referralTotals = new Map<string, { userId: string; total: number; approved: number; earnings: number }>();
    for (const referral of referrals) {
      const key = String(referral.referrer_id);
      const current = referralTotals.get(key) || {
        userId: key,
        total: 0,
        approved: 0,
        earnings: 0,
      };
      current.total += 1;
      if (referral.status === "approved") {
        current.approved += 1;
        current.earnings += referral.earnings || 0;
      }
      referralTotals.set(key, current);
    }

    const topPerformers = [...referralTotals.values()]
      .sort((a, b) => b.approved - a.approved || b.earnings - a.earnings)
      .slice(0, 10)
      .map((entry) => {
        const user = userById.get(entry.userId);
        return {
          ...entry,
          name: user?.full_name || user?.username || `User ${entry.userId.slice(-6)}`,
          referralCode: user?.referral_code,
        };
      });

    const stats = buildStats(referrals, withdrawals);

    return {
      settings: {
        payoutAmount: settings?.payout_amount ?? DEFAULT_PAYOUT_AMOUNT,
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
      },
      referrals,
      withdrawals,
      topPerformers,
      stats,
    };
  },
});

export const updatePayoutAmount = mutation({
  args: {
    adminId: v.id("users"),
    payoutAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await assertAdmin(ctx, args.adminId);
    if (!Number.isFinite(args.payoutAmount) || args.payoutAmount < 50) {
      throw new Error("Payout amount must be at least ₦50");
    }

    const now = Date.now();
    await ensureSettingsRow(ctx, admin._id, args.payoutAmount);

    return { success: true };
  },
});

export const approveReferral = mutation({
  args: {
    adminId: v.id("users"),
    referralId: v.id("q_hustle_referrals"),
  },
  handler: async (ctx, args) => {
    const admin = await assertAdmin(ctx, args.adminId);
    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");
    if (referral.status === "approved") return { success: true };
    if (referral.status === "rejected") throw new Error("Rejected referrals cannot be approved");

    const settings = await getSettingsRow(ctx);
    const now = Date.now();
    await ctx.db.patch(args.referralId, {
      status: "approved",
      earnings: settings?.payout_amount ?? DEFAULT_PAYOUT_AMOUNT,
      approved_at: now,
      approved_by: admin._id,
      updated_at: now,
      rejection_reason: undefined,
    });

    return { success: true };
  },
});

export const rejectReferral = mutation({
  args: {
    adminId: v.id("users"),
    referralId: v.id("q_hustle_referrals"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await assertAdmin(ctx, args.adminId);
    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");

    const now = Date.now();
    await ctx.db.patch(args.referralId, {
      status: "rejected",
      earnings: 0,
      approved_at: undefined,
      approved_by: undefined,
      rejection_reason: args.reason?.trim() || "Rejected by admin",
      updated_at: now,
    });

    return { success: true };
  },
});

export const requestWithdrawal = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Enter a valid withdrawal amount");
    }

    const settings = await getSettingsRow(ctx);
    const referrals = await getUserReferrals(ctx, args.userId);
    const withdrawals = await getUserWithdrawals(ctx, args.userId);
    const stats = buildStats(referrals, withdrawals);
    const minWithdrawal = MIN_WITHDRAWAL_AMOUNT;

    if (args.amount < minWithdrawal) {
      throw new Error(`Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}`);
    }
    if (args.amount > stats.availableBalance) {
      throw new Error("Withdrawal amount exceeds your available balance");
    }

    await ctx.db.insert("q_hustle_withdrawals", {
      user_id: args.userId,
      amount: args.amount,
      status: "pending",
      requested_at: Date.now(),
    });

    return {
      success: true,
      payoutAmount: settings?.payout_amount ?? DEFAULT_PAYOUT_AMOUNT,
    };
  },
});

export const approveWithdrawal = mutation({
  args: {
    adminId: v.id("users"),
    withdrawalId: v.id("q_hustle_withdrawals"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminId);
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");

    await ctx.db.patch(args.withdrawalId, {
      status: "approved",
      processed_at: Date.now(),
      processed_by: args.adminId,
    });

    return { success: true };
  },
});

export const rejectWithdrawal = mutation({
  args: {
    adminId: v.id("users"),
    withdrawalId: v.id("q_hustle_withdrawals"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminId);
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");

    await ctx.db.patch(args.withdrawalId, {
      status: "rejected",
      processed_at: Date.now(),
      processed_by: args.adminId,
      admin_note: args.reason?.trim() || "Rejected by admin",
    });

    return { success: true };
  },
});
