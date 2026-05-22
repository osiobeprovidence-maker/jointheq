import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

type UserRefTable = {
  table: string;
  fields: string[];
};

const USER_REF_TABLES: UserRefTable[] = [
  { table: "users", fields: ["referred_by"] },
  { table: "subscriptions", fields: ["owner_id"] },
  { table: "subscription_slots", fields: ["user_id"] },
  { table: "canceled_subscriptions", fields: ["user_id", "canceled_by", "restored_by"] },
  { table: "subscription_payments", fields: ["user_id"] },
  { table: "migration_records", fields: ["user_id"] },
  { table: "migrated_subscriptions", fields: ["user_id"] },
  { table: "messages", fields: ["sender_id", "receiver_id"] },
  { table: "manual_funding_requests", fields: ["user_id", "processed_by"] },
  { table: "boot_transactions", fields: ["user_id"] },
  { table: "tasks", fields: ["creatorUserId", "reviewedBy"] },
  { table: "quests", fields: ["creatorId"] },
  { table: "task_submissions", fields: ["userId", "reviewedBy"] },
  { table: "support_messages", fields: ["sender_id"] },
  { table: "support_tickets", fields: ["user_id", "assigned_admin_id"] },
  { table: "campaigns", fields: ["created_by"] },
  { table: "admin_tasks", fields: ["assigned_to", "assigned_admin_id", "created_by", "assigned_by"] },
  { table: "admin_notifications", fields: ["admin_id"] },
  { table: "transactions", fields: ["user_id"] },
  { table: "campaign_referrals", fields: ["referrer_id", "referred_id"] },
  { table: "fraud_flags", fields: ["user_id", "reviewed_by"] },
  { table: "devices", fields: ["user_id"] },
  { table: "lunar_memories", fields: ["user_id", "added_by"] },
  { table: "lunar_subscriptions", fields: ["user_id"] },
  { table: "funding_requests", fields: ["user_id"] },
  { table: "listings", fields: ["owner_id"] },
  { table: "marketplace", fields: ["owner_user_id", "admin_creator_id"] },
  { table: "reputation", fields: ["user_id"] },
  { table: "admin_invitations", fields: ["invited_by", "accepted_by"] },
  { table: "user_fingerprints", fields: ["user_id"] },
  { table: "campaign_withdrawals", fields: ["user_id"] },
  { table: "campus_territories", fields: ["leader_id"] },
  { table: "campus_events", fields: ["host_id", "created_by"] },
  { table: "campus_applications", fields: ["user_id", "reviewed_by"] },
  { table: "platform_settings", fields: ["updated_by"] },
  { table: "notifications", fields: ["user_id"] },
  { table: "subscription_notification_templates", fields: ["updated_by"] },
  { table: "subscription_notification_logs", fields: ["user_id"] },
  { table: "push_subscriptions", fields: ["user_id"] },
  { table: "admin_logs", fields: ["admin_id"] },
  { table: "slot_waitlist", fields: ["user_id", "added_by"] },
  { table: "payment_overrides", fields: ["user_id", "admin_id"] },
  { table: "group_changes", fields: ["user_id", "admin_id"] },
  { table: "bulk_operations", fields: ["admin_id"] },
  { table: "promotional_notifications", fields: ["created_by"] },
];

const normalizeEmail = (email?: string) => (email || "").trim().toLowerCase();
const normalizePhone = (phone?: string) => (phone || "").replace(/\D/g, "");
const asIdString = (value: unknown) => String(value || "");

const userScore = (user: any, referenceCount = 0) =>
  (user.is_admin ? 100000 : 0) +
  (user.is_verified ? 10000 : 0) +
  (user.password_hash ? 5000 : 0) +
  (user.last_sign_in_at ? 3000 : 0) +
  referenceCount * 100 +
  ((user.wallet_balance || 0) > 0 ? 50 : 0) -
  Math.floor((user.created_at || 0) / 100000000000);

const mergeUniqueArrays = (...arrays: any[][]) => {
  const seen = new Set<string>();
  const merged: any[] = [];
  for (const item of arrays.flat()) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
};

