import { v } from "convex/values";
import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { createUserActivityLog } from "./activityHelpers";

function generateRaffleNumber(raffleSlug: string, drawDate: Date, sequence: number): string {
  const prefix = raffleSlug.slice(0, 2).toUpperCase();
  const dateStr = `${drawDate.getFullYear()}${String(drawDate.getMonth() + 1).padStart(2, "0")}${String(drawDate.getDate()).padStart(2, "0")}`;
  return `${prefix}-${dateStr}-${String(sequence).padStart(5, "0")}`;
}

async function hasActiveSpotifySubscription(ctx: any, userId: Id<"users">): Promise<boolean> {
  const slots = await ctx.db
    .query("subscription_slots")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .collect();

  for (const slot of slots) {
    if (slot.status !== "filled" && slot.status !== "closing") continue;
    const account = slot.subscription_id ? await ctx.db.get(slot.subscription_id) : null;
    const platformName = (account as any)?.platform || (account as any)?.name || "";
    if (platformName.toLowerCase() === "spotify") return true;
    const group = slot.group_id ? await ctx.db.get(slot.group_id) : null;
    if (group) {
      const catalog = group.subscription_catalog_id ? await ctx.db.get(group.subscription_catalog_id) : null;
      if (catalog && (catalog as any).name?.toLowerCase() === "spotify") return true;
    }
  }

  const migrated = await ctx.db
    .query("migrated_subscriptions")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .collect();

  for (const m of migrated) {
    if ((m as any).platform?.toLowerCase() === "spotify" && (m as any).status === "active") return true;
  }

  return false;
}

export const getActiveRaffle = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const raffles = await ctx.db
      .query("raffles")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .order("desc")
      .collect();

    if (raffles.length === 0) return null;

    const raffle = raffles[0];

    const entries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", raffle._id))
      .collect();

    const totalTickets = entries.reduce((sum, e) => sum + e.ticketCount, 0);
    const totalEntrants = entries.length;

    const winners = await ctx.db
      .query("raffle_winners")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", raffle._id))
      .order("asc")
      .collect();

    const previousWinners = await Promise.all(
      winners.map(async (w) => {
        const user = await ctx.db.get(w.userId);
        return {
          _id: w._id,
          position: w.position,
          prize: w.prize,
          announcedAt: w.announcedAt,
          winner: user
            ? { _id: user._id, full_name: user.full_name, username: user.username, profile_image_url: user.profile_image_url }
            : null,
        };
      })
    );

    return {
      ...raffle,
      totalTickets,
      totalEntrants,
      previousWinners,
    };
  },
});

export const getRaffleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const raffle = await ctx.db
      .query("raffles")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (!raffle) return null;

    const entries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", raffle._id))
      .collect();

    const totalTickets = entries.reduce((sum, e) => sum + e.ticketCount, 0);
    const totalEntrants = entries.length;

    const winners = await ctx.db
      .query("raffle_winners")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", raffle._id))
      .order("asc")
      .collect();

    const previousWinners = await Promise.all(
      winners.map(async (w) => {
        const user = await ctx.db.get(w.userId);
        return {
          _id: w._id,
          position: w.position,
          prize: w.prize,
          announcedAt: w.announcedAt,
          winner: user
            ? { _id: user._id, full_name: user.full_name, username: user.username, profile_image_url: user.profile_image_url }
            : null,
        };
      })
    );

    return {
      ...raffle,
      totalTickets,
      totalEntrants,
      previousWinners,
    };
  },
});

export const getUserEntry = query({
  args: { raffleId: v.id("raffles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", args.raffleId).eq("userId", args.userId)
      )
      .unique();

    return entry || null;
  },
});

export const getUserTickets = query({
  args: { raffleId: v.id("raffles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", args.raffleId).eq("userId", args.userId)
      )
      .unique();

    if (!entry) return { totalTickets: 0, initialEntry: 0, referralBonus: 0, bonusTaskTickets: 0 };

    const referrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", (q: any) => q.eq("inviterId", args.userId))
      .filter((q: any) => q.eq(q.field("raffleId"), args.raffleId))
      .collect();

    const completedReferrals = referrals.filter((r: any) => r.status === "completed");
    const referralBonus = completedReferrals.reduce((sum, r) => sum + (r.rewardTickets || 0), 0);

    const bonusCompletions = await ctx.db
      .query("user_bonus_completions")
      .withIndex("by_user_raffle", (q: any) =>
        q.eq("userId", args.userId).eq("raffleId", args.raffleId)
      )
      .collect();

    const bonusTaskTickets = bonusCompletions.reduce((sum, c) => sum + c.ticketsAwarded, 0);

    return {
      totalTickets: entry.ticketCount + referralBonus + bonusTaskTickets,
      initialEntry: entry.ticketCount,
      referralBonus,
      bonusTaskTickets,
    };
  },
});

export const getUserReferrals = query({
  args: { raffleId: v.id("raffles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", (q: any) => q.eq("inviterId", args.userId))
      .filter((q: any) => q.eq(q.field("raffleId"), args.raffleId))
      .order("desc")
      .collect();

    return referrals;
  },
});

export const checkEligibility = query({
  args: { raffleId: v.id("raffles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) return { eligible: false, reason: "raffle_not_found" };

    if (raffle.status !== "published" && raffle.status !== "closed") {
      return { eligible: false, reason: "raffle_not_open" };
    }

    const existingEntry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", args.raffleId).eq("userId", args.userId)
      )
      .unique();

    if (existingEntry) {
      return { eligible: false, reason: "already_entered", entry: existingEntry };
    }

    if (raffle.drawDate < Date.now()) {
      return { eligible: false, reason: "draw_passed" };
    }

    const hasSpotify = await hasActiveSpotifySubscription(ctx, args.userId);
    if (!hasSpotify) {
      return { eligible: false, reason: "no_spotify_subscription" };
    }

    return { eligible: true, reason: "eligible" };
  },
});

