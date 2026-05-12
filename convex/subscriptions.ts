import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { awardReputation } from "./reputation";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { createNotification, createNotificationForAllUsers } from "./notificationHelpers";

const normalizeOwnerName = (owner?: string) => {
    const cleaned = (owner || "").trim().replace(/^@+/, "");
    return cleaned || "Unknown";
};

const MARKETPLACE_CATEGORIES = new Set([
    "Streaming",
    "Music",
    "Design",
    "AI",
    "Productivity",
    "Gaming",
    "VPN",
    "Software",
    "Utility",
    "Education",
]);

const normalizeMarketplaceCategory = (category?: string, fallback?: string) => {
    const normalized = (category || "").trim();
    if (MARKETPLACE_CATEGORIES.has(normalized)) {
        return normalized;
    }

    const fallbackNormalized = (fallback || "").trim();
    if (MARKETPLACE_CATEGORIES.has(fallbackNormalized)) {
        return fallbackNormalized;
    }

    return "Streaming";
};

const DAY_MS = 24 * 60 * 60 * 1000;

const dateToMs = (date?: string) => {
    if (!date) return null;
    const ms = Date.parse(date);
    return Number.isFinite(ms) ? ms : null;
};

const nextPaymentDayMs = (paymentDay: number, now: number) => {
    const today = new Date(now);
    const normalizedDay = Math.min(Math.max(Math.trunc(paymentDay || 1), 1), 31);
    const candidate = new Date(today.getFullYear(), today.getMonth(), normalizedDay);

    if (candidate.getMonth() !== today.getMonth()) {
        candidate.setDate(0);
    }

    if (candidate.getTime() < now) {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, normalizedDay);
        if (nextMonth.getMonth() !== ((today.getMonth() + 1) % 12)) {
            nextMonth.setDate(0);
        }
        return nextMonth.getTime();
    }

    return candidate.getTime();
};

/**
 * Returns EACH listing as a separate item (no aggregation across listings).
 * Uses the new marketplace table for consolidated data.
 */
export const getActiveSubscriptions = query({
    handler: async (ctx) => {
        // Get marketplace listings from the new consolidated table
        const marketplaceListings = await ctx.db.query("marketplace")
            .withIndex("by_status", q => q.eq("status", "active"))
            .collect();

        const result = await Promise.all(
            marketplaceListings.map(async (listing) => {
                // Get the subscription catalog info for this listing
                const catalog = await ctx.db.get(listing.subscription_catalog_id);
                const effectiveCategory = normalizeMarketplaceCategory(listing.category, catalog?.category);
                const owner = listing.owner_user_id
                    ? await ctx.db.get(listing.owner_user_id)
                    : null;
                const ownerName = owner?.full_name ?? normalizeOwnerName(listing.plan_owner);
                const ownerProfileImage = owner?.profile_image_url;

                // Get the groups that belong to this exact listing
                const allGroups = await ctx.db.query("groups")
                    .withIndex("by_catalog", q => q.eq("subscription_catalog_id", listing.subscription_catalog_id))
                    .filter(q => q.and(
                        q.eq(q.field("account_email"), listing.account_email),
                        q.eq(q.field("billing_cycle_start"), listing.billing_cycle_start),
                        q.eq(q.field("plan_owner"), listing.plan_owner)
                    ))
                    .collect();

                const allSlots = [];
                for (const group of allGroups) {
                    const groupSlots = await ctx.db.query("subscription_slots")
                        .withIndex("by_group", q => q.eq("group_id", group._id))
                        .collect();
                    allSlots.push(...groupSlots);
                }

                const slotTypeIds = [...new Set(
                    allSlots
                        .map(slot => slot.slot_type_id)
                        .filter((slotTypeId): slotTypeId is Id<"slot_types"> => !!slotTypeId)
                )];

                const slotTypes = await Promise.all(slotTypeIds.map((slotTypeId) => ctx.db.get(slotTypeId)));
                const validSlotTypes = slotTypes.filter((slotType): slotType is NonNullable<typeof slotType> => !!slotType);

                // Calculate slot counts per slot type
                const slotTypesWithCount = await Promise.all(
                    validSlotTypes.map(async (st) => {
                        const slotsForThisType = allSlots.filter(s => s.slot_type_id === st._id);
                        const totalCapacity = slotsForThisType.length;
                        const currentMembers = slotsForThisType.filter(s => s.status === "filled").length;
                        const openSlots = slotsForThisType.filter(s => s.status === "open").length;

                        return {
                            ...st,
                            total_capacity: totalCapacity,
                            current_members: currentMembers,
                            open_slots: openSlots,
                            owner_name: ownerName,
                            owner_profile_image_url: ownerProfileImage,
                            sub_name: catalog?.name ?? "Unknown",
                            sub_logo: catalog?.logo_url,
                            account_email: listing.account_email,
                            billing_cycle_start: listing.billing_cycle_start,
                            slot_price: listing.slot_price,
                            owner_payout: listing.owner_payout,
                        };
                    })
                );

                // Only expose slot types that still have at least one open slot to end users.
                return slotTypesWithCount
                    .filter((st) => st.open_slots > 0)
                    .map(st => ({
                    ...st,
                    category: effectiveCategory,
                    platform_category: catalog?.category,
                    marketplace_id: listing._id,
                    account_email: listing.account_email,
                    billing_cycle_start: listing.billing_cycle_start,
                    plan_owner: listing.plan_owner,
                }));
            })
        );

        // Flatten the nested arrays
        return result.flat();
    },
});

export const getSlotsByUserId = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        // 1. Get standard subscription slots
        const slots = await ctx.db
            .query("subscription_slots")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();

        const standardSlots = await Promise.all(
            slots.map(async (slot) => {
                const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
                const account = slot.subscription_id ? await ctx.db.get(slot.subscription_id) : null;
                const group = slot.group_id ? await ctx.db.get(slot.group_id) : null;

                return {
                    ...slot,
                    slot_name: (slotType as any)?.name,
                    sub_name: (account as any)?.platform || (account as any)?.name,
                    // Primary: get from subscriptions table, fallback to group.account_email
                    login_email: (account as any)?.login_email || (group as any)?.account_email,
                    login_password: (account as any)?.login_password,
                    price: (slotType as any)?.price,
                    access_type: (slotType as any)?.access_type,
                };
            })
        );

        // 2. Get migrated subscriptions
        const migrations = await ctx.db
            .query("migrated_subscriptions")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();

        const migratedSlots = migrations.map((m) => ({
            _id: m._id,
            _creationTime: m._creationTime,
            user_id: m.user_id,
            status: m.status,
            renewal_date: m.last_payment_date,
            slot_name: m.profile_name,
            sub_name: m.platform,
            price: 0, // Migrated slots might not have a set price yet
            allocation: m.assigned_group || "Pending Approval",
            access_type: "migrated",
            auto_renew: false,
        }));

        const result = [...standardSlots, ...migratedSlots].map(s => ({
            ...s,
            auto_renew: (s as any).auto_renew ?? false,
            removal_scheduled_at: (s as any).removal_scheduled_at
        }));

        return result;
    },
});

