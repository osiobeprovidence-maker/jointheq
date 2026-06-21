import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { createNotification } from "./notificationHelpers";
import { createUserActivityLog } from "./activityHelpers";

const normalizeSupportContacts = (settingsMap: Record<string, any>) => {
    const rawContacts = Array.isArray(settingsMap.whatsapp_support_contacts)
        ? settingsMap.whatsapp_support_contacts
        : [];

    const contacts = rawContacts
        .filter((contact: any) => contact && typeof contact.phone === "string" && contact.phone.trim())
        .map((contact: any, index: number) => ({
            name: typeof contact.name === "string" && contact.name.trim() ? contact.name.trim() : `Support ${index + 1}`,
            label: typeof contact.label === "string" && contact.label.trim() ? contact.label.trim() : "WhatsApp Support",
            phone: contact.phone.trim(),
        }))
        .slice(0, 3);

    if (contacts.length === 0 && typeof settingsMap.whatsapp_number === "string" && settingsMap.whatsapp_number.trim()) {
        contacts.push({
            name: "Support 1",
            label: "General Support",
            phone: settingsMap.whatsapp_number.trim(),
        });
    }

    return contacts;
};

const isLiveMarketplaceStatus = (status?: string) => status === "active";

const normalizeMarketplacePlatformName = (name?: string) =>
    (name || "").trim().replace(/\s+/g, " ").toLowerCase();

const addDays = (date: Date, days: number) =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const updateMarketplaceCountsForSlot = async (ctx: any, slot: any, delta: number) => {
    if (!slot.group_id) return;

    const group = await ctx.db.get(slot.group_id);
    if (!group?.account_email || !group.subscription_catalog_id) return;

    const marketplace = await ctx.db
        .query("marketplace")
        .withIndex("by_account_email", (q: any) => q.eq("account_email", group.account_email))
        .filter((q: any) => q.eq(q.field("subscription_catalog_id"), group.subscription_catalog_id))
        .first();

    if (!marketplace) return;

    const total = marketplace.total_slots || 0;
    const filled = Math.max(0, Math.min(total, (marketplace.filled_slots || 0) + delta));

    await ctx.db.patch(marketplace._id, {
        filled_slots: filled,
        available_slots: Math.max(0, total - filled),
        updated_at: Date.now(),
    });
};

// ─── Platform Overview ───────────────────────────────────────────────────────