export const enterRaffle = mutation({
  args: {
    raffleId: v.id("raffles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) throw new Error("Raffle not found");

    if (raffle.status !== "published") throw new Error("Raffle is not open for entries");

    if (raffle.drawDate < Date.now()) throw new Error("Raffle draw date has passed");

    const existingEntry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", args.raffleId).eq("userId", args.userId)
      )
      .unique();

    if (existingEntry) throw new Error("You have already entered this raffle");

    const hasSpotify = await hasActiveSpotifySubscription(ctx, args.userId);
    if (!hasSpotify) throw new Error("You need an active Spotify subscription to enter");

    const allEntries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    const entryNum = allEntries.length + 1;
    const drawDate = new Date(raffle.drawDate);
    const raffleNumber = generateRaffleNumber(raffle.slug, drawDate, entryNum);

    const ticketCount = 1;

    await ctx.db.insert("raffle_entries", {
      raffleId: args.raffleId,
      userId: args.userId,
      raffleNumber,
      ticketCount,
      enteredAt: Date.now(),
    });

    try { await createUserActivityLog(ctx, { userId: args.userId, category: "raffle", action: "Raffle entered", description: `Entered "${raffle.title}" — Ticket #${raffleNumber}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

    return {
      success: true,
      raffleNumber,
      ticketCount,
      entryNum,
    };
  },
});

export const createReferral = mutation({
  args: {
    raffleId: v.id("raffles"),
    inviterId: v.id("users"),
    inviteeName: v.string(),
    inviteeEmail: v.optional(v.string()),
    inviteePhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.inviteeEmail && !args.inviteePhone) {
      throw new Error("Email or phone number is required");
    }

    if (!args.inviteeName.trim()) {
      throw new Error("Friend name is required");
    }

    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) throw new Error("Raffle not found");

    const existingEntry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", args.raffleId).eq("userId", args.inviterId)
      )
      .unique();

    if (!existingEntry) throw new Error("You must enter the raffle before inviting friends");

    if (args.inviteeEmail) {
      const normalizedEmail = args.inviteeEmail.toLowerCase().trim();
      if (normalizedEmail) {
        const existingByEmail = await ctx.db
          .query("raffle_referrals")
          .withIndex("by_invitee_email", (q: any) => q.eq("inviteeEmail", normalizedEmail))
          .filter((q: any) =>
            q.and(
              q.eq(q.field("raffleId"), args.raffleId),
              q.eq(q.field("inviterId"), args.inviterId)
            )
          )
          .collect();

        if (existingByEmail.length > 0) throw new Error("You already invited this person");
      }
    }

    if (args.inviteePhone) {
      const normalizedPhone = args.inviteePhone.trim();
      if (normalizedPhone) {
        const existingByPhone = await ctx.db
          .query("raffle_referrals")
          .withIndex("by_invitee_phone", (q: any) => q.eq("inviteePhone", normalizedPhone))
          .filter((q: any) =>
            q.and(
              q.eq(q.field("raffleId"), args.raffleId),
              q.eq(q.field("inviterId"), args.inviterId)
            )
          )
          .collect();

        if (existingByPhone.length > 0) throw new Error("You already invited this person");
      }
    }

    const referralId = await ctx.db.insert("raffle_referrals", {
      raffleId: args.raffleId,
      inviterId: args.inviterId,
      inviteeName: args.inviteeName.trim(),
      inviteeEmail: args.inviteeEmail?.toLowerCase().trim() || undefined,
      inviteePhone: args.inviteePhone?.trim() || undefined,
      inviteeUserId: undefined,
      status: "pending",
      rewardGranted: false,
      rewardTickets: raffle.referralReward,
      createdAt: Date.now(),
    });

    return { success: true, referralId };
  },
});

export const completeReferral = mutation({
  args: {
    referralId: v.id("raffle_referrals"),
    inviteeUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");
    if (referral.status !== "pending") throw new Error("Referral already completed or expired");

    const hasSpotify = await hasActiveSpotifySubscription(ctx, args.inviteeUserId);
    if (!hasSpotify) throw new Error("Invitee does not have an active Spotify subscription");

    const raffle = await ctx.db.get(referral.raffleId);
    if (!raffle) throw new Error("Raffle not found");

    await ctx.db.patch(args.referralId, {
      status: "completed",
      inviteeUserId: args.inviteeUserId,
      rewardGranted: true,
      completedAt: Date.now(),
    });

    const entry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", referral.raffleId).eq("userId", referral.inviterId)
      )
      .unique();

    if (entry) {
      await ctx.db.patch(entry._id, {
        ticketCount: entry.ticketCount + raffle.referralReward,
      });
    }

    try { await createUserActivityLog(ctx, { userId: referral.inviterId, category: "raffle", action: "Referral completed", description: `Referral "${referral.inviteeName}" joined — earned ${raffle.referralReward} bonus ${raffle.referralReward === 1 ? "ticket" : "tickets"}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

    return { success: true, rewardTickets: raffle.referralReward };
  },
});

function weightedRandomSelect(entries: any[], count: number): any[] {
  const pool = [...entries];
  const selected: any[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, e) => sum + e.ticketCount, 0);
    let random = Math.random() * totalWeight;
    let chosen = 0;
    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].ticketCount;
      if (random <= 0) { chosen = j; break; }
    }
    selected.push(pool[chosen]);
    pool.splice(chosen, 1);
  }
  return selected;
}

export const scheduleNextDraw = mutation({
  args: {
    raffleId: v.id("raffles"),
  },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) return { success: false, error: "Raffle not found" };

    const freq = raffle.frequency || "one_time";
    if (freq === "one_time") return { success: false, error: "One-time raffle cannot schedule next draw" };

    const nextDraw = calculateNextDrawDate(freq, raffle.drawDay, raffle.drawTime, Date.now(), raffle.endDate);
    if (!nextDraw) {
      await ctx.db.patch(args.raffleId, { status: "completed", updatedAt: Date.now(), nextDrawDate: undefined });
      return { success: false, error: "No future draw date available (ended)" };
    }

    const currentRound = (raffle.drawRound || 0) + 1;
    await ctx.db.patch(args.raffleId, {
      status: "published",
      nextDrawDate: nextDraw,
      lastDrawDate: Date.now(),
      drawRound: currentRound,
      updatedAt: Date.now(),
      winnerAnnounced: false,
    });

    try {
      const adminLogs = await ctx.db.query("admin_logs").withIndex("by_user", (q: any) => q.eq("user_id", raffle.createdBy)).order("desc").take(1);
      const adminId = raffle.createdBy;
      await createUserActivityLog(ctx, { userId: adminId, category: "raffle", action: "New draw round scheduled", description: `Round ${currentRound} scheduled for ${new Date(nextDraw).toLocaleString()}`, status: "success" });
    } catch (e) { console.error("Failed to log activity:", e); }

    return { success: true, nextDrawDate: nextDraw, drawRound: currentRound };
  },
});