export const getAdminDuePayments = query({
    args: {
        windowDays: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const windowDays = Math.max(1, Math.min(args.windowDays ?? 14, 60));
        const windowEnd = now + windowDays * DAY_MS;

        const slots = await ctx.db
            .query("subscription_slots")
            .withIndex("by_status", q => q.eq("status", "filled"))
            .collect();

        const dueSlots = [];

        for (const slot of slots) {
            const dueAt = dateToMs(slot.renewal_date);
            if (!dueAt || dueAt > windowEnd) continue;

            const [user, slotType, subscription, group] = await Promise.all([
                slot.user_id ? ctx.db.get(slot.user_id) : Promise.resolve(null),
                slot.slot_type_id ? ctx.db.get(slot.slot_type_id) : Promise.resolve(null),
                slot.subscription_id ? ctx.db.get(slot.subscription_id) : Promise.resolve(null),
                slot.group_id ? ctx.db.get(slot.group_id) : Promise.resolve(null),
            ]);

            if (!user) continue;

            let catalog = null;
            if (subscription?.platform_catalog_id) {
                catalog = await ctx.db.get(subscription.platform_catalog_id);
            } else if (group?.subscription_catalog_id) {
                catalog = await ctx.db.get(group.subscription_catalog_id);
            }

            const daysUntilDue = Math.ceil((dueAt - now) / DAY_MS);
            dueSlots.push({
                _id: slot._id,
                source: "slot",
                user_id: user._id,
                user_name: user.full_name,
                user_email: user.email,
                wallet_balance: user.wallet_balance,
                platform: subscription?.platform ?? catalog?.name ?? "Subscription",
                slot_name: slotType?.name ?? slot.profile_name ?? "Slot",
                account_email: subscription?.login_email ?? group?.account_email,
                amount_due: slotType?.price ?? subscription?.slot_price ?? 0,
                renewal_date: slot.renewal_date,
                due_at: dueAt,
                days_until_due: daysUntilDue,
                payment_state: dueAt < now ? "overdue" : daysUntilDue <= 3 ? "due_soon" : "upcoming",
                auto_renew: slot.auto_renew ?? false,
                status: slot.status,
            });
        }

        const migrated = await ctx.db.query("migrated_subscriptions").collect();

        for (const migration of migrated) {
            if (migration.status === "failed" || migration.status === "closed") continue;

            const lastPaymentMs = dateToMs(migration.last_payment_date);
            const dueAt = migration.payment_day
                ? nextPaymentDayMs(migration.payment_day, now)
                : lastPaymentMs
                    ? lastPaymentMs + 30 * DAY_MS
                    : null;

            if (!dueAt || dueAt > windowEnd) continue;

            const user = await ctx.db.get(migration.user_id);
            if (!user) continue;

            const daysUntilDue = Math.ceil((dueAt - now) / DAY_MS);
            dueSlots.push({
                _id: migration._id,
                source: "migration",
                user_id: user._id,
                user_name: user.full_name,
                user_email: user.email,
                wallet_balance: user.wallet_balance,
                platform: migration.platform,
                slot_name: migration.profile_name,
                account_email: migration.email,
                amount_due: 0,
                renewal_date: new Date(dueAt).toISOString(),
                due_at: dueAt,
                days_until_due: daysUntilDue,
                payment_state: dueAt < now ? "overdue" : daysUntilDue <= 3 ? "due_soon" : "upcoming",
                auto_renew: migration.auto_renew ?? false,
                status: migration.status,
            });
        }

        return dueSlots.sort((a, b) => a.due_at - b.due_at);
    },
});

export const toggleAutoRenew = mutation({
    args: { id: v.any(), auto_renew: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { auto_renew: args.auto_renew });
    },
});

export const renewSlot = mutation({
    args: { id: v.id("subscription_slots") },
    handler: async (ctx, args) => {
        const slot = await ctx.db.get(args.id);
        if (!slot || !slot.user_id || !slot.slot_type_id) {
            throw new Error("This subscription is no longer available to renew.");
        }

        const user = await ctx.db.get(slot.user_id);
        const slotType = await ctx.db.get(slot.slot_type_id);
        if (!user || !slotType) {
            throw new Error("This subscription is no longer available to renew.");
        }

        const price = slotType.price;
        if (user.wallet_balance < price) {
            throw new Error("Insufficient wallet balance. Fund your wallet to renew this subscription.");
        }

        // Deduct balance
        await ctx.db.patch(user._id, {
            wallet_balance: user.wallet_balance - price
        });

        // Record transaction
        await ctx.db.insert("wallet_transactions", {
            user_id: user._id,
            amount: price,
            type: "subscription_renewal",
            status: "completed",
            source: "wallet",
            description: `Renewed ${slotType.name}`,
            created_at: Date.now(),
        });

        // Update renewal date (add 30 days)
        const currentRenewal = slot.renewal_date ? new Date(slot.renewal_date) : new Date();
        const nextRenewal = new Date(currentRenewal.getTime() + 30 * 24 * 60 * 60 * 1000);

        await ctx.db.patch(slot._id, {
            renewal_date: nextRenewal.toISOString(),
            status: "filled",
            auto_renew: true
        });

        await createNotification(ctx, {
            userId: user._id,
            title: "Subscription renewed",
            message: `${slotType.name} was renewed for N${price.toLocaleString()}.`,
            type: "subscription",
        });

        return { success: true };
    },
});


