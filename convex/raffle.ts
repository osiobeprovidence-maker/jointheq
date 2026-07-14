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

    if (!entry) return { totalTickets: 0, initialEntry: 0, referralBonus: 0 };

    const referrals = await ctx.db
      .query("raffle_referrals")
      .withIndex("by_inviter", (q: any) => q.eq("inviterId", args.userId))
      .filter((q: any) => q.eq(q.field("raffleId"), args.raffleId))
      .collect();

    const completedReferrals = referrals.filter((r: any) => r.status === "completed");
    const referralBonus = completedReferrals.reduce((sum, r) => sum + (r.rewardTickets || 0), 0);

    return {
      totalTickets: entry.ticketCount,
      initialEntry: entry.ticketCount - referralBonus,
      referralBonus,
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

export const drawWinner = action({
  args: {
    raffleId: v.id("raffles"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.users.getById, { id: args.adminId });
    if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
      throw new Error("Admin access required");
    }

    const raffle = await ctx.runQuery(internal.raffle.getRaffleById, { raffleId: args.raffleId });
    if (!raffle) throw new Error("Raffle not found");

    const entries = await ctx.runQuery(internal.raffle.getAllEntries, { raffleId: args.raffleId });
    if (entries.length === 0) throw new Error("No entries in this raffle");

    const totalWeight = entries.reduce((sum, e) => sum + e.ticketCount, 0);
    let random = Math.random() * totalWeight;
    let winner: (typeof entries)[0] | null = null;

    for (const entry of entries) {
      random -= entry.ticketCount;
      if (random <= 0) {
        winner = entry;
        break;
      }
    }

    if (!winner) winner = entries[entries.length - 1];

    const existingWinners = await ctx.runQuery(internal.raffle.getRaffleWinners, { raffleId: args.raffleId });
    const position = existingWinners.length + 1;

    await ctx.runMutation(internal.raffle.insertWinner, {
      raffleId: args.raffleId,
      userId: winner.userId,
      prize: raffle.prizeAmount,
      position,
    });

    await ctx.runMutation(internal.raffle.updateRaffleStatus, {
      raffleId: args.raffleId,
      status: "completed",
    });

    const winnerUser = await ctx.runQuery(internal.users.getById, { id: winner.userId });

    return {
      success: true,
      winner: {
        userId: winner.userId,
        name: winnerUser?.full_name || winnerUser?.username || "Unknown",
        raffleNumber: winner.raffleNumber,
        ticketCount: winner.ticketCount,
        prize: raffle.prizeAmount,
        position,
      },
      audit: {
        totalEntries: entries.length,
        totalTickets: totalWeight,
        winnerTicketCount: winner.ticketCount,
        timestamp: Date.now(),
        adminId: args.adminId,
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
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
      throw new Error("Admin access required");
    }

    const existing = await ctx.db
      .query("raffles")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (existing) throw new Error("A raffle with this slug already exists");

    const now = Date.now();
    const id = await ctx.db.insert("raffles", {
      title: args.title,
      slug: args.slug,
      banner: args.banner,
      accentColor: args.accentColor,
      description: args.description,
      prizeAmount: args.prizeAmount,
      prizes: args.prizes,
      drawDate: args.drawDate,
      status: "draft",
      eligibilityType: args.eligibilityType,
      referralReward: args.referralReward,
      createdBy: args.adminId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, raffleId: id };
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
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || (!admin.is_admin && admin.role !== "admin" && admin.admin_role !== "super")) {
      throw new Error("Admin access required");
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.banner !== undefined) updates.banner = args.banner;
    if (args.accentColor !== undefined) updates.accentColor = args.accentColor;
    if (args.description !== undefined) updates.description = args.description;
    if (args.prizeAmount !== undefined) updates.prizeAmount = args.prizeAmount;
    if (args.prizes !== undefined) updates.prizes = args.prizes;
    if (args.drawDate !== undefined) updates.drawDate = args.drawDate;
    if (args.status !== undefined) updates.status = args.status;
    if (args.eligibilityType !== undefined) updates.eligibilityType = args.eligibilityType;
    if (args.referralReward !== undefined) updates.referralReward = args.referralReward;

    await ctx.db.patch(args.raffleId, updates);

    return { success: true };
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("raffle_winners", {
      raffleId: args.raffleId,
      userId: args.userId,
      prize: args.prize,
      position: args.position,
      announcedAt: Date.now(),
    });

    try { await createUserActivityLog(ctx, { userId: args.userId, category: "raffle", action: "Raffle won", description: `Won position #${args.position} — ₦${args.prize.toLocaleString()} prize`, status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }
  },
});

export const updateRaffleStatus = mutation({
  args: {
    raffleId: v.id("raffles"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.raffleId, {
      status: args.status,
      updatedAt: Date.now(),
    });
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

    const totalParticipants = entries.length;
    const totalTickets = entries.reduce((sum, e) => sum + e.ticketCount, 0);
    const completedReferrals = referrals.filter((r: any) => r.status === "completed");
    const totalReferrals = completedReferrals.length;
    const daysRemaining = Math.max(0, Math.ceil((raffle.drawDate - Date.now()) / (1000 * 60 * 60 * 24)));

    return {
      totalParticipants,
      totalTickets,
      totalReferrals,
      prizeAmount: raffle.prizeAmount,
      drawDate: raffle.drawDate,
      daysRemaining,
      status: raffle.status,
      winnerAnnounced: raffle.winnerAnnounced || false,
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
