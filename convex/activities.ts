import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const getUserActivities = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let activities;
    if (args.category) {
      activities = await ctx.db
        .query("user_activities")
        .withIndex("by_category", q => q.eq("user_id", args.userId).eq("category", args.category))
        .order("desc")
        .take(limit + 1);
    } else {
      activities = await ctx.db
        .query("user_activities")
        .withIndex("by_user_created", q => q.eq("user_id", args.userId))
        .order("desc")
        .take(limit + 1);
    }

    if (args.status) {
      activities = activities.filter(a => a.status === args.status);
    }

    if (args.search) {
      const q = args.search.toLowerCase();
      activities = activities.filter(a =>
        a.action.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }

    const hasMore = activities.length > limit;
    if (hasMore) activities = activities.slice(0, limit);

    return {
      activities,
      hasMore,
      cursor: hasMore ? activities[activities.length - 1]?._id : null,
    };
  },
});

export const getUserActivitySummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("user_activities")
      .withIndex("by_user_created", q => q.eq("user_id", args.userId))
      .collect();

    const totalWalletFunding = all
      .filter(a => a.category === "wallet" && a.status === "success" && a.amount)
      .reduce((sum, a) => sum + (a.amount ?? 0), 0);

    const totalPurchases = all.filter(a =>
      a.category === "payment" && a.status === "success"
    ).length;

    const failedPayments = all.filter(a =>
      a.category === "payment" && a.status === "failed"
    ).length;

    const activeSubscriptions = all.filter(a =>
      a.category === "subscription" &&
      (a.action === "Subscription purchased" || a.action === "Subscription renewed" || a.action === "User joined group")
    ).length;

    const lastActivity = all.length > 0
      ? all.reduce((latest, a) => a.created_at > latest.created_at ? a : latest)
      : null;

    return {
      totalTransactions: all.length,
      totalWalletFunding,
      totalPurchases,
      failedPayments,
      activeSubscriptions,
      lastActivityDate: lastActivity?.created_at ?? null,
    };
  },
});

interface ActivityEvent {
  id: string;
  source: string;
  category: string;
  action: string;
  description: string;
  status: string;
  amount: number | null;
  reference: string | null;
  metadata: Record<string, any> | null;
  created_at: number;
}