export const joinSlot = mutation({
    args: {
        user_id: v.id("users"),
        slot_type_id: v.id("slot_types"),
        use_boots: v.boolean(),
        auto_renew: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.user_id);
        const st = await ctx.db.get(args.slot_type_id);

        if (!user || !st) throw new Error("This listing is no longer available. Please refresh and try again.");
        if (!("price" in st)) throw new Error("This listing is no longer available. Please refresh and try again.");

        const total_price = st.price;
        let boots_to_use = 0;
        let coins_to_use = total_price;

        const currentBoots = user.boots_balance ?? user.boot_balance ?? 0;

        if (args.use_boots) {
            boots_to_use = total_price / 2;
            coins_to_use = total_price / 2;
            if (currentBoots < boots_to_use) {
                throw new Error("You do not have enough BOOTS for the 50/50 payment split.");
            }
        }

        if (user.wallet_balance < coins_to_use) throw new Error("Insufficient wallet balance. Fund your wallet to join this slot.");
        if (user.q_score < st.min_q_score) throw new Error("Your Q Score is too low for this slot right now.");

        // ALLOCATION ENGINE: Find an 'open' slot pre-generated by the system
        const groups = await ctx.db
            .query("groups")
            .withIndex("by_catalog", (q) => q.eq("subscription_catalog_id", st.subscription_id as any))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        let targetSlot: Doc<"subscription_slots"> | null = null;
        for (const g of groups) {
            const openSlot = await ctx.db
                .query("subscription_slots")
                .withIndex("by_group", (q) => q.eq("group_id", g._id))
                .filter(q =>
                    q.and(
                        q.eq(q.field("slot_type_id"), st._id),
                        q.eq(q.field("status"), "open")
                    )
                )
                .first();

            if (openSlot) {
                targetSlot = openSlot;
                break;
            }
        }

        if (!targetSlot) {
            throw new Error("This slot is currently full. Please try another listing.");
        }

        // Update balances
        await ctx.db.patch(user._id, {
            wallet_balance: user.wallet_balance - coins_to_use,
            boots_balance: currentBoots - boots_to_use,
        });

        // Record transactions
        if (coins_to_use > 0) {
            await ctx.db.insert("wallet_transactions", {
                user_id: user._id,
                amount: coins_to_use,
                type: "subscription",
                status: "completed",
                source: "wallet",
                description: `Joined ${st.name} (Coins)`,
                created_at: Date.now(),
            });
        }

        if (boots_to_use > 0) {
            await ctx.db.insert("boot_transactions", {
                user_id: user._id,
                amount: -boots_to_use,
                type: "payment",
                description: `Joined ${st.name} (Boots)`,
                created_at: Date.now(),
            });
        }

        // Fill the pre-existing slot
        await ctx.db.patch(targetSlot._id, {
            user_id: user._id,
            status: "filled",
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: args.auto_renew || false,
        });

        // Update marketplace denormalization
        const group = targetSlot.group_id ? await ctx.db.get(targetSlot.group_id) : null;
        if (group?.account_email) {
            const marketplace = await ctx.db.query("marketplace")
                .withIndex("by_account_email", q => q.eq("account_email", group.account_email))
                .filter(q => q.eq(q.field("subscription_catalog_id"), group.subscription_catalog_id))
                .first();
            
            if (marketplace) {
                const filled = (marketplace.filled_slots || 0) + 1;
                const total = marketplace.total_slots || 0;
                await ctx.db.patch(marketplace._id, {
                    filled_slots: filled,
                    available_slots: Math.max(0, total - filled),
                    updated_at: Date.now()
                });
            }
        }

        // Award Reward for self (Join/Pay)
        await awardReputation(ctx, user._id, {
            score: 30,
            boots: 20,
            type: "payment",
            description: `Joined ${st.name} slot`
        });

        // Assign slot
        const existingSlots = await ctx.db
            .query("subscription_slots")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .collect();

        // If this is the user's first slot and they were actually referred, reward the referrer.
        if (existingSlots.length === 1 && user.referred_by) {
            await awardReputation(ctx, user.referred_by, {
                score: 50,
                boots: 30,
                type: "referral_reward",
                description: `Referral reward for inviting ${user.full_name}`
            });
        }

        // Auto-message logic based on access_type
        let adminUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "riderezzy@gmail.com"))
            .unique();

        if (!adminUser) {
            const anyAdmin = await ctx.db.query("users").filter((q) => q.eq(q.field("is_admin"), true)).first();
            adminUser = anyAdmin || user; // Fallback entirely, shouldn't normally happen
        }

        const sub = await ctx.db.get(st.subscription_id);
        const subName = sub?.name || "Premium";

        let welcomeMessage = `Welcome to your ${subName} slot!\n\n`;

        if (st.access_type === "code_access") {
            welcomeMessage += `To get your access code:\n1. Reply to this chat to request your code\n2. Enjoy 🍿`;
        } else if (st.access_type === "invite_link") {
            welcomeMessage += `To join the Family Plan:\n1. We will send your invite link shortly.\n2. In the meantime, prepare the required address provided in your dashboard.\n3. Reply if you need help!`;
        } else if (st.access_type === "email_invite") {
            welcomeMessage += `To get your email invite:\n1. Reply to this chat with your Google email address.\n2. We will send the family invite shortly.`;
        } else if (st.access_type === "login_with_code") {
            welcomeMessage += `To access your account:\n1. Login using the email shown on your dashboard.\n2. Request the verification code.\n3. Reply to this chat immediately to receive the code!`;
        } else {
            welcomeMessage += `To begin using your subscription:\n1. Please wait for our team to activate your account.\n2. Reply to this chat if you have any questions!`;
        }

        await ctx.db.insert("messages", {
            sender_id: adminUser._id,
            receiver_id: user._id,
            content: welcomeMessage,
            is_from_admin: true,
            created_at: Date.now(),
        });

        await createNotification(ctx, {
            userId: user._id,
            title: "Subscription joined",
            message: `You joined ${subName} - ${st.name}. Check your dashboard and support chat for access steps.`,
            type: "subscription",
        });

        if (coins_to_use > 0) {
            await createNotification(ctx, {
                userId: user._id,
                title: "Subscription payment successful",
                message: `N${coins_to_use.toLocaleString()} was paid from your wallet for ${st.name}.`,
                type: "payment",
            });
        }

        if (user.referred_by && existingSlots.length === 1) {
            await createNotification(ctx, {
                userId: user.referred_by,
                title: "Referral reward earned",
                message: `${user.full_name} made their first subscription payment. Your referral reward has been added.`,
                type: "promotion",
            });
        }

        return { success: true };
    },
});
export const updateAllocation = mutation({
    args: { id: v.any(), allocation: v.string() },
    handler: async (ctx, args) => {
        // Try patching subscription_slots first
        try {
            await ctx.db.patch(args.id, { allocation: args.allocation });
        } catch (e) {
            // If that fails, try migrated_subscriptions (which uses assigned_group field)
            await ctx.db.patch(args.id, { assigned_group: args.allocation });
        }
    },
});