export const getPlatformStats = query({
    handler: async (ctx) => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayMs = startOfToday.getTime();

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthMs = startOfMonth.getTime();

        const [users, marketplaceListings, transactions, bootTransactions, campaigns, campaignParticipants, tasks, taskSubmissions] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("marketplace").collect(),
            ctx.db.query("wallet_transactions").collect(),
            ctx.db.query("boot_transactions").collect(),
            ctx.db.query("campaigns").collect(),
            ctx.db.query("campaign_participants").collect(),
            ctx.db.query("tasks").collect(),
            ctx.db.query("task_submissions").collect(),
        ]);

        const totalUsers = users.length;
        const newUsersToday = users.filter(u => u.created_at >= todayMs).length;
        const activeUsers = users.filter(u => !u.is_banned && !u.is_suspended).length;
        const suspendedUsers = users.filter(u => u.is_suspended).length;
        const bannedUsers = users.filter(u => u.is_banned).length;

        const liveMarketplaceListings = marketplaceListings.filter((listing) =>
            isLiveMarketplaceStatus(listing.status) && (listing.total_slots || 0) > 0,
        );
        const filledSlots = liveMarketplaceListings.reduce(
            (sum, listing) => sum + (listing.filled_slots || 0),
            0,
        );
        const totalSlots = liveMarketplaceListings.reduce(
            (sum, listing) => sum + (listing.total_slots || 0),
            0,
        );
        const availableSlots = liveMarketplaceListings.reduce(
            (sum, listing) => sum + (listing.available_slots || 0),
            0,
        );

        const paymentTxns = transactions.filter(
            (t) => t.type === "payment" || t.type === "subscription" || t.type === "subscription_renewal",
        );
        const fundingTxns = transactions.filter(t => t.type === "funding");
        const refundTxns = transactions.filter(t => t.type === "refund");

        const revenueToday = paymentTxns
            .filter(t => t.created_at >= todayMs)
            .reduce((s, t) => s + t.amount, 0);

        const revenueThisMonth = paymentTxns
            .filter(t => t.created_at >= monthMs)
            .reduce((s, t) => s + t.amount, 0);

        const totalRevenue = paymentTxns.reduce((s, t) => s + t.amount, 0);
        const totalRefunds = refundTxns.reduce((s, t) => s + t.amount, 0);
        const totalFunded = fundingTxns.reduce((s, t) => s + t.amount, 0);

        const totalBoots = users.reduce((sum, user) => sum + (user.boots_balance || 0), 0);
        const bootsIssuedToday = bootTransactions
            .filter(t => t.created_at >= todayMs && t.amount > 0)
            .reduce((s, t) => s + t.amount, 0);

        const activeCampaigns = campaigns.filter(c => c.status === "active").length;
        const activeCampaignIds = new Set(
            campaigns.filter((campaign) => campaign.status === "active").map((campaign) => campaign._id),
        );
        const totalCampaignParticipants = campaignParticipants.filter((participant) =>
            activeCampaignIds.has(participant.campaign_id),
        ).length;

        return {
            // Users
            totalUsers,
            newUsersToday,
            activeUsers,
            suspendedUsers,
            bannedUsers,
            // Slots
            totalSlots,
            filledSlots,
            availableSlots,
            // Revenue
            revenueToday,
            revenueThisMonth,
            totalRevenue,
            totalRefunds,
            totalFunded,
            totalTransactions: paymentTxns.length,
            // BOOTS
            totalBoots,
            bootsIssuedToday,
            // Campaigns
            activeCampaigns,
            totalCampaignParticipants,
            // Quests (Tasks)
            totalQuests: tasks.length,
            questParticipants: new Set(taskSubmissions.map(s => s.userId)).size,
        };
    }
});

export const getSubscriptionBreakdown = query({
    handler: async (ctx) => {
        const [catalogItems, marketplaceListings] = await Promise.all([
            ctx.db.query("subscription_catalog").collect(),
            ctx.db.query("marketplace").collect(),
        ]);

        const liveMarketplaceListings = marketplaceListings.filter((listing) =>
            isLiveMarketplaceStatus(listing.status) && (listing.total_slots || 0) > 0,
        );

        const catalogById = new Map(catalogItems.map((item) => [item._id, item]));
        const aggregated = new Map<string, {
            _id: string;
            name: string;
            logo_url?: string;
            totalGroups: number;
            totalSlots: number;
            filledSlots: number;
            availableSlots: number;
            estimatedRevenue: number;
            is_active: boolean;
        }>();

        for (const listing of liveMarketplaceListings) {
            const catalog = catalogById.get(listing.subscription_catalog_id);
            const displayName = (catalog?.name || listing.platform_name || "Unknown").trim();
            const key = normalizeMarketplacePlatformName(displayName) || listing.subscription_catalog_id;
            const existing = aggregated.get(key);

            if (existing) {
                existing.totalGroups += 1;
                existing.totalSlots += listing.total_slots || 0;
                existing.filledSlots += listing.filled_slots || 0;
                existing.availableSlots += listing.available_slots || 0;
                existing.estimatedRevenue += (listing.filled_slots || 0) * (listing.slot_price || 0);
                continue;
            }

            aggregated.set(key, {
                _id: key,
                name: displayName,
                logo_url: catalog?.logo_url,
                totalGroups: 1,
                totalSlots: listing.total_slots || 0,
                filledSlots: listing.filled_slots || 0,
                availableSlots: listing.available_slots || 0,
                estimatedRevenue: (listing.filled_slots || 0) * (listing.slot_price || 0),
                is_active: true,
            });
        }

        return Array.from(aggregated.values()).sort((a, b) => {
            if (b.filledSlots !== a.filledSlots) return b.filledSlots - a.filledSlots;
            return a.name.localeCompare(b.name);
        });
    }
});

// ─── User Management ─────────────────────────────────────────────────────────

