import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Platform Overview ───────────────────────────────────────────────────────

export const getPlatformStats = query({
    handler: async (ctx) => {
        const now = Date.now();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayMs = startOfToday.getTime();

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthMs = startOfMonth.getTime();

        const [users, slots, transactions, bootTransactions, campaigns, campaignParticipants, migrations, migratedSubs] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("subscription_slots").collect(),
            ctx.db.query("wallet_transactions").collect(),
            ctx.db.query("boot_transactions").collect(),
            ctx.db.query("campaigns").collect(),
            ctx.db.query("campaign_participants").collect(),
            ctx.db.query("migration_records").collect(),
            ctx.db.query("migrated_subscriptions").collect(),
        ]);

        const totalUsers = users.length;
        const newUsersToday = users.filter(u => u.created_at >= todayMs).length;
        const activeUsers = users.filter(u => !u.is_banned && !u.is_suspended).length;
        const suspendedUsers = users.filter(u => u.is_suspended).length;
        const bannedUsers = users.filter(u => u.is_banned).length;

        const activeMigratedSubs = migratedSubs.filter(m => m.status !== "failed").length;
        const filledSlots = slots.filter(s => s.user_id && s.status === "filled").length + activeMigratedSubs;
        const totalSlots = slots.length + activeMigratedSubs;
        const availableSlots = slots.length - slots.filter(s => s.user_id && s.status === "filled").length;

        const paymentTxns = transactions.filter(t => t.type === "payment");
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

        const totalBoots = users.reduce((s, u) => s + (u.boots_balance || 0), 0);
        const bootsIssuedToday = bootTransactions
            .filter(t => t.created_at >= todayMs && t.amount > 0)
            .reduce((s, t) => s + t.amount, 0);

        const activeCampaigns = campaigns.filter(c => c.status === "active").length;
        const totalMigrations = migrations.length + migratedSubs.length;
        const pendingMigrations = migrations.filter(m => m.status === "pending").length + migratedSubs.filter(m => m.status === "pending").length;

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
            totalCampaignParticipants: campaignParticipants.length,
            // Migrations
            totalMigrations,
            pendingMigrations,
        };
    }
});

export const getSubscriptionBreakdown = query({
    handler: async (ctx) => {
        const catalogItems = await ctx.db.query("subscription_catalog").collect();
        const migratedSubs = await ctx.db.query("migrated_subscriptions").collect();
        const activeMigratedSubs = migratedSubs.filter(m => m.status !== "failed");

        return await Promise.all(catalogItems.map(async (item) => {
            const slotTypes = await ctx.db.query("slot_types")
                .withIndex("by_subscription", q => q.eq("subscription_id", item._id))
                .collect();

            const groups = await ctx.db.query("groups")
                .withIndex("by_catalog", q => q.eq("subscription_catalog_id", item._id))
                .collect();

            let totalSlots = 0;
            let filledSlots = 0;
            let revenue = 0;

            for (const group of groups) {
                const slots = await ctx.db.query("subscription_slots")
                    .withIndex("by_group", q => q.eq("group_id", group._id))
                    .collect();

                totalSlots += slots.length;
                filledSlots += slots.filter(s => s.user_id && s.status === "filled").length;

                for (const slot of slots.filter(s => s.user_id && s.status === "filled")) {
                    const slotType = await ctx.db.get(slot.slot_type_id);
                    revenue += slotType?.price || 0;
                }
            }

            // Include relevant migrated subscriptions
            const relevantMigrated = activeMigratedSubs.filter(m => m.platform.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(m.platform.toLowerCase()));
            totalSlots += relevantMigrated.length;
            filledSlots += relevantMigrated.length;

            return {
                ...item,
                totalGroups: groups.length,
                totalSlots,
                filledSlots,
                availableSlots: totalSlots - filledSlots,
                estimatedRevenue: revenue,
            };
        }));
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
    }
});

export const unsuspendUser = mutation({
    args: { userId: v.id("users"), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor?.is_admin) throw new Error("Unauthorized");
        await ctx.db.patch(args.userId, { is_suspended: false });
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
        return await ctx.db.insert("support_tickets", {
            ...args,
            status: "open",
            created_at: Date.now(),
            updated_at: Date.now(),
        });
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