export const leaveSlot = mutation({
    args: { id: v.any() },
    handler: async (ctx, args) => {
        // 1. Try standard subscription slots
        try {
            const slot = await ctx.db.get(args.id);
            if (slot && (slot as any).user_id) {
                const userId = (slot as any).user_id;
                await ctx.db.patch(args.id, {
                    auto_renew: false,
                    status: "closing",
                });
                await createNotification(ctx, {
                    userId,
                    title: "Leave request received",
                    message: "Your subscription leave request is scheduled for review at the end of the billing cycle.",
                    type: "subscription",
                });
                return { success: true, type: "slot", message: "Removal scheduled for end of cycle" };
            }
        } catch (e) { }

        // 2. Try migrated subscriptions
        try {
            const migration = await ctx.db.get(args.id);
            if (migration && (migration as any).user_id) {
                const userId = (migration as any).user_id;
                await ctx.db.patch(args.id, {
                    status: "closing"
                });
                await createNotification(ctx, {
                    userId,
                    title: "Leave request received",
                    message: "Your migrated subscription leave request has been received.",
                    type: "subscription",
                });
                return { success: true, type: "migration" };
            }
        } catch (e) { }

        throw new Error("Subscription not found or already removed.");
    },
});

/** Admin creates a new listing — accepts platform name as free text, auto-creates subscription row */
export const adminCreateListing = mutation({
    args: {
        platform_name: v.string(),         // e.g. "Netflix", "Spotify"
        account_email: v.string(),
        plan_owner: v.string(),
        admin_renewal_date: v.string(),
        request_id: v.optional(v.string()),
        slot_types: v.array(v.object({
            name: v.string(),
            price: v.number(),
            capacity: v.number(),
            access_type: v.string(),
            downloads_enabled: v.boolean(),
        })),
        category: v.optional(v.string()),
        login_password: v.optional(v.string()),
        base_cost: v.optional(v.number()),
        instructions_text: v.optional(v.string()),
        instructions_image_url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const normalizedPlanOwner = normalizeOwnerName(args.plan_owner);
        const normalizedCategory = normalizeMarketplaceCategory(args.category);

        // Logging the request for debugging duplicate submissions
        console.log(`[adminCreateListing] platform=${args.platform_name} account=${args.account_email} request_id=${args.request_id}`);

        // Idempotency: check marketplace table first (new consolidated source)
        if (args.request_id) {
            const existingMarketplace = await ctx.db.query("marketplace")
                .withIndex("by_request_id", q => q.eq("request_id", args.request_id))
                .first();
            if (existingMarketplace) {
                await ctx.db.patch(existingMarketplace._id, {
                    category: normalizedCategory,
                    updated_at: Date.now(),
                });

                const existingCatalog = await ctx.db.get(existingMarketplace.subscription_catalog_id);
                if (existingCatalog) {
                    await ctx.db.patch(existingCatalog._id, {
                        category: normalizedCategory,
                        ...(args.base_cost !== undefined && { base_cost: args.base_cost }),
                    });
                }

                console.log(`[adminCreateListing] duplicate request detected - returning existing marketplace ${existingMarketplace._id}`);
                return { success: true, marketplaceId: existingMarketplace._id };
            }

            // Also check groups for backward compatibility
            const existingByRequest = await ctx.db.query("groups")
                .filter(q => q.eq(q.field("request_id"), args.request_id))
                .first();
            if (existingByRequest) {
                const existingCatalog = await ctx.db.get(existingByRequest.subscription_catalog_id);
                if (existingCatalog) {
                    await ctx.db.patch(existingCatalog._id, {
                        category: normalizedCategory,
                        ...(args.base_cost !== undefined && { base_cost: args.base_cost }),
                    });
                }

                const existingMarketplace = await ctx.db.query("marketplace")
                    .filter(q => q.and(
                        q.eq(q.field("subscription_catalog_id"), existingByRequest.subscription_catalog_id),
                        q.eq(q.field("account_email"), args.account_email),
                        q.eq(q.field("billing_cycle_start"), args.admin_renewal_date),
                    ))
                    .first();

                if (existingMarketplace) {
                    await ctx.db.patch(existingMarketplace._id, {
                        category: normalizedCategory,
                        updated_at: Date.now(),
                    });
                }

                console.log(`[adminCreateListing] duplicate request detected - returning existing group ${existingByRequest._id}`);
                return { success: true, groupId: existingByRequest._id };
            }
        }

        // Additional safeguard: check for an existing group with same key fields (email + owner + renewal date)
        const existingByKey = await ctx.db.query("groups")
            .filter(q => q.and(
                q.eq(q.field("account_email"), args.account_email),
                q.eq(q.field("plan_owner"), normalizedPlanOwner),
                q.eq(q.field("billing_cycle_start"), args.admin_renewal_date),
            ))
            .first();

        if (existingByKey) {
            const existingCatalog = await ctx.db.get(existingByKey.subscription_catalog_id);
            if (existingCatalog) {
                await ctx.db.patch(existingCatalog._id, {
                    category: normalizedCategory,
                    ...(args.base_cost !== undefined && { base_cost: args.base_cost }),
                });
            }

            const existingMarketplace = await ctx.db.query("marketplace")
                .filter(q => q.and(
                    q.eq(q.field("subscription_catalog_id"), existingByKey.subscription_catalog_id),
                    q.eq(q.field("account_email"), args.account_email),
                    q.eq(q.field("billing_cycle_start"), args.admin_renewal_date),
                    q.eq(q.field("plan_owner"), normalizedPlanOwner),
                ))
                .first();

            if (existingMarketplace) {
                await ctx.db.patch(existingMarketplace._id, {
                    category: normalizedCategory,
                    updated_at: Date.now(),
                });
            }

            const existingSubscription = await ctx.db.query("subscriptions")
                .filter(q => q.eq(q.field("group_id"), existingByKey._id))
                .first();

            if (existingSubscription) {
                await ctx.db.patch(existingSubscription._id, {
                    category: normalizedCategory,
                    ...(args.base_cost !== undefined && { base_cost: args.base_cost }),
                    updated_at: Date.now(),
                });
            }

            console.log(`[adminCreateListing] existing group found by key - returning ${existingByKey._id}`);
            return { success: true, groupId: existingByKey._id };
        }

        // Find or create the catalog row by name (case-insensitive)
        const existing = await ctx.db.query("subscription_catalog")
            .filter(q => q.eq(q.field("name"), args.platform_name))
            .first();

        let catalogId = existing?._id;
        if (!catalogId) {
            catalogId = await ctx.db.insert("subscription_catalog", {
                name: args.platform_name,
                description: `${args.platform_name} subscription`,
                category: normalizedCategory,
                is_active: true,
                base_cost: args.base_cost || 0,
            });
        } else if (args.category || args.base_cost !== undefined) {
            await ctx.db.patch(catalogId, {
                ...(args.category && { category: normalizedCategory }),
                ...(args.base_cost !== undefined && { base_cost: args.base_cost })
            });
        }

        const adminUser = await ctx.db.query("users").filter(q => q.eq(q.field("is_admin"), true)).first();

        const groupId = await ctx.db.insert("groups", {
            subscription_catalog_id: catalogId,
            billing_cycle_start: args.admin_renewal_date,
            status: "active",
            account_email: args.account_email,
            plan_owner: normalizedPlanOwner,
            request_id: args.request_id || undefined,
        });

        // PILLAR 2: Create Subscription (Account) record
        const subscriptionId = await ctx.db.insert("subscriptions", {
            owner_id: adminUser?._id ?? (catalogId as any), // Fallback
            platform: args.platform_name,
            platform_catalog_id: catalogId,
            login_email: args.account_email,
            login_password: args.login_password || "ADMIN_MANAGED",
            base_cost: args.base_cost || 0,
            category: normalizedCategory,
            instructions_text: args.instructions_text,
            instructions_image_url: args.instructions_image_url,
            renewal_date: args.admin_renewal_date,
            total_slots: args.slot_types.reduce((a, b) => a + b.capacity, 0),
            slot_price: args.slot_types[0]?.price ?? 0,
            status: "active",
            group_id: groupId,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        for (const st of args.slot_types) {
            const slotTypeId = await ctx.db.insert("slot_types", {
                subscription_id: catalogId,
                name: st.name,
                price: st.price,
                capacity: st.capacity,
                access_type: st.access_type,
                device_limit: 1,
                downloads_enabled: st.downloads_enabled,
                min_q_score: 0,
                features: ["Premium Access"]
            });

            // PILLAR 3: Pre-generate slots for the Auto Slot Engine
            for (let i = 1; i <= st.capacity; i++) {
                await ctx.db.insert("subscription_slots", {
                    subscription_id: subscriptionId,
                    group_id: groupId,
                    slot_type_id: slotTypeId,
                    slot_number: i,
                    status: "open",
                    renewal_date: "",
                    created_at: Date.now(),
                });
            }
        }

        // PILLAR 4: Create marketplace entry for consolidated marketplace table
        const totalSlots = args.slot_types.reduce((a, b) => a + b.capacity, 0);
        const slotPrice = args.slot_types[0]?.price ?? 0;

        await ctx.db.insert("marketplace", {
            subscription_catalog_id: catalogId,
            admin_creator_id: adminUser?._id,

            platform_name: args.platform_name,
            account_email: args.account_email,
            plan_owner: normalizedPlanOwner,
            billing_cycle_start: args.admin_renewal_date,
            status: "active",

            total_slots: totalSlots,
            filled_slots: 0,
            available_slots: totalSlots,

            slot_price: slotPrice,

            category: normalizedCategory,
            admin_note: undefined,
            request_id: args.request_id,

            created_at: Date.now(),
            updated_at: Date.now(),
        });

        await createNotificationForAllUsers(ctx, {
            title: "New subscription available",
            message: `${args.platform_name} is now live in the marketplace from N${slotPrice.toLocaleString()} per slot.`,
            type: "subscription",
        });

        return { success: true, groupId };
    }
});

/** Update a slot_type (price, capacity, access_type, name) */
export const adminUpdateSlotType = mutation({
    args: {
        slot_type_id: v.id("slot_types"),
        name: v.optional(v.string()),
        price: v.optional(v.number()),
        capacity: v.optional(v.number()),
        access_type: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { slot_type_id, ...patch } = args;
        const filtered = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
        await ctx.db.patch(slot_type_id, filtered);
    }
});

/** Delete an entire group/marketplace listing (and its slots) */
const DELETE_SLOTS_BATCH_SIZE = 500;

export const adminDeleteGroup = mutation({
    args: {
        group_id: v.id("marketplace"),
    },
    handler: async (ctx, args) => {
        // Delete from marketplace table (new consolidated source)
        const listing = await ctx.db.get(args.group_id);
        if (!listing) return { success: true, done: true, deletedSlots: 0, deletedGroups: 0 };

        // Find only groups attached to this exact marketplace listing. The catalog
        // index avoids scanning all groups, and the extra fields prevent deleting
        // sibling listings on the same subscription catalog.
        const groups = await ctx.db.query("groups")
            .withIndex("by_listing_key", q => q
                .eq("subscription_catalog_id", listing.subscription_catalog_id)
                .eq("account_email", listing.account_email)
                .eq("billing_cycle_start", listing.billing_cycle_start)
                .eq("plan_owner", listing.plan_owner)
            )
            .take(10);

        let deletedSlots = 0;
        let deletedGroups = 0;

        for (const group of groups) {
            const slots = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .take(DELETE_SLOTS_BATCH_SIZE);

            for (const slot of slots) {
                await ctx.db.delete(slot._id);
                deletedSlots += 1;
            }

            if (slots.length === DELETE_SLOTS_BATCH_SIZE) {
                return { success: true, done: false, deletedSlots, deletedGroups };
            }

            await ctx.db.delete(group._id);
            deletedGroups += 1;
        }

        if (groups.length === 10) {
            return { success: true, done: false, deletedSlots, deletedGroups };
        }

        // Delete the marketplace record
        await ctx.db.delete(args.group_id);
        return { success: true, done: true, deletedSlots, deletedGroups };
    }
});

/** Get full marketplace data for admin: uses new marketplace table */
export const getAdminMarketplace = query({
    handler: async (ctx) => {
        // Use the new marketplace table as the primary source
        const listings = await ctx.db.query("marketplace").collect();

        return await Promise.all(listings.map(async (listing) => {
            const catalog = listing.subscription_catalog_id ? await ctx.db.get(listing.subscription_catalog_id) : null;
            const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;
            const admin = listing.admin_creator_id ? await ctx.db.get(listing.admin_creator_id) : null;

            // Get only the groups that belong to this listing
            const allGroups = await ctx.db.query("groups")
                .withIndex("by_catalog", q => q.eq("subscription_catalog_id", listing.subscription_catalog_id))
                .filter(q => q.and(
                    q.eq(q.field("account_email"), listing.account_email),
                    q.eq(q.field("billing_cycle_start"), listing.billing_cycle_start),
                    q.eq(q.field("plan_owner"), listing.plan_owner)
                ))
                .collect();

            const allSlots = [];
            for (const group of allGroups) {
                const groupSlots = await ctx.db.query("subscription_slots")
                    .withIndex("by_group", q => q.eq("group_id", group._id))
                    .collect();
                allSlots.push(...groupSlots);
            }

            const slotTypeIds = [...new Set(
                allSlots
                    .map(slot => slot.slot_type_id)
                    .filter((slotTypeId): slotTypeId is Id<"slot_types"> => !!slotTypeId)
            )];
            const slotTypes = (await Promise.all(slotTypeIds.map((slotTypeId) => ctx.db.get(slotTypeId))))
                .filter((slotType): slotType is NonNullable<typeof slotType> => !!slotType);

            const members = await Promise.all(allSlots.map(async (s) => {
                const u: Doc<"users"> | null = s.user_id
                    ? await ctx.db.get(s.user_id as Id<"users">)
                    : null;
                const st: Doc<"slot_types"> | null = s.slot_type_id
                    ? await ctx.db.get(s.slot_type_id as Id<"slot_types">)
                    : null;
                return {
                    slot_id: s._id,
                    user_name: u?.full_name ?? "Empty Slot",
                    user_id: s.user_id,
                    slot_name: st?.name ?? "Unknown",
                    slot_type_id: s.slot_type_id,
                    renewal: s.renewal_date,
                };
            }));

            return {
                ...listing,
                subscription_name: catalog?.name ?? "Unknown",
                platform_description: catalog?.description,
                platform_logo: catalog?.logo_url,
                owner_name: owner?.full_name,
                owner_email: owner?.email,
                admin_name: admin?.full_name,
                primary_group_id: allGroups[0]?._id,
                group_ids: allGroups.map(group => group._id),
                member_count: allSlots.length,
                members,
                slot_types: slotTypes,
            };
        }));
    }
});

/** Subscription Manager: full operational view for admins */
export const getSubscriptionManagerData = query({
    handler: async (ctx) => {
        const listings = await ctx.db.query("marketplace").collect();

        return await Promise.all(listings.map(async (listing) => {
            const catalog = await ctx.db.get(listing.subscription_catalog_id);
            const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;
            const admin = listing.admin_creator_id ? await ctx.db.get(listing.admin_creator_id) : null;

            const groups = await ctx.db.query("groups")
                .withIndex("by_catalog", q => q.eq("subscription_catalog_id", listing.subscription_catalog_id))
                .filter(q => q.and(
                    q.eq(q.field("account_email"), listing.account_email),
                    q.eq(q.field("billing_cycle_start"), listing.billing_cycle_start),
                    q.eq(q.field("plan_owner"), listing.plan_owner)
                ))
                .collect();

            const slots: Array<{
                slot_id: Id<"subscription_slots">;
                slot_number: number;
                slot_type_id?: Id<"slot_types">;
                slot_name: string;
                slot_price: number;
                user_id?: Id<"users">;
                user_name?: string;
                user_email?: string;
                user_status: string;
                payment_status: string;
                status: string;
                renewal_date?: string;
                auto_renew: boolean;
                group_id?: Id<"groups">;
            }> = [];
            for (const group of groups) {
                const groupSlots = await ctx.db.query("subscription_slots")
                    .withIndex("by_group", q => q.eq("group_id", group._id))
                    .collect();

                for (const slot of groupSlots) {
                    const [slotType, user] = await Promise.all([
                        slot.slot_type_id ? ctx.db.get(slot.slot_type_id) : Promise.resolve(null),
                        slot.user_id ? ctx.db.get(slot.user_id) : Promise.resolve(null),
                    ]);

                    slots.push({
                        slot_id: slot._id,
                        slot_number: slot.slot_number || slots.length + 1,
                        slot_type_id: slot.slot_type_id,
                        slot_name: slotType?.name || "Standard",
                        slot_price: slotType?.price || listing.slot_price || 0,
                        user_id: slot.user_id,
                        user_name: user?.full_name,
                        user_email: user?.email,
                        user_status: user?.is_suspended ? "Suspended" : slot.user_id ? "Active" : "Available",
                        payment_status: slot.status === "filled" ? "Paid" : slot.status === "closing" ? "Closing" : "Open",
                        status: slot.status,
                        renewal_date: slot.renewal_date || listing.billing_cycle_start,
                        auto_renew: slot.auto_renew ?? false,
                        group_id: slot.group_id,
                    });
                }
            }

            const totalSlots = slots.length || listing.total_slots || 0;
            const usedSlots = slots.filter(slot => slot.status === "filled").length;
            const availableSlots = Math.max(0, totalSlots - usedSlots);
            const managerStatus = availableSlots <= 0 ? "Full" : availableSlots === 1 ? "Almost Full" : "Active";
            const slotTypes = [...new Set(slots.map(slot => slot.slot_name).filter(Boolean))];
            const prices = slots.map(slot => slot.slot_price).filter(price => price > 0);
            const pricePerUser = prices[0] || listing.slot_price || 0;

            return {
                _id: listing._id,
                service_name: catalog?.name || listing.platform_name || "Unknown",
                plan_type: slotTypes.join(", ") || "Standard",
                monthly_price: catalog?.base_cost || 0,
                price_per_user: pricePerUser,
                owner_email: owner?.email || listing.account_email,
                owner_name: owner?.full_name || admin?.full_name || listing.plan_owner || "Admin",
                total_slots: totalSlots,
                used_slots: usedSlots,
                available_slots: availableSlots,
                renewal_date: listing.billing_cycle_start,
                status: managerStatus,
                listing_status: listing.status,
                category: listing.category || catalog?.category || "Other",
                account_email: listing.account_email,
                slots: slots.sort((a, b) => a.slot_number - b.slot_number),
            };
        }));
    }
});

export const adminUpdateSubscriptionRenewalDate = mutation({
    args: {
        adminId: v.id("users"),
        listingId: v.id("marketplace"),
        renewalDate: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const listing = await ctx.db.get(args.listingId);
        if (!listing) throw new Error("Subscription listing not found");

        const normalizedDate = args.renewalDate.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || !Number.isFinite(Date.parse(`${normalizedDate}T00:00:00`))) {
            throw new Error("Use a valid renewal date");
        }

        const oldDate = listing.billing_cycle_start;
        const now = Date.now();
        const groups = await ctx.db.query("groups")
            .withIndex("by_listing_key", q => q
                .eq("subscription_catalog_id", listing.subscription_catalog_id)
                .eq("account_email", listing.account_email)
                .eq("billing_cycle_start", oldDate)
                .eq("plan_owner", listing.plan_owner)
            )
            .collect();

        await ctx.db.patch(args.listingId, {
            billing_cycle_start: normalizedDate,
            updated_at: now,
        });

        const subscriptionIds = new Set<Id<"subscriptions">>();
        let updatedSlots = 0;

        for (const group of groups) {
            await ctx.db.patch(group._id, { billing_cycle_start: normalizedDate });
            if (group.subscription_id) subscriptionIds.add(group.subscription_id);

            const slots = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .collect();

            for (const slot of slots) {
                if (slot.subscription_id) subscriptionIds.add(slot.subscription_id);
                await ctx.db.patch(slot._id, { renewal_date: normalizedDate });
                updatedSlots += 1;
            }
        }

        const matchingSubscriptions = await ctx.db.query("subscriptions").collect();
        for (const subscription of matchingSubscriptions) {
            if (
                subscription.login_email === listing.account_email &&
                subscription.platform_catalog_id === listing.subscription_catalog_id &&
                (subscription.renewal_date === oldDate || subscription.renewal_date === listing.billing_cycle_start)
            ) {
                subscriptionIds.add(subscription._id);
            }
        }

        for (const subscriptionId of subscriptionIds) {
            await ctx.db.patch(subscriptionId, {
                renewal_date: normalizedDate,
                updated_at: now,
            });
        }

        await ctx.db.insert("admin_logs", {
            admin_id: args.adminId,
            admin_role: admin.admin_role || "admin",
            action_type: "subscription_renewal_date_update",
            target_type: "marketplace",
            target_id: args.listingId,
            target_name: listing.platform_name,
            details: `Changed renewal date from ${oldDate} to ${normalizedDate}`,
            metadata: {
                oldDate,
                renewalDate: normalizedDate,
                updatedGroups: groups.length,
                updatedSlots,
                updatedSubscriptions: subscriptionIds.size,
            },
            created_at: now,
        });

        return {
            success: true,
            renewalDate: normalizedDate,
            updatedGroups: groups.length,
            updatedSlots,
            updatedSubscriptions: subscriptionIds.size,
        };
    },
});

export const adminUpdateSlotRenewalDate = mutation({
    args: {
        adminId: v.id("users"),
        slotId: v.id("subscription_slots"),
        renewalDate: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const slot = await ctx.db.get(args.slotId);
        if (!slot) throw new Error("Subscription slot not found");

        const normalizedDate = args.renewalDate.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || !Number.isFinite(Date.parse(`${normalizedDate}T00:00:00`))) {
            throw new Error("Use a valid renewal date");
        }

        const user = slot.user_id ? await ctx.db.get(slot.user_id) : null;
        const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
        const oldDate = slot.renewal_date;

        await ctx.db.patch(args.slotId, {
            renewal_date: normalizedDate,
        });

        await ctx.db.insert("admin_logs", {
            admin_id: args.adminId,
            admin_role: admin.admin_role || "admin",
            action_type: "user_subscription_renewal_date_update",
            target_type: "subscription_slot",
            target_id: args.slotId,
            target_name: user?.full_name || user?.email || slotType?.name || "Subscription slot",
            details: `Changed user renewal date from ${oldDate || "not set"} to ${normalizedDate}`,
            metadata: {
                oldDate,
                renewalDate: normalizedDate,
                userId: slot.user_id,
                slotTypeId: slot.slot_type_id,
            },
            created_at: Date.now(),
        });

        return { success: true, renewalDate: normalizedDate };
    },
});