export const getAllUsers = query({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return await Promise.all(users.map(async (user) => {
            const slots = await ctx.db.query("subscription_slots")
                .withIndex("by_user", q => q.eq("user_id", user._id))
                .collect();
            const migrated = await ctx.db.query("migrated_subscriptions")
                .withIndex("by_user", q => q.eq("user_id", user._id))
                .collect();
            const txns = await ctx.db.query("wallet_transactions")
                .withIndex("by_user", q => q.eq("user_id", user._id))
                .collect();
            return {
                ...user,
                activeSubscriptions: slots.filter(s => s.status === "filled").length + migrated.filter(m => m.status !== "failed").length,
                totalPayments: txns.filter(t => t.type === "subscription").reduce((s, t) => s + t.amount, 0),
            };
        }));
    }
});

export const suspendUser = mutation({
    args: { userId: v.id("users"), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");
        await ctx.db.patch(args.userId, { is_suspended: true });

        try { createUserActivityLog(ctx, { userId: args.userId, category: "account", action: "Account suspended", status: "failed" }); } catch (e) { console.error("Failed to log activity:", e); }
    }
});

export const unsuspendUser = mutation({
    args: { userId: v.id("users"), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");
        await ctx.db.patch(args.userId, { is_suspended: false });

        try { createUserActivityLog(ctx, { userId: args.userId, category: "account", action: "Account restored", status: "success" }); } catch (e) { console.error("Failed to log activity:", e); }
    }
});

export const banUser = mutation({
    args: { userId: v.id("users"), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");
        const target = await ctx.db.get(args.userId);
        if (target?.email === "riderezzy@gmail.com") throw new Error("Cannot ban super admin.");
        await ctx.db.patch(args.userId, { is_banned: true, is_suspended: true });
    }
});

export const setAdminRole = mutation({
    args: { userId: v.id("users"), role: v.string(), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor || executor.email !== "riderezzy@gmail.com") {
            throw new Error("Only super admin can assign roles.");
        }
        await ctx.db.patch(args.userId, { admin_role: args.role });
    }
});

// ─── Support Tickets ─────────────────────────────────────────────────────────

export const getAllTickets = query({
    handler: async (ctx) => {
        const tickets = await ctx.db.query("support_tickets").collect();
        return await Promise.all(tickets.map(async (ticket) => {
            const user = await ctx.db.get(ticket.user_id);
            const admin = ticket.assigned_admin_id ? await ctx.db.get(ticket.assigned_admin_id) : null;
            return {
                ...ticket,
                user_name: user?.full_name || "Unknown",
                user_email: user?.email || "",
                username: user?.username || user?.full_name || "Unknown",
                admin_name: admin?.full_name || "Unassigned",
            };
        }));
    }
});