export const drawWinner = action({
  args: {
    raffleId: v.id("raffles"),
    adminId: v.id("users"),
    autoMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.users.getById, { id: args.adminId });
    if (!args.autoMode && (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super"))) {
      throw new Error("Admin access required");
    }

    const raffle = await ctx.runQuery(internal.raffle.getRaffleById, { raffleId: args.raffleId });
    if (!raffle) throw new Error("Raffle not found");

    const entries = await ctx.runQuery(internal.raffle.getAllEntries, { raffleId: args.raffleId });
    if (entries.length === 0) throw new Error("No entries in this raffle");

    const numWinners = raffle.numberOfWinners || 1;
    const breakdown = raffle.prizeBreakdown || computePrizeBreakdown(raffle.prizeAmount, numWinners, raffle.prizes?.filter((p: any) => p.amount > 0 && p.label.trim()));
    const selected = weightedRandomSelect(entries, numWinners);

    const winners: any[] = [];
    for (let i = 0; i < selected.length; i++) {
      const prize = breakdown[i] || breakdown[breakdown.length - 1];
      await ctx.runMutation(internal.raffle.insertWinner, {
        raffleId: args.raffleId,
        userId: selected[i].userId,
        prize: prize.amount,
        position: prize.position,
        drawRound: raffle.drawRound || 0,
      });
      const wUser = await ctx.runQuery(internal.users.getById, { id: selected[i].userId });
      winners.push({
        userId: selected[i].userId,
        name: wUser?.full_name || wUser?.username || `User ${selected[i].userId.slice(-8)}`,
        raffleNumber: selected[i].raffleNumber,
        ticketCount: selected[i].ticketCount,
        prize: prize.amount,
        position: prize.position,
      });
      try {
        await ctx.runMutation(internal.raffle.logWinnerActivity, {
          userId: selected[i].userId,
          raffleTitle: raffle.title,
          prize: prize.amount,
          position: prize.position,
        });
      } catch (e) { console.error("Failed to log winner activity:", e); }
    }

    const freq = raffle.frequency || "one_time";
    const isRecurring = freq !== "one_time";
    const autoNext = raffle.autoGenerateNext;
    const shouldScheduleNext = isRecurring && autoNext;

    if (shouldScheduleNext) {
      await ctx.runMutation(internal.raffle.scheduleNextDraw, { raffleId: args.raffleId });
    } else if (isRecurring) {
      const nextDraw = calculateNextDrawDate(freq, raffle.drawDay, raffle.drawTime, Date.now(), raffle.endDate);
      await ctx.runMutation(internal.raffle.updateRaffleStatus, {
        raffleId: args.raffleId,
        status: nextDraw ? "published" : "completed",
        nextDrawDate: nextDraw,
        drawRound: (raffle.drawRound || 0) + 1,
      });
    } else {
      await ctx.runMutation(internal.raffle.updateRaffleStatus, {
        raffleId: args.raffleId,
        status: raffle.autoPublish ? "published" : "completed",
      });
    }

    return {
      success: true,
      winners,
      audit: {
        totalEntries: entries.length,
        totalTickets: entries.reduce((sum: number, e: any) => sum + e.ticketCount, 0),
        timestamp: Date.now(),
        adminId: args.adminId,
        autoMode: args.autoMode || false,
        nextRoundScheduled: shouldScheduleNext,
      },
    };
  },
});

export const getAllRaffles = query({
  args: {},
  handler: async (ctx) => {
    const raffles = await ctx.db.query("raffles").order("desc").collect();
    return raffles;
  },
});

function calculateNextDrawDate(frequency: string, drawDay: number | undefined, drawTime: string | undefined, startDate: number, endDate?: number): number | null {
  const now = Date.now();
  const start = Math.max(now, startDate);

  if (frequency === "one_time" || !frequency) {
    return startDate;
  }

  if (drawDay === undefined || !drawTime) return null;

  const [hours, minutes] = drawTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const candidate = new Date(start);

  if (frequency === "weekly") {
    const dayOfWeek = drawDay % 7;
    const currentDay = candidate.getDay();
    let daysUntil = (dayOfWeek - currentDay + 7) % 7;
    if (daysUntil === 0 && candidate.getHours() * 60 + candidate.getMinutes() >= hours * 60 + minutes) {
      daysUntil = 7;
    }
    candidate.setDate(candidate.getDate() + daysUntil);
  } else if (frequency === "monthly") {
    const targetDay = Math.min(drawDay, 28);
    if (candidate.getDate() > targetDay || (candidate.getDate() === targetDay && candidate.getHours() * 60 + candidate.getMinutes() >= hours * 60 + minutes)) {
      candidate.setMonth(candidate.getMonth() + 1);
    }
    candidate.setDate(targetDay);
  }

  candidate.setHours(hours, minutes, 0, 0);
  const ts = candidate.getTime();

  if (endDate && ts > endDate) return null;
  return ts;
}

function computePrizeBreakdown(totalPrize: number, numberOfWinners: number, customTiers?: { label: string; amount: number }[]): { position: number; label: string; amount: number }[] {
  if (customTiers && customTiers.length > 0) {
    return customTiers.map((t, i) => ({ position: i + 1, label: t.label, amount: t.amount }));
  }
  if (numberOfWinners <= 1) return [{ position: 1, label: "1st Prize", amount: totalPrize }];

  const breakdown: { position: number; label: string; amount: number }[] = [];
  let remaining = totalPrize;
  for (let i = 1; i <= numberOfWinners; i++) {
    const share = i === numberOfWinners ? remaining : Math.round(totalPrize * (numberOfWinners - i + 1) / (numberOfWinners * (numberOfWinners + 1) / 2));
    const labels = ["1st Prize", "2nd Prize", "3rd Prize", "4th Prize", "5th Prize"];
    breakdown.push({ position: i, label: labels[i - 1] || `${i}th Prize`, amount: share });
    remaining -= share;
  }
  return breakdown;
}