const countUserReferences = async (ctx: any, userId: any) => {
  let total = 0;
  const byTable: Record<string, number> = {};
  const userIdString = asIdString(userId);

  for (const { table, fields } of USER_REF_TABLES) {
    const rows = await ctx.db.query(table as any).collect();
    let count = 0;
    for (const row of rows) {
      for (const field of fields) {
        if (asIdString((row as any)[field]) === userIdString) count += 1;
      }
      const related = (row as any).related_user_ids;
      if (Array.isArray(related) && related.some((id) => asIdString(id) === userIdString)) {
        count += 1;
      }
    }
    if (count > 0) {
      byTable[table] = count;
      total += count;
    }
  }

  return { total, byTable };
};

const rewriteUserReferences = async (ctx: any, fromUserId: any, toUserId: any) => {
  let updated = 0;
  const byTable: Record<string, number> = {};
  const fromString = asIdString(fromUserId);
  const toString = asIdString(toUserId);

  for (const { table, fields } of USER_REF_TABLES) {
    const rows = await ctx.db.query(table as any).collect();
    for (const row of rows) {
      const patch: Record<string, any> = {};
      for (const field of fields) {
        if (asIdString((row as any)[field]) === fromString) {
          patch[field] = toUserId;
        }
      }

      if (Array.isArray((row as any).related_user_ids)) {
        const next = (row as any).related_user_ids.map((id: any) =>
          asIdString(id) === fromString ? toUserId : id
        );
        const unique = Array.from(new Map(next.map((id: any) => [asIdString(id), id])).values());
        if (JSON.stringify(unique.map(asIdString)) !== JSON.stringify((row as any).related_user_ids.map(asIdString))) {
          patch.related_user_ids = unique;
        }
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch((row as any)._id, patch);
        updated += 1;
        byTable[table] = (byTable[table] || 0) + 1;
      }
    }
  }

  if (fromString !== toString) return { updated, byTable };
  return { updated: 0, byTable: {} };
};

const summarizeUsers = async (ctx: any, users: any[]) => {
  return await Promise.all(users.map(async (user) => {
    const references = await countUserReferences(ctx, user._id);
    return {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      phone: user.phone,
      created_at: user.created_at,
      is_verified: user.is_verified,
      is_admin: user.is_admin,
      has_password: Boolean(user.password_hash),
      wallet_balance: user.wallet_balance || 0,
      boot_balance: user.boot_balance || 0,
      boots_balance: user.boots_balance || 0,
      q_score: user.q_score || 0,
      last_sign_in_at: user.last_sign_in_at,
      reference_count: references.total,
      references: references.byTable,
    };
  }));
};

/** Delete subscriptions and their groups/slots for cleanup tasks. */
export const deleteSubscriptions = mutation({
  args: { subscription_ids: v.array(v.id("subscriptions")) },
  handler: async (ctx, args) => {
    for (const sid of args.subscription_ids) {
      const sub = await ctx.db.get(sid);
      if (!sub) continue;

      // If subscription had an associated group, delete its slots and the group
      if ((sub as any).group_id) {
        const slots = await ctx.db.query("subscription_slots").withIndex("by_group", q => q.eq("group_id", (sub as any).group_id)).collect();
        await Promise.all(slots.map(s => ctx.db.delete(s._id)));
        try {
          await ctx.db.delete((sub as any).group_id);
        } catch (e) {
          // ignore if group already deleted
        }
      }

      // Finally delete the subscription record
      try {
        await ctx.db.delete(sid);
      } catch (e) {
        // ignore deletion errors
      }
    }
    return { success: true };
  },
});

export const listDuplicateSubscriptions = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("subscriptions").collect();
    const groups: Record<string, any[]> = {};
    for (const s of all) {
      const k = `${s.owner_id}||${s.platform}||${s.login_email}||${s.renewal_date}`;
      (groups[k] = groups[k] || []).push(s);
    }
    const duplicates: string[] = [];
    for (const k of Object.keys(groups)) {
      const arr = groups[k];
      if (arr.length <= 1) continue;
      arr.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
      const dup = arr.slice(1);
      duplicates.push(...dup.map(d => d._id));
    }
    return duplicates;
  }
});