export const createTicket = mutation({
    args: {
        user_id: v.id("users"),
        category: v.string(),
        subject: v.string(),
    },
    handler: async (ctx, args) => {
        const ticketId = await ctx.db.insert("support_tickets", {
            ...args,
            status: "open",
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        try { createUserActivityLog(ctx, { userId: args.user_id, category: "support", action: "Support ticket created", description: args.subject, status: "pending" }); } catch (e) { console.error("Failed to log activity:", e); }

        return ticketId;
    }
});

export const updateTicketStatus = mutation({
    args: {
        ticketId: v.id("support_tickets"),
        status: v.string(),
        adminId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.ticketId, {
            status: args.status,
            assigned_admin_id: args.adminId,
            updated_at: Date.now(),
        });
    }
});

// ─── Campus Q / Campus Reps ──────────────────────────────────────────────────

export const getCampusReps = query({
    handler: async (ctx) => {
        const reps = await ctx.db.query("campus_reps").collect();
        return await Promise.all(reps.map(async (rep) => {
            const user = await ctx.db.get(rep.user_id);
            return {
                ...rep,
                full_name: user?.full_name || "Unknown",
                email: user?.email || "",
                username: user?.username || "",
            };
        }));
    }
});

export const addCampusRep = mutation({
    args: {
        user_id: v.id("users"),
        campus_name: v.string(),
        executorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");
        const existing = await ctx.db.query("campus_reps")
            .withIndex("by_user", q => q.eq("user_id", args.user_id))
            .unique();
        if (existing) throw new Error("User is already a campus rep.");
        return await ctx.db.insert("campus_reps", {
            user_id: args.user_id,
            campus_name: args.campus_name,
            commission_rate: 0.02,
            total_referred: 0,
            total_earned: 0,
            is_active: true,
            created_at: Date.now(),
        });
    }
});

export const getRecentTransactions = query({
    handler: async (ctx) => {
        const txns = await ctx.db.query("wallet_transactions").order("desc").take(50);
        return await Promise.all(txns.map(async (t) => {
            const user = await ctx.db.get(t.user_id);
            return { ...t, user_name: user?.full_name || "Unknown", user_email: user?.email || "" };
        }));
    }
});

// ─── Platform Settings ───────────────────────────────────────────────────────

export const getPlatformSettings = query({
    handler: async (ctx) => {
        const settings = await ctx.db.query("platform_settings").collect();
        const settingsMap: Record<string, any> = {};
        for (const s of settings) {
            settingsMap[s.key] = s.value;
        }
        const supportContacts = normalizeSupportContacts(settingsMap);
        settingsMap.whatsapp_support_contacts = supportContacts;
        settingsMap.whatsapp_number = supportContacts[0]?.phone || settingsMap.whatsapp_number || "";
        return settingsMap;
    }
});

export const updatePlatformSetting = mutation({
    args: {
        key: v.string(),
        value: v.any(),
        executorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");

        const existing = await ctx.db.query("platform_settings")
            .withIndex("by_key", q => q.eq("key", args.key))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.value,
                updated_at: Date.now(),
                updated_by: args.executorId,
            });
        } else {
            await ctx.db.insert("platform_settings", {
                key: args.key,
                value: args.value,
                updated_at: Date.now(),
                updated_by: args.executorId,
            });
        }
    }
});

export const adminSendNotification = mutation({
    args: {
        userId: v.optional(v.id("users")),
        title: v.string(),
        message: v.string(),
        type: v.string(),
        executorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");

        if (args.userId) {
            await ctx.db.insert("notifications", {
                user_id: args.userId,
                title: args.title,
                message: args.message,
                type: args.type,
                is_read: false,
                created_at: Date.now(),
            });
        } else {
            const users = await ctx.db.query("users").filter(q => q.eq(q.field("is_suspended"), false)).collect();
            for (const u of users) {
                await ctx.db.insert("notifications", {
                    user_id: u._id,
                    title: args.title,
                    message: args.message,
                    type: args.type,
                    is_read: false,
                    created_at: Date.now(),
                });
            }
        }
        return { success: true };
    }
});

const enrichCanceledSubscriptions = async (ctx: any, records: any[]) => {
    return await Promise.all(records.map(async (record) => {
        if (record.source_type !== "slot") {
            return {
                ...record,
                restore_available: false,
                restore_blocked_reason: record.restored_at ? "Already restored" : "Legacy cancellations must be recreated manually",
            };
        }

        const slotId = ctx.db.normalizeId("subscription_slots", record.source_id);
        const slot = slotId ? await ctx.db.get(slotId) : null;
        const restoreAvailable = Boolean(!record.restored_at && slot && !slot.user_id && slot.status === "open");

        return {
            ...record,
            current_slot_status: slot?.status,
            restore_available: restoreAvailable,
            restore_blocked_reason: record.restored_at
                ? "Already restored"
                : !slot
                    ? "Original slot no longer exists"
                    : slot.user_id
                        ? "Original slot has already been filled"
                        : slot.status !== "open"
                            ? `Original slot is ${slot.status}`
                            : undefined,
        };
    }));
};