async function ensureUniqueSlug(ctx: any, baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const existing = await ctx.db
      .query("raffles")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique();
    if (!existing || (excludeId && existing._id === excludeId)) return slug;
    attempt++;
    if (attempt === 1) slug = `${baseSlug}-2`;
    else if (attempt === 2) slug = `${baseSlug}-${new Date().getFullYear()}`;
    else slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
}

export const createRaffle = mutation({
  args: {
    adminId: v.id("users"),
    title: v.string(),
    slug: v.string(),
    banner: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    description: v.string(),
    prizeAmount: v.number(),
    prizes: v.optional(v.array(v.object({
      amount: v.number(),
      label: v.string(),
    }))),
    drawDate: v.number(),
    eligibilityType: v.string(),
    referralReward: v.number(),
    // New scheduling args
    frequency: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("one_time"))),
    drawDay: v.optional(v.number()),
    drawTime: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    autoDraw: v.optional(v.boolean()),
    autoPublish: v.optional(v.boolean()),
    autoNotify: v.optional(v.boolean()),
    autoGenerateNext: v.optional(v.boolean()),
    autoLockEntries: v.optional(v.boolean()),
    numberOfWinners: v.optional(v.number()),
    prizeBreakdown: v.optional(v.array(v.object({
      position: v.number(),
      label: v.string(),
      amount: v.number(),
    }))),
    eligiblePlans: v.optional(v.array(v.string())),
    minSubscriptionAge: v.optional(v.number()),
    minReferrals: v.optional(v.number()),
    region: v.optional(v.string()),
    // New fields
    referralEnabled: v.optional(v.boolean()),
    maxReferralTickets: v.optional(v.number()),
    maxReferralsPerUser: v.optional(v.number()),
    referralCampaignStart: v.optional(v.number()),
    referralCampaignEnd: v.optional(v.number()),
    eligibilityRules: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.string(),
    }))),
    notificationSettings: v.optional(v.object({
      onEntry: v.boolean(),
      onReferral: v.boolean(),
      onWinnerAnnounce: v.boolean(),
      onDrawReminder: v.boolean(),
      onPrizeClaimed: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
      return { success: false, error: "Admin access required" };
    }

    const uniqueSlug = await ensureUniqueSlug(ctx, args.slug.trim().toLowerCase());
    const now = Date.now();
    const freq = args.frequency || "one_time";
    const numWinners = args.numberOfWinners || 1;

    const customTiers = args.prizes?.filter(p => p.amount > 0 && p.label.trim());
    const breakdown = args.prizeBreakdown || computePrizeBreakdown(args.prizeAmount, numWinners, customTiers);

    const startDate = args.startDate || args.drawDate;
    const nextDraw = calculateNextDrawDate(freq, args.drawDay, args.drawTime, startDate, args.endDate);

    const id = await ctx.db.insert("raffles", {
      title: args.title.trim(),
      slug: uniqueSlug,
      banner: args.banner,
      accentColor: args.accentColor,
      description: args.description.trim(),
      prizeAmount: args.prizeAmount,
      prizes: args.prizes,
      drawDate: args.drawDate,
      status: "draft",
      eligibilityType: args.eligibilityType,
      referralReward: args.referralReward,
      createdBy: args.adminId,
      createdAt: now,
      updatedAt: now,
      // New scheduling fields
      frequency: freq as "weekly" | "monthly" | "one_time",
      drawDay: args.drawDay,
      drawTime: args.drawTime,
      startDate,
      endDate: args.endDate,
      nextDrawDate: nextDraw,
      // Automation
      autoDraw: args.autoDraw ?? false,
      autoPublish: args.autoPublish ?? false,
      autoNotify: args.autoNotify ?? false,
      autoGenerateNext: args.autoGenerateNext ?? false,
      autoLockEntries: args.autoLockEntries ?? false,
      // Prize config
      numberOfWinners: numWinners,
      prizeBreakdown: breakdown,
      // Eligibility
      eligiblePlans: args.eligiblePlans,
      minSubscriptionAge: args.minSubscriptionAge,
      minReferrals: args.minReferrals,
      region: args.region,
      // Round tracking
      drawRound: 0,
      // Referral settings
      referralEnabled: args.referralEnabled ?? true,
      maxReferralTickets: args.maxReferralTickets,
      maxReferralsPerUser: args.maxReferralsPerUser,
      referralCampaignStart: args.referralCampaignStart,
      referralCampaignEnd: args.referralCampaignEnd,
      // Eligibility rules
      eligibilityRules: args.eligibilityRules,
      // Notification settings
      notificationSettings: args.notificationSettings ?? { onEntry: true, onReferral: true, onWinnerAnnounce: true, onDrawReminder: true, onPrizeClaimed: true },
    });

    try { await createUserActivityLog(ctx, { userId: args.adminId, category: "admin", action: "Raffle created", description: `Created raffle "${args.title}" (/${uniqueSlug})`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

    return { success: true, raffleId: id, slug: uniqueSlug };
  },
});

export const updateRaffle = mutation({
  args: {
    adminId: v.id("users"),
    raffleId: v.id("raffles"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    banner: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    description: v.optional(v.string()),
    prizeAmount: v.optional(v.number()),
    prizes: v.optional(v.array(v.object({
      amount: v.number(),
      label: v.string(),
    }))),
    drawDate: v.optional(v.number()),
    status: v.optional(v.string()),
    eligibilityType: v.optional(v.string()),
    referralReward: v.optional(v.number()),
    frequency: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("one_time"))),
    drawDay: v.optional(v.number()),
    drawTime: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    autoDraw: v.optional(v.boolean()),
    autoPublish: v.optional(v.boolean()),
    autoNotify: v.optional(v.boolean()),
    autoGenerateNext: v.optional(v.boolean()),
    autoLockEntries: v.optional(v.boolean()),
    numberOfWinners: v.optional(v.number()),
    prizeBreakdown: v.optional(v.array(v.object({
      position: v.number(),
      label: v.string(),
      amount: v.number(),
    }))),
    eligiblePlans: v.optional(v.array(v.string())),
    minSubscriptionAge: v.optional(v.number()),
    minReferrals: v.optional(v.number()),
    region: v.optional(v.string()),
    bannerStorageId: v.optional(v.id("_storage")),
    // New referral settings
    referralEnabled: v.optional(v.boolean()),
    maxReferralTickets: v.optional(v.number()),
    maxReferralsPerUser: v.optional(v.number()),
    referralCampaignStart: v.optional(v.number()),
    referralCampaignEnd: v.optional(v.number()),
    // Eligibility rules
    eligibilityRules: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.string(),
    }))),
    // Notification settings
    notificationSettings: v.optional(v.object({
      onEntry: v.boolean(),
      onReferral: v.boolean(),
      onWinnerAnnounce: v.boolean(),
      onDrawReminder: v.boolean(),
      onPrizeClaimed: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
      return { success: false, error: "Admin access required" };
    }

    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) return { success: false, error: "Raffle not found" };

    const updates: Record<string, any> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.slug !== undefined) updates.slug = await ensureUniqueSlug(ctx, args.slug.trim().toLowerCase(), args.raffleId);
    if (args.banner !== undefined) updates.banner = args.banner;
    if (args.accentColor !== undefined) updates.accentColor = args.accentColor;
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.prizeAmount !== undefined) updates.prizeAmount = args.prizeAmount;
    if (args.prizes !== undefined) updates.prizes = args.prizes;
    if (args.drawDate !== undefined) updates.drawDate = args.drawDate;
    if (args.status !== undefined) updates.status = args.status;
    if (args.eligibilityType !== undefined) updates.eligibilityType = args.eligibilityType;
    if (args.referralReward !== undefined) updates.referralReward = args.referralReward;
    if (args.frequency !== undefined) updates.frequency = args.frequency;
    if (args.drawDay !== undefined) updates.drawDay = args.drawDay;
    if (args.drawTime !== undefined) updates.drawTime = args.drawTime;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.autoDraw !== undefined) updates.autoDraw = args.autoDraw;
    if (args.autoPublish !== undefined) updates.autoPublish = args.autoPublish;
    if (args.autoNotify !== undefined) updates.autoNotify = args.autoNotify;
    if (args.autoGenerateNext !== undefined) updates.autoGenerateNext = args.autoGenerateNext;
    if (args.autoLockEntries !== undefined) updates.autoLockEntries = args.autoLockEntries;
    if (args.numberOfWinners !== undefined) updates.numberOfWinners = args.numberOfWinners;
    if (args.prizeBreakdown !== undefined) updates.prizeBreakdown = args.prizeBreakdown;
    if (args.eligiblePlans !== undefined) updates.eligiblePlans = args.eligiblePlans;
    if (args.minSubscriptionAge !== undefined) updates.minSubscriptionAge = args.minSubscriptionAge;
    if (args.minReferrals !== undefined) updates.minReferrals = args.minReferrals;
    if (args.region !== undefined) updates.region = args.region;
    if (args.bannerStorageId !== undefined) updates.banner = args.bannerStorageId;
    if (args.referralEnabled !== undefined) updates.referralEnabled = args.referralEnabled;
    if (args.maxReferralTickets !== undefined) updates.maxReferralTickets = args.maxReferralTickets;
    if (args.maxReferralsPerUser !== undefined) updates.maxReferralsPerUser = args.maxReferralsPerUser;
    if (args.referralCampaignStart !== undefined) updates.referralCampaignStart = args.referralCampaignStart;
    if (args.referralCampaignEnd !== undefined) updates.referralCampaignEnd = args.referralCampaignEnd;
    if (args.eligibilityRules !== undefined) updates.eligibilityRules = args.eligibilityRules;
    if (args.notificationSettings !== undefined) updates.notificationSettings = args.notificationSettings;

    // Recalculate nextDrawDate when schedule changes
    const freq = args.frequency || raffle.frequency || "one_time";
    const dd = args.drawDay ?? raffle.drawDay;
    const dt = args.drawTime ?? raffle.drawTime;
    const sd = args.startDate ?? raffle.startDate ?? raffle.drawDate;
    const ed = args.endDate ?? raffle.endDate;
    if (args.frequency !== undefined || args.drawDay !== undefined || args.drawTime !== undefined || args.startDate !== undefined || args.endDate !== undefined) {
      updates.nextDrawDate = calculateNextDrawDate(freq as string, dd, dt, sd, ed);
    }

    await ctx.db.patch(args.raffleId, updates);

    try { await createUserActivityLog(ctx, { userId: args.adminId, category: "admin", action: "Raffle updated", description: `Updated raffle "${raffle.title}"`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

    return { success: true, slug: updates.slug || raffle.slug };
  },
});