export const getUserActivityTimeline = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const events: ActivityEvent[] = [];

    // 1. User registration
    const user = await ctx.db.get(args.userId);
    if (user) {
      events.push({
        id: `user-${user._id}`,
        source: "users",
        category: "account",
        action: "Joined JoinTheQ",
        description: "Account created",
        status: "success",
        amount: null,
        reference: null,
        metadata: { userId: user._id },
        created_at: user.created_at,
      });
    }

    // 2. Logged activities
    const loggedActivities = await ctx.db
      .query("user_activities")
      .withIndex("by_user_created", q => q.eq("user_id", args.userId))
      .order("desc")
      .take(200);
    for (const a of loggedActivities) {
      const ref = a.metadata?.reference || a.metadata?.transaction_id || a.metadata?.payment_reference || null;
      events.push({
        id: `activity-${a._id}`,
        source: "user_activities",
        category: a.category,
        action: a.action,
        description: a.description ?? "",
        status: a.status ?? "success",
        amount: a.amount ?? null,
        reference: ref,
        metadata: a.metadata ?? null,
        created_at: a.created_at,
      });
    }

    // 3. Wallet transactions
    const walletTxns = await ctx.db
      .query("wallet_transactions")
      .withIndex("by_user", q => q.eq("user_id", args.userId))
      .order("desc")
      .take(200);
    for (const t of walletTxns) {
      const actionMap: Record<string, string> = {
        funding: "Wallet Funded",
        withdrawal: "Wallet Withdrawal",
        credit: "Wallet Credit",
        debit: "Wallet Debit",
        payment: "Payment Made",
        refund: "Refund Received",
        adjustment: "Wallet Adjusted",
      };
      events.push({
        id: `wallet-${t._id}`,
        source: "wallet_transactions",
        category: "wallet",
        action: actionMap[t.type] || `Wallet ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}`,
        description: t.description || `${t.type}: ₦${Math.abs(t.amount).toLocaleString()}`,
        status: t.status === "completed" ? "success" : t.status,
        amount: t.amount,
        reference: t.reference || null,
        metadata: { wallet_type: t.wallet_type, source: t.source, fee: t.fee },
        created_at: t.created_at,
      });
    }

    // 4. Subscription slots
    const userSlots = await ctx.db
      .query("subscription_slots")
      .withIndex("by_user", q => q.eq("user_id", args.userId))
      .order("desc")
      .take(100);
    for (const s of userSlots) {
      const actionLabel = s.status === "filled" ? "Slot Assigned" :
        s.status === "open" ? "Slot Removed" : "Slot Updated";
      events.push({
        id: `slot-${s._id}`,
        source: "subscription_slots",
        category: "subscription",
        action: actionLabel,
        description: s.profile_name ? `${s.profile_name} (${s.status})` : `Slot status: ${s.status}`,
        status: s.status === "filled" ? "success" : s.status === "open" ? "cancelled" : "pending",
        amount: null,
        reference: s.subscription_id,
        metadata: { slot_number: s.slot_number, profile_name: s.profile_name, renewal_date: s.renewal_date },
        created_at: s.created_at ?? Date.now(),
      });
    }

    // 5. Raffle entries
    const raffleEntries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
    for (const r of raffleEntries) {
      events.push({
        id: `raffle-entry-${r._id}`,
        source: "raffle_entries",
        category: "raffle",
        action: "Joined Raffle",
        description: `Entered using ${r.ticketCount} ticket${r.ticketCount !== 1 ? "s" : ""} · #${r.raffleNumber}`,
        status: "success",
        amount: null,
        reference: r.raffleNumber,
        metadata: { raffleId: r.raffleId, ticketCount: r.ticketCount, raffleNumber: r.raffleNumber },
        created_at: r.enteredAt,
      });
    }

    // 6. Raffle winners
    const raffleWins = await ctx.db
      .query("raffle_winners")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    for (const w of raffleWins) {
      events.push({
        id: `raffle-win-${w._id}`,
        source: "raffle_winners",
        category: "raffle",
        action: "Won Raffle",
        description: `Prize: ₦${w.prize.toLocaleString()}`,
        status: "success",
        amount: w.prize,
        reference: null,
        metadata: { raffleId: w.raffleId, position: w.position },
        created_at: w.announcedAt,
      });
    }

    // 7. Raffle referrals
    const raffleRefs = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", q => q.eq("inviterId", args.userId))
      .order("desc")
      .take(100);
    for (const ref of raffleRefs) {
      events.push({
        id: `raffle-ref-${ref._id}`,
        source: "raffle_referrals",
        category: "referral",
        action: ref.status === "completed" ? "Referral Completed" : ref.status === "pending" ? "Referral Pending" : "Referral",
        description: ref.inviteeName ? `Referred ${ref.inviteeName}` : "Referral recorded",
        status: ref.status === "completed" ? "success" : ref.status === "pending" ? "pending" : "failed",
        amount: ref.rewardTickets ?? null,
        reference: null,
        metadata: { inviteeName: ref.inviteeName, rewardTickets: ref.rewardTickets, rewardGranted: ref.rewardGranted },
        created_at: ref.createdAt,
      });
    }

    // 8. Boots transactions
    const bootTxns = await ctx.db
      .query("boot_transactions")
      .withIndex("by_user", q => q.eq("user_id", args.userId))
      .order("desc")
      .take(100);
    for (const b of bootTxns) {
      events.push({
        id: `boot-${b._id}`,
        source: "boot_transactions",
        category: "rewards",
        action: b.amount > 0 ? "Boots Earned" : "Boots Spent",
        description: b.description || `${b.amount > 0 ? "Earned" : "Spent"} ${Math.abs(b.amount)} boots`,
        status: "success",
        amount: b.amount,
        reference: null,
        metadata: { type: b.type, task_id: b.task_id },
        created_at: b.created_at,
      });
    }

    // 9. Login history
    const loginLogs = await ctx.db
      .query("user_login_logs")
      .withIndex("by_user", q => q.eq("user_id", args.userId))
      .order("desc")
      .take(100);
    for (const l of loginLogs) {
      events.push({
        id: `login-${l._id}`,
        source: "user_login_logs",
        category: "account",
        action: l.success ? "Logged In" : "Login Failed",
        description: l.success ? `Signed in via ${l.provider}` : `Failed login via ${l.provider}${l.failure_reason ? `: ${l.failure_reason}` : ""}`,
        status: l.success ? "success" : "failed",
        amount: null,
        reference: null,
        metadata: { provider: l.provider, ip: l.ip_address },
        created_at: l.created_at,
      });
    }

    // 10. Admin actions on this user
    const adminLogs = await ctx.db
      .query("admin_logs")
      .withIndex("by_target", q => q.eq("target_type", "user").eq("target_id", args.userId))
      .order("desc")
      .take(100);
    for (const al of adminLogs) {
      const admin = al.admin_id ? await ctx.db.get(al.admin_id) : null;
      events.push({
        id: `admin-log-${al._id}`,
        source: "admin_logs",
        category: "admin",
        action: al.action || "Admin Action",
        description: al.details || al.reason || `Action by ${admin?.full_name || "Admin"}`,
        status: "success",
        amount: null,
        reference: null,
        metadata: { admin_name: admin?.full_name || "Unknown", action_type: al.action_type, reason: al.reason },
        created_at: al.created_at,
      });
    }

    // Apply filters
    let filtered = events;

    if (args.category) {
      filtered = filtered.filter(e => e.category === args.category);
    }
    if (args.status) {
      filtered = filtered.filter(e => e.status === args.status);
    }
    if (args.dateFrom) {
      filtered = filtered.filter(e => e.created_at >= args.dateFrom!);
    }
    if (args.dateTo) {
      filtered = filtered.filter(e => e.created_at <= args.dateTo!);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.reference && e.reference.toLowerCase().includes(q)) ||
        (e.amount !== null && String(e.amount).includes(q))
      );
    }

    // Sort by created_at desc, then by id for stability
    filtered.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id));

    // Paginate
    let startIdx = 0;
    if (args.cursor) {
      // Find the first event with created_at <= cursor (to get the next page)
      const idx = filtered.findIndex(e => e.created_at <= args.cursor!);
      if (idx > 0) startIdx = idx;
    }
    const page = filtered.slice(startIdx, startIdx + limit);
    const hasMore = startIdx + limit < filtered.length;
    const lastEvent = page.length > 0 ? page[page.length - 1] : null;

    return {
      activities: page,
      hasMore,
      cursor: lastEvent?.created_at ?? null,
      total: filtered.length,
    };
  },
});