export const listDuplicateUsers = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const groupsByEmail: Record<string, any[]> = {};
    const groupsByPhone: Record<string, any[]> = {};

    for (const user of allUsers) {
      const emailKey = normalizeEmail(user.email);
      if (emailKey) (groupsByEmail[emailKey] = groupsByEmail[emailKey] || []).push(user);

      const phoneKey = normalizePhone(user.phone);
      if (phoneKey) (groupsByPhone[phoneKey] = groupsByPhone[phoneKey] || []).push(user);
    }

    const requestedEmail = normalizeEmail(args.email);
    const emailGroups = Object.entries(groupsByEmail)
      .filter(([email, users]) => users.length > 1 && (!requestedEmail || email === requestedEmail));
    const phoneGroups = Object.entries(groupsByPhone)
      .filter(([, users]) => users.length > 1);

    return {
      duplicate_email_groups: await Promise.all(emailGroups.map(async ([email, users]) => ({
        email,
        count: users.length,
        users: await summarizeUsers(ctx, users),
      }))),
      duplicate_phone_groups: await Promise.all(phoneGroups.map(async ([phone, users]) => ({
        phone,
        count: users.length,
        users: await summarizeUsers(ctx, users),
      }))),
    };
  },
});

export const mergeDuplicateUsersByEmail = mutation({
  args: {
    email: v.string(),
    apply: v.optional(v.boolean()),
    keepUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    if (!normalizedEmail) throw new Error("Email is required");

    const users = (await ctx.db.query("users").collect())
      .filter((user) => normalizeEmail(user.email) === normalizedEmail);

    if (users.length <= 1) {
      return {
        success: true,
        applied: false,
        message: "No duplicate users found for this email",
        email: normalizedEmail,
        users: await summarizeUsers(ctx, users),
      };
    }

    const summaries = await summarizeUsers(ctx, users);
    const keepUser = args.keepUserId
      ? users.find((user) => asIdString(user._id) === asIdString(args.keepUserId))
      : users
        .map((user) => ({
          user,
          summary: summaries.find((summary) => asIdString(summary._id) === asIdString(user._id)),
        }))
        .sort((a, b) =>
          userScore(b.user, b.summary?.reference_count || 0) -
          userScore(a.user, a.summary?.reference_count || 0)
        )[0]?.user;

    if (!keepUser) throw new Error("Could not resolve keeper user");

    const duplicates = users.filter((user) => asIdString(user._id) !== asIdString(keepUser._id));
    const preview = {
      email: normalizedEmail,
      keep_user_id: keepUser._id,
      duplicate_user_ids: duplicates.map((user) => user._id),
      users: summaries,
    };

    if (!args.apply) {
      return {
        success: true,
        applied: false,
        message: "Dry run only. Pass apply: true to merge.",
        ...preview,
      };
    }

    const keepWallets = await ctx.db.query("wallets").withIndex("by_user", (q) => q.eq("user_id", keepUser._id)).collect();
    let keeperWallet = keepWallets[0] || null;
    if (!keeperWallet) {
      const walletId = await ctx.db.insert("wallets", {
        user_id: keepUser._id,
        q_wallet_balance: keepUser.wallet_balance || 0,
        quest_wallet_balance: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      keeperWallet = await ctx.db.get(walletId);
    }

    const mergedPatch: Record<string, any> = {};
    let walletBalanceToAdd = 0;
    let bootBalanceToAdd = 0;
    let bootsBalanceToAdd = 0;
    let qWalletToAdd = 0;
    let questWalletToAdd = 0;
    const rewritten: any[] = [];
    const deletedUsers: string[] = [];

    for (const duplicate of duplicates) {
      walletBalanceToAdd += duplicate.wallet_balance || 0;
      bootBalanceToAdd += duplicate.boot_balance || 0;
      bootsBalanceToAdd += duplicate.boots_balance || 0;

      const duplicateWallets = await ctx.db.query("wallets").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const wallet of duplicateWallets) {
        qWalletToAdd += wallet.q_wallet_balance || 0;
        questWalletToAdd += wallet.quest_wallet_balance || 0;
        await ctx.db.delete(wallet._id);
      }

      const duplicateCompletions = await ctx.db.query("quest_completions").withIndex("by_user", (q) => q.eq("userId", duplicate._id)).collect();
      for (const completion of duplicateCompletions) {
        const existing = await ctx.db
          .query("quest_completions")
          .withIndex("by_quest_user", (q) => q.eq("questId", completion.questId).eq("userId", keepUser._id))
          .first();
        if (existing) {
          await ctx.db.delete(completion._id);
        }
      }

      const duplicateConversations = await ctx.db.query("support_conversations").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const conversation of duplicateConversations) {
        const existingOpen = conversation.status === "open"
          ? await ctx.db.query("support_conversations")
            .withIndex("by_user", (q) => q.eq("user_id", keepUser._id))
            .filter((q) => q.eq(q.field("status"), "open"))
            .first()
          : null;

        if (existingOpen) {
          const messages = await ctx.db.query("support_messages").withIndex("by_conversation", (q) => q.eq("conversation_id", conversation._id)).collect();
          for (const message of messages) {
            await ctx.db.patch(message._id, { conversation_id: existingOpen._id });
          }
          await ctx.db.delete(conversation._id);
        }
      }

      const duplicateCampusReps = await ctx.db.query("campus_reps").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const rep of duplicateCampusReps) {
        const keeperRep = await ctx.db.query("campus_reps").withIndex("by_user", (q) => q.eq("user_id", keepUser._id)).first();
        if (keeperRep) {
          await ctx.db.patch(keeperRep._id, {
            total_referred: (keeperRep.total_referred || 0) + (rep.total_referred || 0),
            total_earned: (keeperRep.total_earned || 0) + (rep.total_earned || 0),
            is_active: Boolean(keeperRep.is_active || rep.is_active),
          });
          await ctx.db.delete(rep._id);
        }
      }

      const duplicateParticipants = await ctx.db.query("campaign_participants").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const participant of duplicateParticipants) {
        const keeperParticipant = await ctx.db.query("campaign_participants")
          .withIndex("by_user", (q) => q.eq("user_id", keepUser._id))
          .filter((q) => q.eq(q.field("campaign_id"), participant.campaign_id))
          .first();
        if (keeperParticipant) {
          await ctx.db.patch(keeperParticipant._id, {
            progress: Math.max(keeperParticipant.progress || 0, participant.progress || 0),
            referral_count: (keeperParticipant.referral_count || 0) + (participant.referral_count || 0),
            boots_earned: (keeperParticipant.boots_earned || 0) + (participant.boots_earned || 0),
            cash_earned: (keeperParticipant.cash_earned || 0) + (participant.cash_earned || 0),
            entries: (keeperParticipant.entries || 0) + (participant.entries || 0),
            last_active: Math.max(keeperParticipant.last_active || 0, participant.last_active || 0),
          });
          await ctx.db.delete(participant._id);
        }
      }

      const duplicateAmbassadors = await ctx.db.query("campus_territory_ambassadors").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const ambassador of duplicateAmbassadors) {
        const keeperAmbassador = await ctx.db.query("campus_territory_ambassadors")
          .withIndex("by_user", (q) => q.eq("user_id", keepUser._id))
          .filter((q) => q.eq(q.field("territory_id"), ambassador.territory_id))
          .first();
        if (keeperAmbassador) {
          await ctx.db.patch(keeperAmbassador._id, {
            referral_count: (keeperAmbassador.referral_count || 0) + (ambassador.referral_count || 0),
            total_earned: (keeperAmbassador.total_earned || 0) + (ambassador.total_earned || 0),
            is_active: Boolean(keeperAmbassador.is_active || ambassador.is_active),
          });
          await ctx.db.delete(ambassador._id);
        }
      }

      const rewriteResult = await rewriteUserReferences(ctx, duplicate._id, keepUser._id);
      rewritten.push({ from: duplicate._id, to: keepUser._id, ...rewriteResult });

      await ctx.db.delete(duplicate._id);
      deletedUsers.push(duplicate._id);
    }

    const allUsersForEmail = users;
    const verified = allUsersForEmail.some((user) => user.is_verified);
    const signInHistory = mergeUniqueArrays(...allUsersForEmail.map((user) => user.sign_in_history || []));
    const scoreHistory = mergeUniqueArrays(...allUsersForEmail.map((user) => user.score_history || []));
    const bootsHistory = mergeUniqueArrays(...allUsersForEmail.map((user) => user.boots_history || []));
    const penaltyHistory = mergeUniqueArrays(...allUsersForEmail.map((user) => user.penalty_history || []));

    mergedPatch.wallet_balance = (keepUser.wallet_balance || 0) + walletBalanceToAdd;
    mergedPatch.boot_balance = (keepUser.boot_balance || 0) + bootBalanceToAdd;
    mergedPatch.boots_balance = (keepUser.boots_balance || 0) + bootsBalanceToAdd;
    mergedPatch.is_verified = verified;
    mergedPatch.score_history = scoreHistory;
    mergedPatch.boots_history = bootsHistory;
    mergedPatch.penalty_history = penaltyHistory;
    mergedPatch.sign_in_history = signInHistory;
    mergedPatch.last_sign_in_at = Math.max(...allUsersForEmail.map((user) => user.last_sign_in_at || 0)) || keepUser.last_sign_in_at;

    for (const user of allUsersForEmail) {
      if (!mergedPatch.phone && user.phone) mergedPatch.phone = user.phone;
      if (!mergedPatch.username && user.username) mergedPatch.username = user.username;
      if (!mergedPatch.qic && user.qic) mergedPatch.qic = user.qic;
      if (!mergedPatch.profile_image_url && user.profile_image_url) mergedPatch.profile_image_url = user.profile_image_url;
      if (!mergedPatch.university && user.university) mergedPatch.university = user.university;
      if (!mergedPatch.password_hash && user.password_hash) mergedPatch.password_hash = user.password_hash;
      if (!mergedPatch.direct_debit_card && user.direct_debit_card) mergedPatch.direct_debit_card = user.direct_debit_card;
      if (!mergedPatch.quest_withdrawal_account && user.quest_withdrawal_account) mergedPatch.quest_withdrawal_account = user.quest_withdrawal_account;
      if (!mergedPatch.accepted_terms && user.accepted_terms) {
        mergedPatch.accepted_terms = user.accepted_terms;
        mergedPatch.accepted_terms_version = user.accepted_terms_version;
        mergedPatch.accepted_at = user.accepted_at;
      }
    }

    await ctx.db.patch(keepUser._id, mergedPatch);

    if (keeperWallet) {
      await ctx.db.patch(keeperWallet._id, {
        q_wallet_balance: (keeperWallet.q_wallet_balance || 0) + qWalletToAdd,
        quest_wallet_balance: (keeperWallet.quest_wallet_balance || 0) + questWalletToAdd,
        updated_at: Date.now(),
      });
    }

    return {
      success: true,
      applied: true,
      ...preview,
      deleted_user_ids: deletedUsers,
      rewritten,
      wallet_balance_added: walletBalanceToAdd,
      q_wallet_balance_added: qWalletToAdd,
      quest_wallet_balance_added: questWalletToAdd,
    };
  },
});