export const publishWinner = mutation({
  args: {
    adminId: v.id("users"),
    raffleId: v.id("raffles"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.raffleId, {
      winnerAnnounced: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getAllEntries = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();
  },
});

export const getRaffleById = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.raffleId);
  },
});

export const getRaffleWinners = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("raffle_winners")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();
  },
});

export const insertWinner = mutation({
  args: {
    raffleId: v.id("raffles"),
    userId: v.id("users"),
    prize: v.number(),
    position: v.number(),
    drawRound: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("raffle_winners", {
      raffleId: args.raffleId,
      userId: args.userId,
      prize: args.prize,
      position: args.position,
      announcedAt: Date.now(),
      drawRound: args.drawRound,
    });

    try { await createUserActivityLog(ctx, { userId: args.userId, category: "raffle", action: "Raffle won", description: `Won position #${args.position} — ₦${args.prize.toLocaleString()} prize`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }
  },
});

export const logWinnerActivity = internalMutation({
  args: {
    userId: v.id("users"),
    raffleTitle: v.string(),
    prize: v.number(),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    try { await createUserActivityLog(ctx, { userId: args.userId, category: "raffle", action: "Raffle won", description: `Won #${args.position} in "${args.raffleTitle}" — ₦${args.prize.toLocaleString()}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }
  },
});

export const updateRaffleStatus = mutation({
  args: {
    raffleId: v.id("raffles"),
    status: v.string(),
    nextDrawDate: v.optional(v.number()),
    drawRound: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.nextDrawDate !== undefined) updates.nextDrawDate = args.nextDrawDate;
    if (args.drawRound !== undefined) updates.drawRound = args.drawRound;
    await ctx.db.patch(args.raffleId, updates);
  },
});

export const getRaffleStats = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) return null;

    const entries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    const referrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    const winners = await ctx.db
      .query("raffle_winners")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    const totalParticipants = entries.length;
    const totalTickets = entries.reduce((sum, e) => sum + e.ticketCount, 0);
    const completedReferrals = referrals.filter((r: any) => r.status === "completed");
    const totalReferrals = completedReferrals.length;
    const nextDraw = raffle.nextDrawDate || raffle.drawDate;
    const daysRemaining = Math.max(0, Math.ceil((nextDraw - Date.now()) / (1000 * 60 * 60 * 24)));
    const totalPrizePaid = winners.reduce((sum, w) => sum + w.prize, 0);
    const referralTickets = completedReferrals.reduce((sum, r) => sum + r.rewardTickets, 0);
    const eligibleUsersCount = totalParticipants; // Will be improved to query actual eligible users

    return {
      totalParticipants,
      totalTickets,
      totalReferrals,
      prizeAmount: raffle.prizeAmount,
      drawDate: raffle.drawDate,
      nextDrawDate: nextDraw,
      lastDrawDate: raffle.lastDrawDate,
      daysRemaining,
      status: raffle.status,
      winnerAnnounced: raffle.winnerAnnounced || false,
      drawRound: raffle.drawRound || 0,
      frequency: raffle.frequency || "one_time",
      drawDay: raffle.drawDay,
      drawTime: raffle.drawTime,
      totalWinners: winners.length,
      totalPrizePaid,
      referralTickets,
      autoDraw: raffle.autoDraw,
      autoPublish: raffle.autoPublish,
      autoGenerateNext: raffle.autoGenerateNext,
      eligibleUsersCount,
    };
  },
});

export const getLeaderboard = query({
  args: { raffleId: v.id("raffles"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxResults = args.limit || 10;
    const entries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    const sorted = entries.sort((a, b) => b.ticketCount - a.ticketCount);
    const top = sorted.slice(0, maxResults);

    const leaderboard = await Promise.all(
      top.map(async (entry, index) => {
        const user = await ctx.db.get(entry.userId);
        return {
          rank: index + 1,
          userId: entry.userId,
          username: user?.username || user?.full_name || "Anonymous",
          ticketCount: entry.ticketCount,
          raffleNumber: entry.raffleNumber,
        };
      })
    );

    return leaderboard;
  },
});

export const getTicketHistory = query({
  args: { raffleId: v.id("raffles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", args.raffleId).eq("userId", args.userId)
      )
      .unique();

    if (!entry) return [];

    const history: { type: string; label: string; tickets: number; date: number }[] = [];

    history.push({
      type: "purchase",
      label: "Spotify Purchase",
      tickets: 1,
      date: entry.enteredAt,
    });

    const referrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", (q: any) => q.eq("inviterId", args.userId))
      .filter((q: any) => q.eq(q.field("raffleId"), args.raffleId))
      .order("desc")
      .collect();

    for (const ref of referrals) {
      if (ref.rewardGranted && ref.status === "completed") {
        history.push({
          type: "referral",
          label: `Referral: ${ref.inviteeName}`,
          tickets: ref.rewardTickets,
          date: ref.completedAt || ref.createdAt,
        });
      }
    }

    return history.sort((a, b) => b.date - a.date);
  },
});

export const getRaffleWinnersWithUsers = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    const winners = await ctx.db
      .query("raffle_winners")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .order("asc")
      .collect();

    return await Promise.all(
      winners.map(async (w) => {
        const user = await ctx.db.get(w.userId);
        return {
          ...w,
          user: user ? {
            _id: user._id,
            full_name: user.full_name,
            username: user.username,
            profile_image_url: user.profile_image_url,
          } : null,
        };
      })
    );
  },
});

export const autoEnterForSpotifyPurchase = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const raffles = await ctx.db
      .query("raffles")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .order("desc")
      .collect();

    if (raffles.length === 0) return { entered: false, reason: "no_active_raffle" };

    const raffle = raffles[0];

    if (raffle.drawDate < Date.now()) return { entered: false, reason: "draw_passed" };

    const existingEntry = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle_user", (q: any) =>
        q.eq("raffleId", raffle._id).eq("userId", args.userId)
      )
      .unique();

    if (existingEntry) return { entered: false, reason: "already_entered" };

    const allEntries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", raffle._id))
      .collect();

    const entryNum = allEntries.length + 1;
    const drawDate = new Date(raffle.drawDate);
    const prefix = raffle.slug.slice(0, 2).toUpperCase();
    const dateStr = `${drawDate.getFullYear()}${String(drawDate.getMonth() + 1).padStart(2, "0")}${String(drawDate.getDate()).padStart(2, "0")}`;
    const raffleNumber = `${prefix}-${dateStr}-${String(entryNum).padStart(5, "0")}`;

    await ctx.db.insert("raffle_entries", {
      raffleId: raffle._id,
      userId: args.userId,
      raffleNumber,
      ticketCount: 1,
      enteredAt: Date.now(),
    });

    try { await createUserActivityLog(ctx, { userId: args.userId, category: "raffle", action: "Auto-entered raffle", description: `Auto-entered "${raffle.title}" via Spotify purchase — Ticket #${raffleNumber}`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }

    const userReferrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", (q: any) => q.eq("inviterId", args.userId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("raffleId"), raffle._id),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    for (const ref of userReferrals) {
      await ctx.db.patch(ref._id, {
        status: "completed",
        rewardGranted: true,
        completedAt: Date.now(),
      });
    }

    return { entered: true, raffleNumber };
  },
});

export const processRaffleReferralOnPurchase = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.referred_by) return { processed: false, reason: "no_referrer" };

    const raffles = await ctx.db
      .query("raffles")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .order("desc")
      .collect();

    if (raffles.length === 0) return { processed: false, reason: "no_active_raffle" };
    const raffle = raffles[0];

    const pendingReferrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", (q: any) => q.eq("inviterId", user.referred_by))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("raffleId"), raffle._id),
          q.eq(q.field("inviteeUserId"), args.userId),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    if (pendingReferrals.length === 0) return { processed: false, reason: "no_pending_referral" };

    for (const ref of pendingReferrals) {
      await ctx.db.patch(ref._id, {
        status: "completed",
        inviteeUserId: args.userId,
        rewardGranted: true,
        completedAt: Date.now(),
      });

      const entry = await ctx.db
        .query("raffle_entries")
        .withIndex("by_raffle_user", (q: any) =>
          q.eq("raffleId", raffle._id).eq("userId", ref.inviterId)
        )
        .unique();

      if (entry) {
        await ctx.db.patch(entry._id, {
          ticketCount: entry.ticketCount + raffle.referralReward,
        });
      }
    }

    return { processed: true, count: pendingReferrals.length };
  },
});