export const getPendingLeaveRequests = query({
    handler: async (ctx) => {
        const slots = await ctx.db.query("subscription_slots")
            .withIndex("by_status", q => q.eq("status", "closing"))
            .collect();

        const migrations = await ctx.db.query("migrated_subscriptions")
            .withIndex("by_status", q => q.eq("status", "closing"))
            .collect();

        // Enrich slot requests with user and subscription info
        const enrichedSlots = await Promise.all(slots.map(async (slot) => {
            const user = slot.user_id ? await ctx.db.get(slot.user_id) : null;
            const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
            const subscription = slotType?.subscription_id ? await ctx.db.get(slotType.subscription_id as any) : null;
            const group = slot.group_id ? await ctx.db.get(slot.group_id) : null;

            return {
                ...slot,
                user_name: user?.full_name || "Unknown",
                user_email: user?.email || "",
                slot_name: slotType?.name || "Unknown",
                sub_name: (subscription as any)?.name || group?.subscription_catalog_id ? "Subscription" : "Unknown",
                renewal_date: slot.renewal_date,
                price: slotType?.price || 0,
                is_automatic_overdue_leave_request: Boolean(slot.removal_scheduled_at),
                leave_reason: slot.removal_scheduled_at
                    ? "Subscription overdue - admin review required before removal"
                    : "User requested to leave",
                requested_at: slot.removal_scheduled_at,
            };
        }));

        // Enrich migration requests with user info
        const enrichedMigrations = await Promise.all(migrations.map(async (mig) => {
            const user = await ctx.db.get(mig.user_id);
            return {
                ...mig,
                user_name: user?.full_name || "Unknown",
                user_email: user?.email || "",
                subscription_name: mig.platform,
                account_email: mig.email,
            };
        }));

        const canceledRecords = await ctx.db
            .query("canceled_subscriptions")
            .withIndex("by_canceled_at")
            .order("desc")
            .take(100);
        const canceled = await enrichCanceledSubscriptions(ctx, canceledRecords);

        return { slots: enrichedSlots, migrations: enrichedMigrations, canceled };
    }
});

export const getCanceledSubscriptions = query({
    handler: async (ctx) => {
        const records = await ctx.db
            .query("canceled_subscriptions")
            .withIndex("by_canceled_at")
            .order("desc")
            .take(100);

        return await enrichCanceledSubscriptions(ctx, records);
    }
});

export const approveLeaveRequest = mutation({
    args: { id: v.any(), type: v.string(), adminId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (args.type === "slot") {
            const slot = await ctx.db.get(args.id) as any;
            if (slot) {
                const user = slot.user_id ? await ctx.db.get(slot.user_id) as any : null;
                const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) as any : null;
                const subscription = slotType?.subscription_id ? await ctx.db.get(slotType.subscription_id as any) : null;
                const group = slot.group_id ? await ctx.db.get(slot.group_id) : null;

                await ctx.db.insert("canceled_subscriptions", {
                    user_id: slot.user_id,
                    user_name: user?.full_name || user?.username || "Unknown",
                    user_email: user?.email || "",
                    source_type: "slot",
                    source_id: String(args.id),
                    subscription_name: (subscription as any)?.name || (group as any)?.platform_name || "Subscription",
                    slot_name: slotType?.name || slot.profile_name || "Slot",
                    price: slotType?.price || 0,
                    renewal_date: slot.renewal_date,
                    reason: slot.removal_scheduled_at
                        ? "Automatic overdue leave request approved by admin"
                        : "Leave request approved by admin",
                    canceled_by: args.adminId,
                    canceled_at: Date.now(),
                    created_at: Date.now(),
                });

                await ctx.db.patch(args.id, {
                    user_id: undefined,
                    status: "open",
                    renewal_date: undefined,
                    allocation: undefined,
                });
            }
        } else if (args.type === "migration") {
            const migration = await ctx.db.get(args.id) as any;
            if (migration) {
                const user = await ctx.db.get(migration.user_id) as any;
                await ctx.db.insert("canceled_subscriptions", {
                    user_id: migration.user_id,
                    user_name: user?.full_name || user?.username || migration.profile_name || "Unknown",
                    user_email: user?.email || migration.email || "",
                    source_type: "migration",
                    source_id: String(args.id),
                    subscription_name: migration.platform,
                    platform: migration.platform,
                    account_email: migration.email,
                    renewal_date: String(migration.payment_day || ""),
                    reason: "Migrated subscription leave request approved by admin",
                    canceled_by: args.adminId,
                    canceled_at: Date.now(),
                    created_at: Date.now(),
                });
                await ctx.db.delete(args.id);
            }
        }
        return { success: true };
    }
});