export const seedMarketplace = mutation({
    handler: async (ctx) => {
        // Netflix
        const netflixId = await ctx.db.insert("subscription_catalog", {
            name: "Netflix",
            description: "Stream your favorite movies and shows",
            is_active: true,
            category: "Streaming",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: netflixId,
            name: "Netflix Premium Profile Slot",
            price: 2500,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 5,
            access_type: "login_with_code",
            features: ["Personal profile access", "Watch on 1 device"]
        });

        // Spotify
        const spotifyId = await ctx.db.insert("subscription_catalog", {
            name: "Spotify",
            description: "Music for everyone",
            is_active: true,
            category: "Music",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: spotifyId,
            name: "Spotify Family Standard Slot",
            price: 750,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 6,
            access_type: "email_invite",
            features: ["Ad-free listening", "Offline downloads"]
        });

        // YouTube
        const youtubeId = await ctx.db.insert("subscription_catalog", {
            name: "YouTube",
            description: "Ad-free videos and music",
            is_active: true,
            category: "Streaming",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: youtubeId,
            name: "YouTube Premium Slot",
            price: 1100,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 6,
            access_type: "email_invite",
            features: ["Ad-free YouTube", "Background play"]
        });

        // Canva
        const canvaId = await ctx.db.insert("subscription_catalog", {
            name: "Canva",
            description: "Design anything",
            is_active: true,
            category: "Design",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_logo_2021.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: canvaId,
            name: "Canva Pro Team Slot",
            price: 1500,
            device_limit: 5,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 5,
            access_type: "email_invite",
            features: ["Premium assets", "Background Remover"]
        });

        // ChatGPT
        const chatgptId = await ctx.db.insert("subscription_catalog", {
            name: "ChatGPT",
            description: "The most capable AI",
            is_active: true,
            category: "AI",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: chatgptId,
            name: "ChatGPT Plus Slot",
            price: 3500,
            device_limit: 1,
            downloads_enabled: false,
            min_q_score: 0,
            capacity: 2,
            access_type: "login_with_code",
            features: ["GPT-4o access", "DALL-E"]
        });
    }
});