export const getRaffleActivities = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) return [];

    // Fetch all entries with user info
    const entries = await ctx.db
      .query("raffle_entries")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .order("desc")
      .take(50);

    const entryActivities = await Promise.all(
      entries.map(async (e) => {
        const user = await ctx.db.get(e.userId);
        return {
          id: e._id,
          type: "entry" as const,
          action: "User Joined",
          description: `${user?.full_name || user?.username || "Anonymous"} entered the raffle`,
          user: user ? { _id: user._id, full_name: user.full_name, username: user.username, profile_image_url: user.profile_image_url } : null,
          timestamp: e.enteredAt,
          metadata: { raffleNumber: e.raffleNumber, ticketCount: e.ticketCount },
        };
      })
    );

    // Fetch referrals
    const referrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .order("desc")
      .take(50);

    const referralActivities = await Promise.all(
      referrals.map(async (r) => {
        const user = r.inviterId ? await ctx.db.get(r.inviterId) : null;
        return {
          id: r._id,
          type: "referral" as const,
          action: r.status === "completed" ? "Referral Completed" : "Referral Invited",
          description: `${user?.full_name || user?.username || "Anonymous"} invited ${r.inviteeName}${r.status === "completed" ? " (completed)" : ""}`,
          user: user ? { _id: user._id, full_name: user.full_name, username: user.username, profile_image_url: user.profile_image_url } : null,
          timestamp: r.completedAt || r.createdAt,
          metadata: { rewardTickets: r.rewardTickets, status: r.status },
        };
      })
    );

    // Fetch winners
    const winners = await ctx.db
      .query("raffle_winners")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .order("desc")
      .collect();

    const winnerActivities = await Promise.all(
      winners.map(async (w) => {
        const user = await ctx.db.get(w.userId);
        return {
          id: w._id,
          type: "winner" as const,
          action: "Winner Selected",
          description: `${user?.full_name || user?.username || "Anonymous"} won #${w.position} — ₦${w.prize.toLocaleString()}`,
          user: user ? { _id: user._id, full_name: user.full_name, username: user.username, profile_image_url: user.profile_image_url } : null,
          timestamp: w.announcedAt,
          metadata: { position: w.position, prize: w.prize, drawRound: w.drawRound },
        };
      })
    );

    // Combine and sort by date desc
    const all = [...entryActivities, ...referralActivities, ...winnerActivities];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, 100);
  },
});