export const mergeUsersById = mutation({
  args: {
    keepUserId: v.id("users"),
    duplicateUserIds: v.array(v.id("users")),
    apply: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const keepUser = await ctx.db.get(args.keepUserId);
    if (!keepUser) throw new Error("Keeper user not found");

    const duplicates = [];
    for (const userId of args.duplicateUserIds) {
      if (asIdString(userId) === asIdString(args.keepUserId)) continue;
      const user = await ctx.db.get(userId);
      if (user) duplicates.push(user);
    }

    if (duplicates.length === 0) {
      return { success: true, applied: false, message: "No duplicate users found for these ids" };
    }

    if (duplicates.some((user) => user.is_admin) && !keepUser.is_admin) {
      throw new Error("Refusing to merge an admin account into a non-admin account");
    }

    const allUsers = [keepUser, ...duplicates];
    const preview = {
      keep_user_id: keepUser._id,
      duplicate_user_ids: duplicates.map((user) => user._id),
      users: await summarizeUsers(ctx, allUsers),
    };

    if (!args.apply) {
      return {
        success: true,
        applied: false,
        message: "Dry run only. Pass apply: true to merge.",
        ...preview,
      };
    }

    const keepWallets = await ctx.db.query("wallets").withIndex("by_user", (q) => q.eq("user_id", keepUser._id)).collect();
    let keeperWallet = keepWallets[0] || null;
    if (!keeperWallet) {
      const walletId = await ctx.db.insert("wallets", {
        user_id: keepUser._id,
        q_wallet_balance: keepUser.wallet_balance || 0,
        quest_wallet_balance: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      keeperWallet = await ctx.db.get(walletId);
    }

    let walletBalanceToAdd = 0;
    let bootBalanceToAdd = 0;
    let bootsBalanceToAdd = 0;
    let qWalletToAdd = 0;
    let questWalletToAdd = 0;
    const rewritten: any[] = [];
    const deletedUsers: string[] = [];

    for (const duplicate of duplicates) {
      walletBalanceToAdd += duplicate.wallet_balance || 0;
      bootBalanceToAdd += duplicate.boot_balance || 0;
      bootsBalanceToAdd += duplicate.boots_balance || 0;

      const duplicateWallets = await ctx.db.query("wallets").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const wallet of duplicateWallets) {
        qWalletToAdd += wallet.q_wallet_balance || 0;
        questWalletToAdd += wallet.quest_wallet_balance || 0;
        await ctx.db.delete(wallet._id);
      }

      const duplicateCompletions = await ctx.db.query("quest_completions").withIndex("by_user", (q) => q.eq("userId", duplicate._id)).collect();
      for (const completion of duplicateCompletions) {
        const existing = await ctx.db
          .query("quest_completions")
          .withIndex("by_quest_user", (q) => q.eq("questId", completion.questId).eq("userId", keepUser._id))
          .first();
        if (existing) await ctx.db.delete(completion._id);
      }

      const duplicateConversations = await ctx.db.query("support_conversations").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const conversation of duplicateConversations) {
        const existingOpen = conversation.status === "open"
          ? await ctx.db.query("support_conversations")
            .withIndex("by_user", (q) => q.eq("user_id", keepUser._id))
            .filter((q) => q.eq(q.field("status"), "open"))
            .first()
          : null;
        if (existingOpen) {
          const messages = await ctx.db.query("support_messages").withIndex("by_conversation", (q) => q.eq("conversation_id", conversation._id)).collect();
          for (const message of messages) {
            await ctx.db.patch(message._id, { conversation_id: existingOpen._id });
          }
          await ctx.db.delete(conversation._id);
        }
      }

      const duplicateCampusReps = await ctx.db.query("campus_reps").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const rep of duplicateCampusReps) {
        const keeperRep = await ctx.db.query("campus_reps").withIndex("by_user", (q) => q.eq("user_id", keepUser._id)).first();
        if (keeperRep) {
          await ctx.db.patch(keeperRep._id, {
            total_referred: (keeperRep.total_referred || 0) + (rep.total_referred || 0),
            total_earned: (keeperRep.total_earned || 0) + (rep.total_earned || 0),
            is_active: Boolean(keeperRep.is_active || rep.is_active),
          });
          await ctx.db.delete(rep._id);
        }
      }

      const duplicateParticipants = await ctx.db.query("campaign_participants").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const participant of duplicateParticipants) {
        const keeperParticipant = await ctx.db.query("campaign_participants")
          .withIndex("by_user", (q) => q.eq("user_id", keepUser._id))
          .filter((q) => q.eq(q.field("campaign_id"), participant.campaign_id))
          .first();
        if (keeperParticipant) {
          await ctx.db.patch(keeperParticipant._id, {
            progress: Math.max(keeperParticipant.progress || 0, participant.progress || 0),
            referral_count: (keeperParticipant.referral_count || 0) + (participant.referral_count || 0),
            boots_earned: (keeperParticipant.boots_earned || 0) + (participant.boots_earned || 0),
            cash_earned: (keeperParticipant.cash_earned || 0) + (participant.cash_earned || 0),
            entries: (keeperParticipant.entries || 0) + (participant.entries || 0),
            last_active: Math.max(keeperParticipant.last_active || 0, participant.last_active || 0),
          });
          await ctx.db.delete(participant._id);
        }
      }

      const duplicateAmbassadors = await ctx.db.query("campus_territory_ambassadors").withIndex("by_user", (q) => q.eq("user_id", duplicate._id)).collect();
      for (const ambassador of duplicateAmbassadors) {
        const keeperAmbassador = await ctx.db.query("campus_territory_ambassadors")
          .withIndex("by_user", (q) => q.eq("user_id", keepUser._id))
          .filter((q) => q.eq(q.field("territory_id"), ambassador.territory_id))
          .first();
        if (keeperAmbassador) {
          await ctx.db.patch(keeperAmbassador._id, {
            referral_count: (keeperAmbassador.referral_count || 0) + (ambassador.referral_count || 0),
            total_earned: (keeperAmbassador.total_earned || 0) + (ambassador.total_earned || 0),
            is_active: Boolean(keeperAmbassador.is_active || ambassador.is_active),
          });
          await ctx.db.delete(ambassador._id);
        }
      }

      const rewriteResult = await rewriteUserReferences(ctx, duplicate._id, keepUser._id);
      rewritten.push({ from: duplicate._id, to: keepUser._id, ...rewriteResult });
      await ctx.db.delete(duplicate._id);
      deletedUsers.push(duplicate._id);
    }

    const mergedPatch: Record<string, any> = {
      wallet_balance: (keepUser.wallet_balance || 0) + walletBalanceToAdd,
      boot_balance: (keepUser.boot_balance || 0) + bootBalanceToAdd,
      boots_balance: (keepUser.boots_balance || 0) + bootsBalanceToAdd,
      is_verified: allUsers.some((user) => user.is_verified),
      score_history: mergeUniqueArrays(...allUsers.map((user) => user.score_history || [])),
      boots_history: mergeUniqueArrays(...allUsers.map((user) => user.boots_history || [])),
      penalty_history: mergeUniqueArrays(...allUsers.map((user) => user.penalty_history || [])),
      sign_in_history: mergeUniqueArrays(...allUsers.map((user) => user.sign_in_history || [])),
      last_sign_in_at: Math.max(...allUsers.map((user) => user.last_sign_in_at || 0)) || keepUser.last_sign_in_at,
    };

    for (const user of allUsers) {
      if (!keepUser.phone && !mergedPatch.phone && user.phone) mergedPatch.phone = user.phone;
      if (!keepUser.profile_image_url && !mergedPatch.profile_image_url && user.profile_image_url) mergedPatch.profile_image_url = user.profile_image_url;
      if (!keepUser.university && !mergedPatch.university && user.university) mergedPatch.university = user.university;
      if (!keepUser.password_hash && !mergedPatch.password_hash && user.password_hash) mergedPatch.password_hash = user.password_hash;
      if (!keepUser.direct_debit_card && !mergedPatch.direct_debit_card && user.direct_debit_card) mergedPatch.direct_debit_card = user.direct_debit_card;
      if (!keepUser.quest_withdrawal_account && !mergedPatch.quest_withdrawal_account && user.quest_withdrawal_account) mergedPatch.quest_withdrawal_account = user.quest_withdrawal_account;
      if (!keepUser.accepted_terms && !mergedPatch.accepted_terms && user.accepted_terms) {
        mergedPatch.accepted_terms = user.accepted_terms;
        mergedPatch.accepted_terms_version = user.accepted_terms_version;
        mergedPatch.accepted_at = user.accepted_at;
      }
    }

    await ctx.db.patch(keepUser._id, mergedPatch);

    if (keeperWallet) {
      await ctx.db.patch(keeperWallet._id, {
        q_wallet_balance: (keeperWallet.q_wallet_balance || 0) + qWalletToAdd,
        quest_wallet_balance: (keeperWallet.quest_wallet_balance || 0) + questWalletToAdd,
        updated_at: Date.now(),
      });
    }

    return {
      success: true,
      applied: true,
      ...preview,
      deleted_user_ids: deletedUsers,
      rewritten,
      wallet_balance_added: walletBalanceToAdd,
      q_wallet_balance_added: qWalletToAdd,
      quest_wallet_balance_added: questWalletToAdd,
    };
  },
});