/**
 * Migration: Sync credentials from groups to subscriptions for old listings
 * Run this once to fix existing listings where login_email/login_password may be missing
 */
export const migrateCredentialsToSubscriptions = mutation({
    args: {},
    handler: async (ctx, args) => {
        const admin = await ctx.db.query("users").filter(q => q.eq(q.field("is_admin"), true)).first();
        if (!admin) throw new Error("Admin required");

        // Get all groups with account_email
        const groups = await ctx.db.query("groups").collect();
        let updated = 0;
        let skipped = 0;

        for (const group of groups) {
            if (!group.account_email) {
                skipped++;
                continue;
            }

            // Find subscriptions linked to this group
            const subscriptions = await ctx.db.query("subscriptions")
                .filter(q => q.eq(q.field("group_id"), group._id))
                .collect();

            for (const sub of subscriptions) {
                // Only update if login_email is missing
                if (!sub.login_email || sub.login_email === "ADMIN_MANAGED") {
                    await ctx.db.patch(sub._id, {
                        login_email: group.account_email,
                        updated_at: Date.now(),
                    });
                    updated++;
                } else {
                    skipped++;
                }
            }
        }

        return {
            success: true,
            updated,
            skipped,
            message: `Updated ${updated} subscriptions with credentials from groups`
        };
    },
});