export const logRaffleActivity = internalMutation({
  args: {
    raffleId: v.id("raffles"),
    activityType: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Log to user_activities for a synthetic "system" user
    try {
      await ctx.db.insert("user_activities", {
        user_id: "" as any,
        category: "raffle",
        action: args.activityType,
        description: args.description,
        status: "success",
        created_at: Date.now(),
      });
    } catch (e) { console.error("Failed to log raffle activity:", e); }
  },
});

export const computeEligibilityRules = query({
  args: { raffleId: v.id("raffles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const raffle = await ctx.db.get(args.raffleId);
    if (!raffle) return { eligible: false, reason: "raffle_not_found", results: [] };

    const rules = raffle.eligibilityRules || [];
    if (rules.length === 0) return { eligible: true, reason: "eligible", results: [] };

    const user = await ctx.db.get(args.userId);
    if (!user) return { eligible: false, reason: "user_not_found", results: [] };

    const results: { rule: string; passed: boolean; detail: string }[] = [];

    for (const rule of rules) {
      let passed = false;
      let detail = "";

      switch (rule.field) {
        case "has_spotify": {
          const has = await hasActiveSpotifySubscription(ctx, args.userId);
          passed = rule.operator === "eq" ? has : !has;
          detail = has ? "User has active Spotify" : "No active Spotify subscription";
          break;
        }
        case "min_subscription_age": {
          const days = parseInt(rule.value) || 0;
          const slots = await ctx.db.query("subscription_slots").withIndex("by_user", (q: any) => q.eq("user_id", args.userId)).collect();
          const oldest = slots.reduce((earliest: number, s: any) => Math.min(earliest, s.created_at || Infinity), Infinity);
          const ageDays = oldest === Infinity ? 0 : Math.floor((Date.now() - oldest) / (1000 * 60 * 60 * 24));
          passed = rule.operator === "gte" ? ageDays >= days : ageDays < days;
          detail = `Subscription age: ${ageDays} days (required: ${days})`;
          break;
        }
        case "account_status": {
          const isActive = !user.is_suspended && !user.is_banned;
          if (rule.value === "active") {
            passed = rule.operator === "eq" ? isActive : !isActive;
          }
          detail = isActive ? "Account is active" : "Account is suspended or banned";
          break;
        }
        case "not_disqualified": {
          const isFlagged = user.is_fraud_flagged || false;
          passed = rule.operator === "eq" ? !isFlagged : isFlagged;
          detail = isFlagged ? "User is fraud-flagged" : "User is not disqualified";
          break;
        }
        case "country": {
          const userRegion = (user as any).region || "";
          passed = rule.operator === "eq" ? userRegion === rule.value : userRegion !== rule.value;
          detail = `Region: ${userRegion || "not set"} (required: ${rule.value})`;
          break;
        }
        default:
          passed = true;
          detail = `Rule "${rule.field}" not implemented — skipped`;
      }

      results.push({ rule: `${rule.field} ${rule.operator} ${rule.value}`, passed, detail });
    }

    const eligible = results.every(r => r.passed);
    return { eligible, reason: eligible ? "eligible" : "eligibility_rules_failed", results };
  },
});

// ══════════════════════════════════════════════
// BONUS TICKET TASKS
// ══════════════════════════════════════════════

export const createBonusTask = mutation({
  args: {
    raffleId: v.id("raffles"),
    name: v.string(),
    description: v.string(),
    platform: v.string(),
    icon: v.optional(v.string()),
    rewardTickets: v.number(),
    verificationMethod: v.string(),
    destinationUrl: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingTasks = await ctx.db
      .query("bonus_tasks")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.displayOrder), -1);

    const taskId = await ctx.db.insert("bonus_tasks", {
      raffleId: args.raffleId,
      name: args.name,
      description: args.description,
      platform: args.platform,
      icon: args.icon,
      rewardTickets: args.rewardTickets,
      verificationMethod: args.verificationMethod,
      destinationUrl: args.destinationUrl,
      isActive: true,
      displayOrder: maxOrder + 1,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

export const updateBonusTask = mutation({
  args: {
    taskId: v.id("bonus_tasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    platform: v.optional(v.string()),
    icon: v.optional(v.string()),
    rewardTickets: v.optional(v.number()),
    verificationMethod: v.optional(v.string()),
    destinationUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...fields } = args;
    const patch: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(taskId, patch);
  },
});

export const deleteBonusTask = mutation({
  args: { taskId: v.id("bonus_tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

export const reorderBonusTasks = mutation({
  args: {
    taskIds: v.array(v.id("bonus_tasks")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.taskIds.length; i++) {
      await ctx.db.patch(args.taskIds[i], { displayOrder: i, updatedAt: Date.now() });
    }
  },
});

export const getBonusTasks = query({
  args: {
    raffleId: v.id("raffles"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("bonus_tasks")
      .withIndex("by_raffle", (q: any) => q.eq("raffleId", args.raffleId))
      .collect();

    if (!args.includeInactive) {
      tasks = tasks.filter(t => t.isActive);
    }

    tasks.sort((a, b) => a.displayOrder - b.displayOrder);
    return tasks;
  },
});

export const getUserBonusCompletions = query({
  args: {
    raffleId: v.id("raffles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_bonus_completions")
      .withIndex("by_user_raffle", (q: any) =>
        q.eq("userId", args.userId).eq("raffleId", args.raffleId)
      )
      .collect();
  },
});

export const completeBonusTask = mutation({
  args: {
    raffleId: v.id("raffles"),
    taskId: v.id("bonus_tasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!task.isActive) throw new Error("Task is not active");

    const existing = await ctx.db
      .query("user_bonus_completions")
      .withIndex("by_user_task", (q: any) =>
        q.eq("userId", args.userId).eq("taskId", args.taskId)
      )
      .unique();

    if (existing) throw new Error("Task already completed");

    await ctx.db.insert("user_bonus_completions", {
      raffleId: args.raffleId,
      taskId: args.taskId,
      userId: args.userId,
      status: "completed",
      ticketsAwarded: task.rewardTickets,
      completedAt: Date.now(),
    });

    const user = await ctx.db.get(args.userId);
    if (user) {
      try {
        await createUserActivityLog(ctx, {
          userId: args.userId,
          category: "raffle",
          action: "Bonus task completed",
          description: `Completed "${task.name}" (+${task.rewardTickets} tickets)`,
          status: "success",
          amount: task.rewardTickets,
          metadata: { taskId: args.taskId, raffleId: args.raffleId, platform: task.platform },
        });
      } catch (e) {
        console.error("Failed to log bonus task activity:", e);
      }
    }

    return { success: true, ticketsAwarded: task.rewardTickets };
  },
});

export const getRaffleBonusStats = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("user_bonus_completions")
      .withIndex("by_raffle", (q: any) =>
        q.eq("raffleId", args.raffleId)
      )
      .collect();

    const totalBonusTickets = completions.reduce((sum, c) => sum + c.ticketsAwarded, 0);
    const uniqueUsers = new Set(completions.map(c => c.userId)).size;

    return { totalBonusTickets, uniqueUsers, totalCompletions: completions.length };
  },
});
export const getRaffleDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allRaffles = await ctx.db.query("raffles").order("desc").collect();
    const allEntries = await ctx.db.query("raffle_entries").collect();
    const allWinners = await ctx.db.query("raffle_winners").collect();
    const allReferrals = await ctx.db.query("raffle_referrals").collect();
    const allUsers = await ctx.db.query("users").collect();

    const now = Date.now();
    const activeRaffle = allRaffles.find(r => r.status === "published");
    const upcomingDraw = allRaffles
      .filter(r => r.nextDrawDate && r.nextDrawDate > now)
      .sort((a, b) => (a.nextDrawDate || 0) - (b.nextDrawDate || 0))[0];

    const totalParticipants = new Set(allEntries.map(e => e.userId)).size;
    const totalTickets = allEntries.reduce((sum, e) => sum + e.ticketCount, 0);
    const completedReferrals = allReferrals.filter(r => r.status === "completed");
    const referralTickets = completedReferrals.reduce((sum, r) => sum + r.rewardTickets, 0);
    const totalPrizePaid = allWinners.reduce((sum, w) => sum + w.prize, 0);
    const winnersCount = allWinners.length;

    // Count Spotify subscribers (roughly)
    let spotifyEligible = 0;
    for (const user of allUsers) {
      const slots = await ctx.db
        .query("subscription_slots")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const hasSpotify = slots.some((s: any) => {
        if (s.status !== "filled" && s.status !== "closing") return false;
        return (s as any).sub_name?.toLowerCase().includes("spotify");
      });
      if (hasSpotify) spotifyEligible++;
    }

    // Weekly growth (entries last 7 days)
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentEntries = allEntries.filter(e => e.enteredAt > weekAgo).length;

    return {
      totalRaffles: allRaffles.length,
      activeRaffle: activeRaffle ? { _id: activeRaffle._id, title: activeRaffle.title, slug: activeRaffle.slug } : null,
      upcomingDraw: upcomingDraw ? { _id: upcomingDraw._id, title: upcomingDraw.title, nextDrawDate: upcomingDraw.nextDrawDate, frequency: upcomingDraw.frequency } : null,
      totalParticipants,
      totalTickets,
      referralTickets,
      winnersSelected: winnersCount,
      totalPrizePaid,
      spotifyEligible,
      weeklyGrowth: recentEntries,
      statusBreakdown: {
        draft: allRaffles.filter(r => r.status === "draft").length,
        published: allRaffles.filter(r => r.status === "published").length,
        completed: allRaffles.filter(r => r.status === "completed").length,
        closed: allRaffles.filter(r => r.status === "closed").length,
      },
    };
  },
});