export const keepOverdueSubscriptionActive = mutation({
    args: {
        slotId: v.id("subscription_slots"),
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const slot = await ctx.db.get(args.slotId);
        if (!slot) throw new Error("Subscription slot not found");
        if (!slot.user_id) throw new Error("This slot no longer has a user to keep active");
        if (slot.status !== "closing" || !slot.removal_scheduled_at) {
            throw new Error("This subscription is not waiting for overdue review");
        }

        await ctx.db.patch(slot._id, {
            status: "filled",
            removal_scheduled_at: undefined,
        });

        await createNotification(ctx, {
            userId: slot.user_id,
            title: "Subscription kept active",
            message: "Admin confirmed your subscription remains active after renewal review.",
            type: "subscription",
        });

        return { success: true, renewalDate: slot.renewal_date };
    }
});

// ─── User Management Enhancements ───────────────────────────────────────────

export const restoreCanceledSubscription = mutation({
    args: {
        canceledId: v.id("canceled_subscriptions"),
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const record = await ctx.db.get(args.canceledId);
        if (!record) throw new Error("Cancellation record not found");
        if (record.restored_at) throw new Error("This subscription has already been added back");
        if (record.source_type !== "slot") {
            throw new Error("Only marketplace slot cancellations can be added back automatically");
        }
        if (!record.user_id) throw new Error("This cancellation record has no user to restore");

        const user = await ctx.db.get(record.user_id);
        if (!user) throw new Error("User no longer exists");

        const slotId = ctx.db.normalizeId("subscription_slots", record.source_id);
        if (!slotId) throw new Error("Original slot ID is invalid");

        const slot = await ctx.db.get(slotId);
        if (!slot) throw new Error("Original slot no longer exists");
        if (slot.user_id || slot.status !== "open") {
            throw new Error("Original slot is no longer available");
        }

        const recordedRenewal = record.renewal_date ? new Date(record.renewal_date) : null;
        const baseDate = recordedRenewal && Number.isFinite(recordedRenewal.getTime())
            ? recordedRenewal
            : new Date();
        const nextRenewal = addDays(baseDate, 30).toISOString();

        await ctx.db.patch(slotId, {
            user_id: record.user_id,
            status: "filled",
            renewal_date: nextRenewal,
            auto_renew: true,
            removal_scheduled_at: undefined,
        });

        await ctx.db.patch(record._id, {
            restored_by: args.adminId,
            restored_at: Date.now(),
        });

        await updateMarketplaceCountsForSlot(ctx, slot, 1);

        await createNotification(ctx, {
            userId: record.user_id,
            title: "Subscription restored",
            message: `Admin has added you back to ${record.subscription_name || "your subscription"}. Your next renewal is ${new Date(nextRenewal).toLocaleDateString()}.`,
            type: "subscription",
        });

        return { success: true, nextRenewal };
    }
});

export const adjustUserBalance = mutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        type: v.union(v.literal("add"), v.literal("remove")),
        reason: v.string(),
        executorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const normalizedAmount = Math.abs(args.amount);
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw new Error("Enter a valid amount");
        }

        const currentBalance = user.wallet_balance || 0;
        const newBalance = args.type === "add"
            ? currentBalance + normalizedAmount
            : currentBalance - normalizedAmount;

        if (newBalance < 0 && args.type === "remove") throw new Error("Insufficient balance");

        await ctx.db.patch(args.userId, {
            wallet_balance: newBalance,
        });

        // Record transaction
        await ctx.db.insert("wallet_transactions", {
            user_id: args.userId,
            amount: normalizedAmount,
            type: args.type === "add" ? "funding" : "payment",
            source: "admin_adjustment",
            status: "completed",
            description: `Admin adjustment: ${args.reason}`,
            created_at: Date.now(),
        });

        await createNotification(ctx, {
            userId: args.userId,
            title: args.type === "add" ? "Wallet balance updated" : "Wallet balance adjusted",
            message: args.type === "add"
                ? `Admin added N${normalizedAmount.toLocaleString()} to your wallet. Reason: ${args.reason}`
                : `Admin removed N${normalizedAmount.toLocaleString()} from your wallet. Reason: ${args.reason}`,
            type: args.type === "add" ? "funding" : "payment",
        });

        // Log admin action
        await ctx.db.insert("admin_logs", {
            admin_id: args.executorId,
            admin_role: executor.admin_role || "admin",
            action_type: "balance_adjustment",
            target_type: "user",
            target_id: args.userId,
            target_name: user.full_name,
            details: `${args.type === "add" ? "Added" : "Removed"} N${normalizedAmount}`,
            reason: args.reason,
            created_at: Date.now(),
        });

        try { createUserActivityLog(ctx, { userId: args.userId, category: "wallet", action: "Balance Adjustment", description: `Admin ${args.type === "add" ? "added" : "removed"} ₦${normalizedAmount} - ${args.reason}`, status: "success", amount: args.type === "add" ? normalizedAmount : -normalizedAmount }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true, newBalance };
    }
});