export const adminUpdateFullListing = mutation({
    args: {
        marketplace_id: v.id("marketplace"),
        platform_name: v.string(),
        account_email: v.string(),
        login_password: v.optional(v.string()),
        plan_owner: v.string(),
        admin_renewal_date: v.string(),
        category: v.optional(v.string()),
        base_cost: v.optional(v.number()),
        instructions_text: v.optional(v.string()),
        instructions_image_url: v.optional(v.string()),
        slot_types: v.array(v.object({
            id: v.optional(v.id("slot_types")),
            name: v.string(),
            price: v.number(),
            capacity: v.number(),
            access_type: v.string(),
            downloads_enabled: v.boolean(),
        })),
    },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.marketplace_id);
        if (!listing) throw new Error("Marketplace listing not found");

        const normalizedCategory = args.category || "Streaming";
        const normalizedPlanOwner = args.plan_owner.trim().replace(/^@+/, "") || "admin";

        // 1. Update Catalog
        const catalog = await ctx.db.get(listing.subscription_catalog_id);
        if (catalog) {
            await ctx.db.patch(catalog._id, {
                name: args.platform_name,
                category: normalizedCategory,
                base_cost: args.base_cost ?? catalog.base_cost,
            });
        }

        // 2. Update Group
        const groups = await ctx.db.query("groups")
            .withIndex("by_listing_key", q => q
                .eq("subscription_catalog_id", listing.subscription_catalog_id)
                .eq("account_email", listing.account_email)
                .eq("billing_cycle_start", listing.billing_cycle_start)
                .eq("plan_owner", listing.plan_owner)
            )
            .collect();

        for (const group of groups) {
            await ctx.db.patch(group._id, {
                account_email: args.account_email,
                plan_owner: normalizedPlanOwner,
                billing_cycle_start: args.admin_renewal_date,
            });

            // 3. Update Subscription record if linked
            const subscription = await ctx.db.query("subscriptions")
                .filter(q => q.eq(q.field("group_id"), group._id))
                .first();

            if (subscription) {
                await ctx.db.patch(subscription._id, {
                    platform: args.platform_name,
                    login_email: args.account_email,
                    login_password: args.login_password ?? subscription.login_password,
                    base_cost: args.base_cost ?? subscription.base_cost,
                    category: normalizedCategory,
                    instructions_text: args.instructions_text ?? subscription.instructions_text,
                    instructions_image_url: args.instructions_image_url ?? subscription.instructions_image_url,
                    renewal_date: args.admin_renewal_date,
                    total_slots: args.slot_types.reduce((a, b) => a + b.capacity, 0),
                    slot_price: args.slot_types[0]?.price ?? 0,
                });
            }

            // 4. Handle Slot Types
            for (const st of args.slot_types) {
                if (st.id) {
                    // Update existing
                    const existingST = await ctx.db.get(st.id);
                    if (existingST) {
                        const oldCapacity = existingST.capacity || 0;
                        await ctx.db.patch(st.id, {
                            name: st.name,
                            price: st.price,
                            capacity: st.capacity,
                            access_type: st.access_type,
                            downloads_enabled: st.downloads_enabled,
                        });

                        // Adjust slots if capacity increased
                        if (st.capacity > oldCapacity && subscription) {
                            for (let i = oldCapacity + 1; i <= st.capacity; i++) {
                                await ctx.db.insert("subscription_slots", {
                                    subscription_id: subscription._id,
                                    group_id: group._id,
                                    slot_type_id: st.id,
                                    slot_number: i,
                                    status: "open",
                                    renewal_date: "",
                                    created_at: Date.now(),
                                });
                            }
                        }
                    }
                } else {
                    // Create new slot type
                    const newSlotTypeId = await ctx.db.insert("slot_types", {
                        subscription_id: listing.subscription_catalog_id,
                        name: st.name,
                        price: st.price,
                        capacity: st.capacity,
                        access_type: st.access_type,
                        device_limit: 1,
                        downloads_enabled: st.downloads_enabled,
                        min_q_score: 0,
                        features: ["Premium Access"]
                    });

                    if (subscription) {
                        for (let i = 1; i <= st.capacity; i++) {
                            await ctx.db.insert("subscription_slots", {
                                subscription_id: subscription._id,
                                group_id: group._id,
                                slot_type_id: newSlotTypeId,
                                slot_number: i,
                                status: "open",
                                renewal_date: "",
                                created_at: Date.now(),
                            });
                        }
                    }
                }
            }
        }

        // 5. Update Marketplace Record
        await ctx.db.patch(args.marketplace_id, {
            platform_name: args.platform_name,
            account_email: args.account_email,
            plan_owner: normalizedPlanOwner,
            billing_cycle_start: args.admin_renewal_date,
            category: normalizedCategory,
            slot_price: args.slot_types[0]?.price ?? 0,
            total_slots: args.slot_types.reduce((a, b) => a + b.capacity, 0),
            filled_slots: listing.filled_slots, // Preserve filled slots count
            available_slots: args.slot_types.reduce((a, b) => a + b.capacity, 0) - listing.filled_slots,
            updated_at: Date.now(),
        });

        return { success: true };
    }
});
