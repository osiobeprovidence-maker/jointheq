import { v } from "convex/values";
import { mutation, query, internalMutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { createNotification } from "./notificationHelpers";

// --- Quests Logic ---

async function resolveStorageUrl(ctx: any, value: string | undefined) {
    if (!value || value.startsWith("http") || value.startsWith("/")) return value;
    return await ctx.storage.getUrl(value as Id<"_storage">) ?? undefined;
}

async function getLegacyQuestWalletBalance(ctx: any, userId: Id<"users">) {
    const transactions = await ctx.db
        .query("wallet_transactions")
        .withIndex("by_user", (q: any) => q.eq("user_id", userId))
        .collect();

    return transactions.reduce((total: number, transaction: any) => {
        if (transaction.wallet_type !== "quest_wallet" || transaction.status !== "completed") return total;
        return transaction.type === "debit" ? total - transaction.amount : total + transaction.amount;
    }, 0);
}

async function notifyAdminsOfQuestPayment(ctx: any, input: {
    creatorName: string;
    title: string;
    amount: number;
}) {
    const admins = (await ctx.db.query("users").collect()).filter((user: any) => user.is_admin);

    for (const admin of admins) {
        await createNotification(ctx, {
            userId: admin._id,
            title: "Quest payment received",
            message: `${input.creatorName} paid N${input.amount.toLocaleString()} for "${input.title}". Review the Quest payment/admin queue.`,
            type: "admin",
            ctaText: "Open Quest Admin",
            ctaUrl: "/admin?tab=quests",
        });
    }
}

export const createQuest = mutation({
    args: {
        creatorId: v.id("users"),
        title: v.string(),
        description: v.string(),
        questLink: v.string(),
        instructions: v.string(),
        proofRequirement: v.string(),
        coverImageUrl: v.optional(v.string()),
        category: v.optional(v.string()),
        location: v.optional(v.string()),
        audienceType: v.optional(v.string()),
        rewardPerUser: v.number(),
        totalBudget: v.number(),
        serviceFee: v.optional(v.number()),
        paymentAmount: v.optional(v.number()),
        paymentMethod: v.string(), // "q_wallet" | "paystack"
        requestId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.creatorId);
        if (!user) throw new Error("User not found");

        // Idempotency: if requestId provided, return existing quest to prevent duplicates
        if (args.requestId) {
            const existing = await ctx.db
                .query("quests")
                .withIndex("by_request_id", (q) => q.eq("request_id", args.requestId))
                .unique();

            if (existing) {
                return { success: true, questId: existing._id, status: existing.status };
            }
        }

        const totalSlots = Math.floor(args.totalBudget / args.rewardPerUser);
        if (totalSlots <= 0) throw new Error("Budget is too low for the reward amount");
        const paymentAmount = args.paymentAmount ?? args.totalBudget;

        const questId = await ctx.db.insert("quests", {
            creatorId: args.creatorId,
            title: args.title,
            description: args.description,
            questLink: args.questLink,
            instructions: args.instructions,
            proofRequirement: args.proofRequirement,
            coverImageUrl: args.coverImageUrl,
            request_id: args.requestId,
            category: args.category,
            location: args.location,
            audienceType: args.audienceType,
            rewardPerUser: args.rewardPerUser,
            totalBudget: args.totalBudget,
            serviceFee: args.serviceFee,
            paymentAmount,
            totalSlots: totalSlots,
            usedSlots: 0,
            paymentStatus: "pending",
            paymentMethod: args.paymentMethod,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        if (args.paymentMethod === "q_wallet") {
            let wallet = await ctx.db
                .query("wallets")
                .withIndex("by_user", (q) => q.eq("user_id", args.creatorId))
                .unique();

            if (!wallet && (user.wallet_balance || 0) > 0) {
                const questWalletBalance = await getLegacyQuestWalletBalance(ctx, args.creatorId);
                const walletId = await ctx.db.insert("wallets", {
                    user_id: args.creatorId,
                    q_wallet_balance: Math.max(0, (user.wallet_balance || 0) - questWalletBalance),
                    quest_wallet_balance: questWalletBalance,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                wallet = await ctx.db.get(walletId);
            }

            if (!wallet || wallet.q_wallet_balance < paymentAmount) {
                throw new Error("Insufficient Q Wallet balance");
            }

            // Deduct from Q Wallet
            const nextQWalletBalance = wallet.q_wallet_balance - paymentAmount;
            await ctx.db.patch(wallet._id, {
                q_wallet_balance: nextQWalletBalance,
                updated_at: Date.now(),
            });
            await ctx.db.patch(args.creatorId, {
                wallet_balance: nextQWalletBalance,
            });

            const paymentRef = `quest_payment_${questId}_${Date.now()}`;
            await ctx.db.patch(questId, {
                paymentStatus: "paid",
                status: "live", // Automatically live after payment as per requirements
                paymentReference: paymentRef,
                updatedAt: Date.now(),
            });

            // Log transaction
            await ctx.db.insert("wallet_transactions", {
                user_id: args.creatorId,
                wallet_type: "q_wallet",
                type: "debit",
                amount: paymentAmount,
                reference: paymentRef,
                description: `Quest Payment: ${args.title}`,
                related_quest_id: questId,
                status: "completed",
                wallet_balance: nextQWalletBalance,
                created_at: Date.now(),
            });

            await notifyAdminsOfQuestPayment(ctx, {
                creatorName: user.full_name || user.username || "A user",
                title: args.title,
                amount: paymentAmount,
            });

            return { success: true, questId, status: "live" };
        }

        return { success: true, questId, status: "pending_payment" };
    },
});

export const listQuests = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const quests = await ctx.db
            .query("quests")
            .withIndex("by_status", (q) => q.eq("status", "live"))
            .collect();

        const questsWithCoverUrls = await Promise.all(quests.map(async (quest) => {
            const resolvedUrl = await resolveStorageUrl(ctx, quest.coverImageUrl);
            return {
                ...quest,
                coverImageUrl: resolvedUrl,
            };
        }));

        // If userId is provided, we could filter out already completed quests or mark them
        if (!args.userId) return questsWithCoverUrls;

        const completions = await ctx.db
            .query("quest_completions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .collect();

        const completedQuestIds = new Set(completions.map(c => c.questId));

        return questsWithCoverUrls.map(quest => ({
            ...quest,
            isCompleted: completedQuestIds.has(quest._id),
            userCompletion: completions.find(c => c.questId === quest._id)
        }));
    },
});

export const getQuestById = query({
    args: { id: v.id("quests") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const submitCompletion = mutation({
    args: {
        questId: v.id("quests"),
        userId: v.id("users"),
        proofUrl: v.optional(v.string()),
        proofText: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const quest = await ctx.db.get(args.questId);
        if (!quest) throw new Error("Quest not found");

        if (quest.status !== "live") throw new Error("Quest is no longer live");
        if (quest.usedSlots >= quest.totalSlots) throw new Error("Quest has reached its capacity");

        // Anti-duplicate check
        const existing = await ctx.db
            .query("quest_completions")
            .withIndex("by_quest_user", (q) => q.eq("questId", args.questId).eq("userId", args.userId))
            .unique();

        if (existing) {
            throw new Error("You have already claimed this quest reward.");
        }

        const completionId = await ctx.db.insert("quest_completions", {
            questId: args.questId,
            userId: args.userId,
            proofUrl: args.proofUrl,
            proofText: args.proofText,
            status: "pending_review",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return completionId;
    },
});

// --- Admin Actions ---

export const adminListAllQuests = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const quests = await ctx.db.query("quests").order("desc").collect();
        return await Promise.all(quests.map(async quest => {
            const coverImageUrl = await resolveStorageUrl(ctx, quest.coverImageUrl);
            return {
                ...quest,
                coverImageUrl,
                cover_image_url: coverImageUrl,
                creator_id: quest.creatorId,
                creator: await ctx.db.get(quest.creatorId),
                platform: quest.category,
                reward_per_completion: quest.rewardPerUser,
                total_cost: quest.totalBudget,
                current_completions: quest.usedSlots,
                max_completions: quest.totalSlots,
            };
        }));
    }
});

// Backwards-compatible public query used by older admin UI
export const adminListQuests = query({
    args: {},
    handler: async (ctx) => {
        const quests = await ctx.db.query("quests").order("desc").collect();

        return await Promise.all(quests.map(async quest => {
            const coverImageUrl = await resolveStorageUrl(ctx, quest.coverImageUrl);
            return {
                ...quest,
                coverImageUrl,
                cover_image_url: coverImageUrl,
                creator_id: quest.creatorId,
                creator: await ctx.db.get(quest.creatorId),
                platform: quest.category,
                reward_per_completion: quest.rewardPerUser,
                total_cost: quest.totalBudget,
                current_completions: quest.usedSlots,
                max_completions: quest.totalSlots,
            };
        }));
    }
});

// Public query to list quest completions for admin review
export const adminListCompletions = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let completions;
        const requestedStatus = args.status === "pending" ? "pending_review" : args.status;
        if (requestedStatus) {
            completions = await ctx.db.query("quest_completions").withIndex("by_status", (q) => q.eq("status", requestedStatus)).collect();
        } else {
            completions = await ctx.db.query("quest_completions").order("desc").collect();
        }

        return await Promise.all(completions.map(async c => {
            const quest = await ctx.db.get(c.questId) as any;
            return {
                ...c,
                quest,
                user: await ctx.db.get(c.userId),
                quest_title: quest?.title,
                user_id: c.userId,
                proof_text: c.proofText,
                proof_url: await resolveStorageUrl(ctx, c.proofUrl),
            };
        }));
    }
});

export const adminReviewQuest = mutation({
    args: {
        adminId: v.id("users"),
        questId: v.id("quests"),
        action: v.string(), // "approve", "reject", "pause", "resume", "delete", "feature"
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const quest = await ctx.db.get(args.questId);
        if (!quest) throw new Error("Quest not found");

        const updates: any = { updatedAt: Date.now() };
        if (args.adminNote !== undefined) {
            updates.adminNote = args.adminNote;
        }

        switch (args.action) {
            case "approve":
                updates.status = "live";
                break;
            case "reject":
                updates.status = "rejected";
                break;
            case "pause":
                updates.status = "paused";
                break;
            case "resume":
                updates.status = "live";
                break;
            case "delete":
                // Actually maybe just a status change
                updates.status = "deleted";
                break;
            case "feature":
                updates.isFeatured = true;
                break;
            case "unfeature":
                updates.isFeatured = false;
                break;
        }

        await ctx.db.patch(args.questId, updates);
        return { success: true };
    }
});

export const adminReviewCompletion = mutation({
    args: {
        adminId: v.id("users"),
        completionId: v.id("quest_completions"),
        action: v.string(), // "approve", "reject"
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const completion = await ctx.db.get(args.completionId);
        if (!completion) throw new Error("Completion not found");
        if (completion.status !== "pending_review") throw new Error("Already reviewed");

        const quest = await ctx.db.get(completion.questId);
        if (!quest) throw new Error("Quest not found");

        if (args.action === "approve") {
            // Credit Quest Wallet
            const wallet = await ctx.db
                .query("wallets")
                .withIndex("by_user", (q) => q.eq("user_id", completion.userId))
                .unique();

            const reference = `payout_${completion._id}`;

            if (wallet) {
                await ctx.db.patch(wallet._id, {
                    quest_wallet_balance: wallet.quest_wallet_balance + quest.rewardPerUser,
                    updated_at: Date.now(),
                });
            } else {
                await ctx.db.insert("wallets", {
                    user_id: completion.userId,
                    q_wallet_balance: 0,
                    quest_wallet_balance: quest.rewardPerUser,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
            }

            await ctx.db.insert("wallet_transactions", {
                user_id: completion.userId,
                wallet_type: "quest_wallet",
                type: "credit",
                amount: quest.rewardPerUser,
                reference,
                description: `Quest Reward: ${quest.title}`,
                related_quest_id: quest._id,
                status: "completed",
                created_at: Date.now(),
            });

            await ctx.db.patch(completion._id, {
                status: "paid",
                payoutReference: reference,
                creditedAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Increment used slots
            await ctx.db.patch(quest._id, {
                usedSlots: quest.usedSlots + 1,
                status: quest.usedSlots + 1 >= quest.totalSlots ? "completed" : quest.status,
            });

        } else {
            await ctx.db.patch(completion._id, {
                status: "rejected",
                adminNote: args.adminNote,
                updatedAt: Date.now(),
            });
        }

        return { success: true };
    }
});

// --- Paystack Verification for Quests ---

export const verifyQuestPayment = action({
    args: {
        reference: v.string(),
        questId: v.id("quests"),
    },
    handler: async (ctx, args) => {
        const secretKey = process.env.PAYSTACK_SECRET_KEY || "";
        const response = await fetch(`https://api.paystack.co/transaction/verify/${args.reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
            }
        });
        const payload = await response.json();
        if (!payload.status || payload.data.status !== "success") {
            throw new Error("Payment verification failed");
        }

        await ctx.runMutation(internal.quests.markQuestAsPaid, {
            questId: args.questId,
            reference: args.reference,
            amount: payload.data.amount / 100,
        });

        return { success: true };
    }
});

export const markQuestAsPaid = internalMutation({
    args: {
        questId: v.id("quests"),
        reference: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const quest = await ctx.db.get(args.questId);
        if (!quest) throw new Error("Quest not found");
        const wasAlreadyPaid = quest.paymentStatus === "paid";

        await ctx.db.patch(args.questId, {
            paymentStatus: "paid",
            status: "live",
            paymentReference: args.reference,
            updatedAt: Date.now(),
        });

        if (!wasAlreadyPaid) {
            const creator = await ctx.db.get(quest.creatorId);
            await notifyAdminsOfQuestPayment(ctx, {
                creatorName: creator?.full_name || creator?.username || "A user",
                title: quest.title,
                amount: quest.paymentAmount || args.amount,
            });
        }

        return { success: true };
    }
});