export const adjustUserBoots = mutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        type: v.union(v.literal("add"), v.literal("remove")),
        reason: v.string(),
        executorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const normalizedAmount = Math.abs(args.amount);
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw new Error("Enter a valid amount");
        }

        const currentBoots = user.boots_balance || 0;
        const newBoots = args.type === "add"
            ? currentBoots + normalizedAmount
            : currentBoots - normalizedAmount;

        if (newBoots < 0 && args.type === "remove") throw new Error("Insufficient BOOTS");

        await ctx.db.patch(args.userId, {
            boots_balance: newBoots,
        });

        // Record BOOTS transaction
        await ctx.db.insert("boot_transactions", {
            user_id: args.userId,
            amount: args.type === "add" ? normalizedAmount : -normalizedAmount,
            type: "admin_adjustment",
            description: args.reason,
            created_at: Date.now(),
        });

        // Log admin action
        await ctx.db.insert("admin_logs", {
            admin_id: args.executorId,
            admin_role: executor.admin_role || "admin",
            action_type: "boots_adjustment",
            target_type: "user",
            target_id: args.userId,
            target_name: user.full_name,
            details: `${args.type === "add" ? "Added" : "Removed"} ${normalizedAmount} BOOTS`,
            reason: args.reason,
            created_at: Date.now(),
        });

        try { createUserActivityLog(ctx, { userId: args.userId, category: "wallet", action: "BOOTS Adjustment", description: `Admin ${args.type === "add" ? "added" : "removed"} ${normalizedAmount} BOOTS - ${args.reason}`, status: "success", amount: normalizedAmount }); } catch (e) { console.error("Failed to log activity:", e); }

        return { success: true, newBoots };
    }
});

export const getUserAdminLogs = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const logs = await ctx.db.query("admin_logs")
            .withIndex("by_target", q => q.eq("target_type", "user").eq("target_id", args.userId))
            .order("desc")
            .collect();

        return await Promise.all(logs.map(async (log) => {
            const admin = await ctx.db.get(log.admin_id);
            return {
                ...log,
                admin_name: admin?.full_name || "Unknown Admin",
            };
        }));
    }
});

export const adminSyncAllMarketplace = mutation({
    args: {},
    handler: async (ctx) => {
        const marketplace = await ctx.db.query('marketplace').collect();
        for (const m of marketplace) {
            const group = await ctx.db.query('groups')
                .withIndex('by_catalog', q => q.eq('subscription_catalog_id', m.subscription_catalog_id))
                .filter(q => q.eq(q.field('account_email'), m.account_email))
                .first();
            
            if (group) {
                const allSlots = await ctx.db.query('subscription_slots')
                    .withIndex('by_group', q => q.eq('group_id', group._id))
                    .collect();

                const total = allSlots.length;
                const available = allSlots.filter(s => s.status === 'open').length;
                const filled = total - available;

                await ctx.db.patch(m._id, {
                    total_slots: total,
                    filled_slots: filled,
                    available_slots: available,
                    updated_at: Date.now(),
                });
            }
        }
        return { success: true, count: marketplace.length };
    }
});

export const getLoginLogs = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const logs = await ctx.db
            .query("user_login_logs")
            .withIndex("by_created_at")
            .order("desc")
            .take(args.limit ?? 100);

        const userIds = [...new Set(logs.map(l => l.user_id))];
        const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
        const userMap = new Map(users.filter(Boolean).map(u => [u!._id, u!]));

        return logs.map(log => ({
            ...log,
            user: userMap.get(log.user_id) ?? null,
        }));
    },
});
