import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_ROLES = {
    super: { label: "Super Admin", color: "bg-purple-500", tabs: ["all"] },
    support: { label: "Support Admin", color: "bg-blue-500", tabs: ["support", "users"] },
    operations: { label: "Operations Admin", color: "bg-amber-500", tabs: ["marketplace", "users"] },
    finance: { label: "Finance Admin", color: "bg-emerald-500", tabs: ["payments", "dashboard"] },
    campaigns: { label: "Campaign Admin", color: "bg-pink-500", tabs: ["campaigns", "campus"] },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN TEAM QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get all admins with task/ticket stats */
export const getAdminTeam = query({
    handler: async (ctx) => {
        const admins = await ctx.db.query("users")
            .filter(q => q.eq(q.field("is_admin"), true))
            .collect();

        return await Promise.all(admins.map(async (admin) => {
            const tasks = await ctx.db.query("admin_tasks")
                .withIndex("by_assignee", q => q.eq("assigned_to", admin._id))
                .collect();
            const tickets = await ctx.db.query("support_tickets")
                .withIndex("by_admin", q => q.eq("assigned_admin_id", admin._id))
                .collect();
            const logs = await ctx.db.query("admin_logs")
                .withIndex("by_admin", q => q.eq("admin_id", admin._id))
                .collect();

            const tasksCompleted = tasks.filter(t => t.status === "completed").length;
            const tasksPending = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
            const tasksOverdue = tasks.filter(t => t.status === "overdue" || (t.status !== "completed" && t.deadline < Date.now())).length;
            const ticketsResolved = tickets.filter(t => t.status === "resolved").length;

            return {
                ...admin,
                password_hash: undefined, // Never expose hash
                tasks_completed: tasksCompleted,
                tasks_pending: tasksPending,
                tasks_overdue: tasksOverdue,
                tickets_resolved: ticketsResolved,
                total_actions: logs.length,
                last_active: logs[logs.length - 1]?.created_at ?? admin.created_at,
            };
        }));
    },
});

/** Get all pending admin invitations */
export const getInvitations = query({
    handler: async (ctx) => {
        const invites = await ctx.db.query("admin_invitations").collect();
        return await Promise.all(invites.map(async inv => {
            const inviter = await ctx.db.get(inv.invited_by);
            return { ...inv, invited_by_name: inviter?.full_name ?? "Unknown" };
        }));
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN INVITATION
// ─────────────────────────────────────────────────────────────────────────────

/** Super admin creates an invitation */
export const createInvitation = mutation({
    args: {
        email: v.string(),
        role: v.string(),
        work_username: v.string(),
        invited_by: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify inviter is super admin
        const inviter = await ctx.db.get(args.invited_by);
        if (!inviter?.is_admin || inviter.admin_role !== "super") {
            throw new Error("Only Super Admins can invite new admins");
        }

        // Check work_username unique
        const existingUsername = await ctx.db.query("users")
            .filter(q => q.eq(q.field("work_username"), args.work_username))
            .first();
        if (existingUsername) throw new Error(`Work username @${args.work_username} is already taken`);

        // Check pending invite for same email
        const existingInvite = await ctx.db.query("admin_invitations")
            .withIndex("by_email", q => q.eq("email", args.email))
            .filter(q => q.eq(q.field("status"), "pending"))
            .first();
        if (existingInvite) throw new Error("A pending invitation already exists for this email");

        // Generate token
        const token = `adminInv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const now = Date.now();

        const invId = await ctx.db.insert("admin_invitations", {
            email: args.email,
            role: args.role,
            work_username: args.work_username,
            invited_by: args.invited_by,
            token,
            status: "pending",
            expires_at: now + 48 * 60 * 60 * 1000, // 48 hours
            created_at: now,
        });

        // Log this action
        await ctx.db.insert("admin_logs", {
            admin_id: args.invited_by,
            action: "invited_admin",
            target_type: "invitation",
            target_name: `${args.email} as @${args.work_username} (${args.role})`,
            created_at: now,
        });

        return { invId, token, invite_link: `https://jointheq.sbs/admin-accept?token=${token}` };

    },
});

/** Revoke a pending invitation */
export const revokeInvitation = mutation({
    args: { invitation_id: v.id("admin_invitations"), revoked_by: v.id("users") },
    handler: async (ctx, args) => {
        const inv = await ctx.db.get(args.invitation_id);
        if (!inv) throw new Error("Invitation not found");
        await ctx.db.patch(args.invitation_id, { status: "expired" });
        await ctx.db.insert("admin_logs", {
            admin_id: args.revoked_by,
            action: "revoked_invitation",
            target_type: "invitation",
            target_name: inv.email,
            created_at: Date.now(),
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** Super admin updates admin role or work_username */
export const updateAdminProfile = mutation({
    args: {
        target_id: v.id("users"),
        updated_by: v.id("users"),
        work_username: v.optional(v.string()),
        admin_role: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const updater = await ctx.db.get(args.updated_by);
        if (!updater?.is_admin || updater.admin_role !== "super") {
            throw new Error("Only Super Admins can update admin profiles");
        }
        const patch: any = {};
        if (args.work_username !== undefined) patch.work_username = args.work_username;
        if (args.admin_role !== undefined) patch.admin_role = args.admin_role;
        await ctx.db.patch(args.target_id, patch);
        const target = await ctx.db.get(args.target_id);
        await ctx.db.insert("admin_logs", {
            admin_id: args.updated_by,
            action: "updated_admin_profile",
            target_type: "user",
            target_name: `@${target?.work_username ?? target?.full_name}`,
            details: JSON.stringify(patch),
            created_at: Date.now(),
        });
    },
});

/** Super admin suspends admin access (without banning their user account) */
export const suspendAdminAccess = mutation({
    args: { target_id: v.id("users"), suspended_by: v.id("users"), reason: v.string() },
    handler: async (ctx, args) => {
        const suspender = await ctx.db.get(args.suspended_by);
        if (!suspender?.is_admin || suspender.admin_role !== "super") throw new Error("Unauthorized");
        const now = Date.now();
        await ctx.db.patch(args.target_id, { is_admin_suspended: true, admin_suspended_at: now });
        const target = await ctx.db.get(args.target_id);
        await ctx.db.insert("admin_logs", {
            admin_id: args.suspended_by,
            action: "suspended_admin_access",
            target_type: "user",
            target_name: `@${target?.work_username ?? target?.full_name}`,
            details: `Reason: ${args.reason}`,
            created_at: now,
        });
    },
});

/** Restore admin access */
export const restoreAdminAccess = mutation({
    args: { target_id: v.id("users"), restored_by: v.id("users") },
    handler: async (ctx, args) => {
        const restorer = await ctx.db.get(args.restored_by);
        if (!restorer?.is_admin || restorer.admin_role !== "super") throw new Error("Unauthorized");
        await ctx.db.patch(args.target_id, { is_admin_suspended: false, admin_suspended_at: undefined });
        const target = await ctx.db.get(args.target_id);
        await ctx.db.insert("admin_logs", {
            admin_id: args.restored_by,
            action: "restored_admin_access",
            target_type: "user",
            target_name: `@${target?.work_username ?? target?.full_name}`,
            created_at: Date.now(),
        });
    },
});

/** Remove admin entirely */
export const removeAdmin = mutation({
    args: { target_id: v.id("users"), removed_by: v.id("users") },
    handler: async (ctx, args) => {
        const remover = await ctx.db.get(args.removed_by);
        if (!remover?.is_admin || remover.admin_role !== "super") throw new Error("Unauthorized");
        const target = await ctx.db.get(args.target_id);
        await ctx.db.patch(args.target_id, {
            is_admin: false,
            admin_role: undefined,
            work_username: undefined,
            is_admin_suspended: false,
        });
        await ctx.db.insert("admin_logs", {
            admin_id: args.removed_by,
            action: "removed_admin",
            target_type: "user",
            target_name: `@${target?.work_username ?? target?.full_name}`,
            created_at: Date.now(),
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

/** Get all tasks with assignee + assigner info */
export const getAllTasks = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, { status }) => {
        const tasks = status
            ? await ctx.db.query("admin_tasks").withIndex("by_status", q => q.eq("status", status)).collect()
            : await ctx.db.query("admin_tasks").collect();

        return await Promise.all(tasks.map(async t => {
            const assignee = await ctx.db.get(t.assigned_to);
            const assigner = await ctx.db.get(t.assigned_by);
            const isOverdue = t.status !== "completed" && t.deadline < Date.now();
            return {
                ...t,
                status: isOverdue && t.status !== "completed" ? "overdue" : t.status,
                assignee_name: assignee?.work_username ?? assignee?.full_name ?? "Unknown",
                assigner_name: assigner?.work_username ?? assigner?.full_name ?? "Unknown",
                days_until_due: Math.ceil((t.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
            };
        }));
    },
});

/** Get tasks for a specific admin */
export const getMyTasks = query({
    args: { admin_id: v.id("users") },
    handler: async (ctx, { admin_id }) => {
        const tasks = await ctx.db.query("admin_tasks")
            .withIndex("by_assignee", q => q.eq("assigned_to", admin_id))
            .collect();

        return tasks.map(t => ({
            ...t,
            status: t.status !== "completed" && t.deadline < Date.now() ? "overdue" : t.status,
            days_until_due: Math.ceil((t.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
        })).sort((a, b) => {
            // Sort: overdue first, then by deadline
            if (a.status === "overdue" && b.status !== "overdue") return -1;
            if (b.status === "overdue" && a.status !== "overdue") return 1;
            return a.deadline - b.deadline;
        });
    },
});

/** Super admin creates a task */
export const createTask = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        assigned_to: v.id("users"),
        assigned_by: v.id("users"),
        deadline: v.number(),
        priority: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const assigner = await ctx.db.get(args.assigned_by);
        if (!assigner?.is_admin || assigner.admin_role !== "super") {
            throw new Error("Only Super Admins can assign tasks");
        }

        const now = Date.now();
        const taskId = await ctx.db.insert("admin_tasks", {
            ...args,
            status: "pending",
            created_at: now,
        });

        // Notify assignee
        const assignee = await ctx.db.get(args.assigned_to);
        await ctx.db.insert("admin_notifications", {
            admin_id: args.assigned_to,
            title: "New Task Assigned",
            message: `@${assigner.work_username ?? assigner.full_name} assigned you: "${args.title}" — Due ${new Date(args.deadline).toLocaleDateString()}`,
            type: "task_assigned",
            is_read: false,
            related_task_id: taskId,
            created_at: now,
        });

        // Log
        await ctx.db.insert("admin_logs", {
            admin_id: args.assigned_by,
            action: "created_task",
            target_type: "task",
            target_name: args.title,
            details: `Assigned to @${assignee?.work_username ?? assignee?.full_name}`,
            created_at: now,
        });

        return taskId;
    },
});

/** Admin updates task status or adds notes */
export const updateTask = mutation({
    args: {
        task_id: v.id("admin_tasks"),
        admin_id: v.id("users"),
        status: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.task_id);
        if (!task) throw new Error("Task not found");

        const now = Date.now();
        const patch: any = {};
        if (args.status) patch.status = args.status;
        if (args.notes !== undefined) patch.notes = args.notes;
        if (args.status === "completed") patch.completed_at = now;
        await ctx.db.patch(args.task_id, patch);

        const admin = await ctx.db.get(args.admin_id);
        await ctx.db.insert("admin_logs", {
            admin_id: args.admin_id,
            action: `updated_task_to_${args.status ?? "notes"}`,
            target_type: "task",
            target_name: task.title,
            details: args.notes ? `Notes: ${args.notes}` : undefined,
            created_at: now,
        });

        return patch;
    },
});

/** Delete a task (super admin only) */
export const deleteTask = mutation({
    args: { task_id: v.id("admin_tasks"), deleted_by: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.deleted_by);
        if (!admin?.is_admin || admin.admin_role !== "super") throw new Error("Unauthorized");
        const task = await ctx.db.get(args.task_id);
        await ctx.db.delete(args.task_id);
        await ctx.db.insert("admin_logs", {
            admin_id: args.deleted_by,
            action: "deleted_task",
            target_type: "task",
            target_name: task?.title ?? "Unknown",
            created_at: Date.now(),
        });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGS & AUDIT
// ─────────────────────────────────────────────────────────────────────────────

/** Log an admin action — called from other mutations */
export const logAction = mutation({
    args: {
        admin_id: v.id("users"),
        action: v.string(),
        target_type: v.optional(v.string()),
        target_id: v.optional(v.string()),
        target_name: v.optional(v.string()),
        details: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("admin_logs", { ...args, created_at: Date.now() });
    },
});

/** Get recent logs (global or per admin) */
export const getAdminLogs = query({
    args: {
        admin_id: v.optional(v.id("users")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { admin_id, limit }) => {
        const logs = admin_id
            ? await ctx.db.query("admin_logs").withIndex("by_admin", q => q.eq("admin_id", admin_id)).collect()
            : await ctx.db.query("admin_logs").withIndex("by_created_at").order("desc").collect();

        const enriched = await Promise.all(logs.map(async l => {
            const admin = await ctx.db.get(l.admin_id);
            return {
                ...l,
                work_username: admin?.work_username ?? admin?.full_name ?? "Unknown",
                admin_role: admin?.admin_role ?? "",
            };
        }));

        return enriched
            .sort((a, b) => b.created_at - a.created_at)
            .slice(0, limit ?? 100);
    },
});

/** Audit: get all actions by one admin in last N days */
export const auditAdmin = query({
    args: { admin_id: v.id("users"), days: v.optional(v.number()) },
    handler: async (ctx, { admin_id, days }) => {
        const since = Date.now() - (days ?? 7) * 24 * 60 * 60 * 1000;
        const logs = await ctx.db.query("admin_logs")
            .withIndex("by_admin", q => q.eq("admin_id", admin_id))
            .filter(q => q.gte(q.field("created_at"), since))
            .collect();

        const admin = await ctx.db.get(admin_id);
        return {
            admin_name: admin?.full_name,
            work_username: admin?.work_username,
            admin_role: admin?.admin_role,
            period_days: days ?? 7,
            total_actions: logs.length,
            logs: logs.sort((a, b) => b.created_at - a.created_at),
            action_breakdown: logs.reduce((acc: Record<string, number>, l) => {
                acc[l.action] = (acc[l.action] ?? 0) + 1;
                return acc;
            }, {}),
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────

/** Get performance metrics for all admins */
export const getPerformanceMetrics = query({
    handler: async (ctx) => {
        const admins = await ctx.db.query("users")
            .filter(q => q.eq(q.field("is_admin"), true))
            .collect();

        return await Promise.all(admins.map(async admin => {
            const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
            const monthStart = thisMonth.getTime();

            const allTasks = await ctx.db.query("admin_tasks")
                .withIndex("by_assignee", q => q.eq("assigned_to", admin._id))
                .collect();
            const allTickets = await ctx.db.query("support_tickets")
                .withIndex("by_admin", q => q.eq("assigned_admin_id", admin._id))
                .collect();
            const monthLogs = await ctx.db.query("admin_logs")
                .withIndex("by_admin", q => q.eq("admin_id", admin._id))
                .filter(q => q.gte(q.field("created_at"), monthStart))
                .collect();

            const tasksCompleted = allTasks.filter(t => t.status === "completed" && (t.completed_at ?? 0) >= monthStart).length;
            const tasksOverdue = allTasks.filter(t => t.status !== "completed" && t.deadline < Date.now()).length;
            const ticketsResolved = allTickets.filter(t => t.status === "resolved" && t.updated_at >= monthStart).length;

            // On-time completion rate
            const completedWithDeadline = allTasks.filter(t => t.status === "completed" && t.completed_at);
            const onTime = completedWithDeadline.filter(t => (t.completed_at ?? 0) <= t.deadline).length;
            const completionRate = completedWithDeadline.length > 0
                ? Math.round((onTime / completedWithDeadline.length) * 100)
                : 100;

            return {
                admin_id: admin._id,
                full_name: admin.full_name,
                work_username: admin.work_username ?? admin.full_name,
                admin_role: admin.admin_role ?? "support",
                tasks_completed_this_month: tasksCompleted,
                tasks_overdue: tasksOverdue,
                tickets_resolved_this_month: ticketsResolved,
                actions_this_month: monthLogs.length,
                on_time_completion_rate: completionRate,
            };
        }));
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Get notifications for a specific admin */
export const getMyNotifications = query({
    args: { admin_id: v.id("users") },
    handler: async (ctx, { admin_id }) => {
        return await ctx.db.query("admin_notifications")
            .withIndex("by_admin", q => q.eq("admin_id", admin_id))
            .order("desc")
            .collect();
    },
});

/** Mark a notification as read */
export const markNotificationRead = mutation({
    args: { notification_id: v.id("admin_notifications") },
    handler: async (ctx, { notification_id }) => {
        await ctx.db.patch(notification_id, { is_read: true });
    },
});

/** Mark all notifications read for an admin */
export const markAllRead = mutation({
    args: { admin_id: v.id("users") },
    handler: async (ctx, { admin_id }) => {
        const notes = await ctx.db.query("admin_notifications")
            .withIndex("by_admin", q => q.eq("admin_id", admin_id))
            .filter(q => q.eq(q.field("is_read"), false))
            .collect();
        await Promise.all(notes.map(n => ctx.db.patch(n._id, { is_read: true })));
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PLATFORM REPORT
// ─────────────────────────────────────────────────────────────────────────────

/** Auto-generated daily platform summary */
export const getDailyReport = query({
    handler: async (ctx) => {
        const now = Date.now();
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const todayMs = dayStart.getTime();
        const yesterdayMs = todayMs - 86400000;

        // Users
        const allUsers = await ctx.db.query("users").collect();
        const newToday = allUsers.filter(u => u.created_at >= todayMs).length;
        const newYesterday = allUsers.filter(u => u.created_at >= yesterdayMs && u.created_at < todayMs).length;

        // Payments/revenue
        const allTxns = await ctx.db.query("transactions").collect();
        const todayTxns = allTxns.filter(t => t.created_at >= todayMs);
        const yesterdayTxns = allTxns.filter(t => t.created_at >= yesterdayMs && t.created_at < todayMs);
        const revenueToday = todayTxns.reduce((s, t) => s + t.amount, 0);
        const revenueYesterday = yesterdayTxns.reduce((s, t) => s + t.amount, 0);

        // Support tickets
        const allTickets = await ctx.db.query("support_tickets").collect();
        const openTickets = allTickets.filter(t => t.status === "open").length;
        const resolvedToday = allTickets.filter(t => t.status === "resolved" && t.updated_at >= todayMs).length;
        const newTicketsToday = allTickets.filter(t => t.created_at >= todayMs).length;

        // Campaigns
        const allCampaigns = await ctx.db.query("campaigns").collect();
        const activeCampaigns = allCampaigns.filter(c => c.status === "active").length;

        // New subscriptions/slots
        const allSlots = await ctx.db.query("subscription_slots").collect();
        const newSlotsToday = allSlots.filter(s => (s as any).created_at >= todayMs).length;

        // Campaign referrals today
        const allReferrals = await ctx.db.query("campaign_referrals").collect();
        const referralsToday = allReferrals.filter(r => r.created_at >= todayMs).length;

        // Fraud flags today
        const allFlags = await ctx.db.query("fraud_flags").collect();
        const flagsToday = allFlags.filter(f => f.created_at >= todayMs).length;
        const openFlags = allFlags.filter(f => f.status === "open").length;

        // Admin activity today
        const allLogs = await ctx.db.query("admin_logs").withIndex("by_created_at").collect();
        const adminActionsToday = allLogs.filter(l => l.created_at >= todayMs).length;

        return {
            generated_at: now,
            date: new Date(todayMs).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
            users: {
                total: allUsers.length,
                new_today: newToday,
                new_yesterday: newYesterday,
                trend: newToday >= newYesterday ? "up" : "down",
            },
            revenue: {
                today: revenueToday,
                yesterday: revenueYesterday,
                transactions_today: todayTxns.length,
                trend: revenueToday >= revenueYesterday ? "up" : "down",
            },
            support: {
                open_tickets: openTickets,
                resolved_today: resolvedToday,
                new_today: newTicketsToday,
            },
            campaigns: {
                active: activeCampaigns,
                referrals_today: referralsToday,
            },
            subscriptions: {
                new_slots_today: newSlotsToday,
                total_slots: allSlots.length,
            },
            security: {
                flags_today: flagsToday,
                open_flags: openFlags,
            },
            admin_activity: {
                actions_today: adminActionsToday,
            },
        };
    },
});
