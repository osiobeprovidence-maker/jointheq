import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── ADMIN LOGGING HELPER ─────────────────────────────────────────────────────

async function logAdminAction(
    ctx: any,
    adminId: Id<"users">,
    actionType: string,
    targetType?: string,
    targetId?: string,
    targetName?: string,
    details?: string,
    reason?: string,
    metadata?: any
) {
    const admin = await ctx.db.get(adminId);
    return await ctx.db.insert("admin_logs", {
        admin_id: adminId,
        admin_role: admin?.admin_role || "admin",
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        details,
        reason,
        metadata,
        created_at: Date.now(),
    });
}

// ─── ROLE-BASED ACCESS CONTROL ────────────────────────────────────────────────

export const checkAdminPermission = query({
    args: { adminId: v.id("users"), permission: v.string() },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin || !admin.is_admin) return false;

        // Super admin has all permissions
        if (admin.email === "riderezzy@gmail.com" || admin.admin_role === "super" || admin.admin_role === "super_admin") {
            return true;
        }

        // Check role-based permissions
        const rolePermissions: Record<string, string[]> = {
            "super": ["*"],
            "super_admin": ["*"],
            "finance_admin": ["payments.view", "payments.override", "payments.approve", "users.view", "logs.view"],
            "support_admin": ["users.view", "users.suspend", "support.manage", "notifications.send", "logs.view"],
            "ops_admin": ["slots.manage", "groups.manage", "waitlist.manage", "users.view", "logs.view"],
        };

        const perms = rolePermissions[admin.admin_role || ""] || [];
        return perms.includes("*") || perms.includes(args.permission);
    }
});

export const getAdminRole = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin || !admin.is_admin) return null;

        const isSuper = admin.email === "riderezzy@gmail.com" || admin.admin_role === "super" || admin.admin_role === "super_admin";

        return {
            role: admin.admin_role || "admin",
            email: admin.email,
            isSuperAdmin: isSuper,
        };
    }
});

// ─── MANUAL SLOT ASSIGNMENT ───────────────────────────────────────────────────

export const adminAssignUserToSlot = mutation({
    args: {
        adminId: v.id("users"),
        userId: v.id("users"),
        slotTypeId: v.id("slot_types"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        const slotType = await ctx.db.get(args.slotTypeId);
        if (!user || !slotType) throw new Error("User or Slot Type not found");

        // Check for duplicate assignment
        const groups = await ctx.db.query("groups")
            .withIndex("by_catalog", q => q.eq("subscription_catalog_id", slotType.subscription_id as Id<"subscription_catalog">))
            .filter(q => q.eq(q.field("status"), "active"))
            .collect();

        for (const group of groups) {
            const existingSlot = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .filter(q => q.and(
                    q.eq(q.field("slot_type_id"), args.slotTypeId),
                    q.eq(q.field("user_id"), args.userId),
                    q.eq(q.field("status"), "filled")
                ))
                .first();

            if (existingSlot) {
                throw new Error("User already has an active slot in this subscription");
            }
        }

        // Find available slot
        let targetSlot = null;
        for (const group of groups) {
            const openSlot = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .filter(q => q.and(
                    q.eq(q.field("slot_type_id"), args.slotTypeId),
                    q.eq(q.field("status"), "open")
                ))
                .first();

            if (openSlot) {
                targetSlot = openSlot;
                break;
            }
        }

        if (!targetSlot) {
            throw new Error("No available slots found");
        }

        // Assign slot
        await ctx.db.patch(targetSlot._id, {
            user_id: args.userId,
            status: "filled",
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: false,
        });

        // Log action
        await logAdminAction(
            ctx,
            args.adminId,
            "slot_assignment",
            "subscription_slot",
            targetSlot._id,
            slotType.name,
            `Assigned user ${user.full_name} to ${slotType.name}`,
            args.reason
        );

        return { success: true, slotId: targetSlot._id };
    }
});

export const adminRemoveUserFromSlot = mutation({
    args: {
        adminId: v.id("users"),
        slotId: v.id("subscription_slots"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const slot = await ctx.db.get(args.slotId);
        if (!slot || !slot.user_id) throw new Error("Slot not found or empty");

        const user = await ctx.db.get(slot.user_id);

        // Clear slot
        await ctx.db.patch(args.slotId, {
            user_id: undefined,
            status: "open",
            renewal_date: undefined,
            auto_renew: false,
        });

        // Log action
        await logAdminAction(
            ctx,
            args.adminId,
            "slot_removal",
            "subscription_slot",
            args.slotId,
            slot.slot_type_id ? (await ctx.db.get(slot.slot_type_id))?.name : "Unknown",
            `Removed user ${user?.full_name} from slot`,
            args.reason
        );

        return { success: true };
    }
});

// ─── PAYMENT OVERRIDE SYSTEM ──────────────────────────────────────────────────

export const adminOverridePayment = mutation({
    args: {
        adminId: v.id("users"),
        slotId: v.id("subscription_slots"),
        newStatus: v.string(),
        overrideAmount: v.optional(v.number()),
        reason: v.string(),
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const slot = await ctx.db.get(args.slotId);
        if (!slot || !slot.user_id) throw new Error("Slot not found");

        const user = await ctx.db.get(slot.user_id);
        const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
        const originalAmount = slotType?.price || 0;

        // Record override
        await ctx.db.insert("payment_overrides", {
            slot_id: args.slotId,
            user_id: slot.user_id,
            original_status: slot.status,
            new_status: args.newStatus,
            original_amount: originalAmount,
            override_amount: args.overrideAmount,
            admin_id: args.adminId,
            admin_note: args.adminNote,
            reason: args.reason,
            created_at: Date.now(),
        });

        // Update slot status
        await ctx.db.patch(args.slotId, {
            status: args.newStatus,
        });

        // Log action
        await logAdminAction(
            ctx,
            args.adminId,
            "payment_override",
            "payment",
            args.slotId,
            user.full_name,
            `Changed payment status from ${slot.status} to ${args.newStatus}`,
            args.reason,
            { originalAmount, overrideAmount: args.overrideAmount }
        );

        return { success: true };
    }
});

export const adminBulkUpdatePaymentStatus = mutation({
    args: {
        adminId: v.id("users"),
        slotIds: v.array(v.id("subscription_slots")),
        newStatus: v.string(),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const bulkOpId = await ctx.db.insert("bulk_operations", {
            admin_id: args.adminId,
            operation_type: "bulk_payment_update",
            status: "processing",
            total_items: args.slotIds.length,
            processed_items: 0,
            failed_items: 0,
            created_at: Date.now(),
        });

        const results: any[] = [];
        let processed = 0;
        let failed = 0;

        for (const slotId of args.slotIds) {
            try {
                const slot = await ctx.db.get(slotId);
                if (slot && slot.user_id) {
                    await ctx.db.patch(slotId, { status: args.newStatus });

                    await ctx.db.insert("payment_overrides", {
                        slot_id: slotId,
                        user_id: slot.user_id,
                        original_status: slot.status,
                        new_status: args.newStatus,
                        admin_id: args.adminId,
                        reason: args.reason,
                        created_at: Date.now(),
                    });

                    results.push({ slotId, success: true });
                } else {
                    results.push({ slotId, success: false, error: "Slot not found or empty" });
                    failed++;
                }
            } catch (e: any) {
                results.push({ slotId, success: false, error: e.message });
                failed++;
            }
            processed++;
        }

        await ctx.db.patch(bulkOpId, {
            processed_items: processed,
            failed_items: failed,
            status: "completed",
            completed_at: Date.now(),
            results,
        });

        await logAdminAction(
            ctx,
            args.adminId,
            "bulk_payment_update",
            "bulk_operation",
            bulkOpId,
            "Bulk Payment Update",
            `Updated ${processed} slots to ${args.newStatus}`,
            args.reason
        );

        return { success: true, bulkOpId, results };
    }
});

// ─── GROUP MANAGEMENT ─────────────────────────────────────────────────────────

export const adminMoveUserToGroup = mutation({
    args: {
        adminId: v.id("users"),
        userId: v.id("users"),
        toGroupId: v.union(v.id("groups"), v.id("marketplace")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        let resolvedToGroupId: Id<"groups"> | undefined;
        let toGroup = null;

        const targetRecord = await ctx.db.get(args.toGroupId as any);
        if (targetRecord && !("total_slots" in targetRecord)) {
            resolvedToGroupId = targetRecord._id as Id<"groups">;
            toGroup = targetRecord;
        } else if (targetRecord && "total_slots" in targetRecord) {
            const marketplaceListing: any = targetRecord;
            if (marketplaceListing) {
                const matchingGroup = await ctx.db.query("groups")
                    .withIndex("by_catalog", q => q.eq("subscription_catalog_id", marketplaceListing.subscription_catalog_id))
                    .filter(q => q.and(
                        q.eq(q.field("account_email"), marketplaceListing.account_email),
                        q.eq(q.field("billing_cycle_start"), marketplaceListing.billing_cycle_start),
                        q.eq(q.field("plan_owner"), marketplaceListing.plan_owner)
                    ))
                    .first();

                if (matchingGroup) {
                    resolvedToGroupId = matchingGroup._id;
                    toGroup = matchingGroup;
                }
            }
        }

        if (!user || !toGroup) throw new Error("User or target group not found");

        // Find user's current slot
        const currentSlots = await ctx.db.query("subscription_slots")
            .withIndex("by_user", q => q.eq("user_id", args.userId))
            .filter(q => q.eq(q.field("status"), "filled"))
            .collect();

        let fromGroupId: Id<"groups"> | undefined;

        if (currentSlots.length > 0) {
            fromGroupId = currentSlots[0].group_id;

            // Clear old slot
            await ctx.db.patch(currentSlots[0]._id, {
                user_id: undefined,
                status: "open",
                renewal_date: undefined,
            });
        }

        // Find available slot in target group
        const targetSlotType = currentSlots[0]?.slot_type_id;
        const targetSlot = await ctx.db.query("subscription_slots")
            .withIndex("by_group", q => q.eq("group_id", resolvedToGroupId!))
            .filter(q => q.and(
                q.eq(q.field("slot_type_id"), targetSlotType!),
                q.eq(q.field("status"), "open")
            ))
            .first();

        if (!targetSlot) {
            throw new Error("No available slot in target group");
        }

        // Assign to new group
        await ctx.db.patch(targetSlot._id, {
            user_id: args.userId,
            status: "filled",
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Log group change
        await ctx.db.insert("group_changes", {
            group_id: resolvedToGroupId!,
            user_id: args.userId,
            action: "user_moved",
            from_group_id: fromGroupId,
            to_group_id: resolvedToGroupId!,
            admin_id: args.adminId,
            reason: args.reason,
            created_at: Date.now(),
        });

        await logAdminAction(
            ctx,
            args.adminId,
            "group_transfer",
            "group",
            resolvedToGroupId!,
            user.full_name,
            `Moved user from ${fromGroupId || "none"} to ${toGroup.account_email || resolvedToGroupId!}`,
            args.reason
        );

        return { success: true };
    }
});

export const adminAutoBalanceGroups = mutation({
    args: {
        adminId: v.id("users"),
        subscriptionCatalogId: v.id("subscription_catalog"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const groups = await ctx.db.query("groups")
            .withIndex("by_catalog", q => q.eq("subscription_catalog_id", args.subscriptionCatalogId))
            .filter(q => q.eq(q.field("status"), "active"))
            .collect();

        if (groups.length === 0) throw new Error("No active groups found");

        // Count members in each group
        const groupCounts = await Promise.all(
            groups.map(async (g) => {
                const slots = await ctx.db.query("subscription_slots")
                    .withIndex("by_group", q => q.eq("group_id", g._id))
                    .filter(q => q.eq(q.field("status"), "filled"))
                    .collect();
                return { groupId: g._id, count: slots.length };
            })
        );

        const totalMembers = groupCounts.reduce((sum, g) => sum + g.count, 0);
        const avgPerGroup = Math.floor(totalMembers / groups.length);

        // Simple balancing: move members from overfilled to underfilled groups
        const moves: any[] = [];

        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const current = groupCounts.find(g => g.groupId === group._id)!;

            if (current.count > avgPerGroup + 1) {
                // This group is overfilled, find underfilled group
                for (let j = 0; j < groups.length; j++) {
                    if (i === j) continue;
                    const targetGroup = groups[j];
                    const targetCurrent = groupCounts.find(g => g.groupId === targetGroup._id)!;

                    if (targetCurrent.count < avgPerGroup) {
                        // Move one member
                        const slots = await ctx.db.query("subscription_slots")
                            .withIndex("by_group", q => q.eq("group_id", group._id))
                            .filter(q => q.eq(q.field("status"), "filled"))
                            .take(1);

                        if (slots.length > 0) {
                            moves.push({
                                userId: slots[0].user_id,
                                fromGroupId: group._id,
                                toGroupId: targetGroup._id,
                            });
                        }
                        break;
                    }
                }
            }
        }

        await logAdminAction(
            ctx,
            args.adminId,
            "auto_balance_groups",
            "subscription_catalog",
            args.subscriptionCatalogId,
            "Auto Balance",
            `Balanced ${groups.length} groups, ${moves.length} moves planned`,
            "Automated group balancing"
        );

        return { success: true, moves, groupCounts };
    }
});

// ─── WAITLIST SYSTEM ──────────────────────────────────────────────────────────

export const addToWaitlist = mutation({
    args: {
        adminId: v.id("users"),
        userId: v.id("users"),
        subscriptionCatalogId: v.id("subscription_catalog"),
        slotTypeId: v.optional(v.id("slot_types")),
        priority: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Check if already on waitlist
        const existing = await ctx.db.query("slot_waitlist")
            .withIndex("by_user", q => q.eq("user_id", args.userId))
            .filter(q => q.and(
                q.eq(q.field("subscription_catalog_id"), args.subscriptionCatalogId),
                q.eq(q.field("status"), "waiting")
            ))
            .first();

        if (existing) {
            throw new Error("User already on waitlist for this subscription");
        }

        const waitlistId = await ctx.db.insert("slot_waitlist", {
            user_id: args.userId,
            subscription_catalog_id: args.subscriptionCatalogId,
            slot_type_id: args.slotTypeId,
            status: "waiting",
            priority: args.priority || 0,
            notes: args.notes,
            added_by: args.adminId,
            added_at: Date.now(),
        });

        await logAdminAction(
            ctx,
            args.adminId,
            "waitlist_add",
            "waitlist",
            waitlistId,
            user.full_name,
            `Added to waitlist for subscription`,
            args.notes
        );

        return { success: true, waitlistId };
    }
});

export const fillWaitlistSlot = mutation({
    args: {
        adminId: v.id("users"),
        slotId: v.id("subscription_slots"),
        waitlistId: v.id("slot_waitlist"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const slot = await ctx.db.get(args.slotId);
        const waitlist = await ctx.db.get(args.waitlistId);
        if (!slot || !waitlist) throw new Error("Slot or waitlist entry not found");

        const user = await ctx.db.get(waitlist.user_id);

        // Assign slot to waitlist user
        await ctx.db.patch(args.slotId, {
            user_id: waitlist.user_id,
            status: "filled",
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Update waitlist entry
        await ctx.db.patch(args.waitlistId, {
            status: "filled",
            filled_at: Date.now(),
            filled_slot_id: args.slotId,
        });

        await logAdminAction(
            ctx,
            args.adminId,
            "waitlist_fill",
            "waitlist",
            args.waitlistId,
            user?.full_name || "Unknown",
            `Filled slot from waitlist`
        );

        return { success: true };
    }
});

export const getWaitlist = query({
    args: {
        subscriptionCatalogId: v.optional(v.id("subscription_catalog")),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let waitlist = await ctx.db.query("slot_waitlist").collect();

        if (args.subscriptionCatalogId) {
            waitlist = waitlist.filter(w => w.subscription_catalog_id === args.subscriptionCatalogId);
        }

        if (args.status) {
            waitlist = waitlist.filter(w => w.status === args.status);
        }

        // Sort by priority (desc) then by added_at (asc)
        waitlist.sort((a, b) => {
            if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
            return b.added_at - a.added_at;
        });

        return await Promise.all(waitlist.map(async (w) => {
            const user = await ctx.db.get(w.user_id);
            const addedBy = w.added_by ? await ctx.db.get(w.added_by) : null;
            return {
                ...w,
                user_name: user?.full_name,
                user_email: user?.email,
                added_by_name: addedBy?.full_name,
            };
        }));
    }
});

// ─── ADMIN DASHBOARD METRICS ──────────────────────────────────────────────────

export const getAdminDashboardMetrics = query({
    handler: async (ctx) => {
        const now = Date.now();
        const todayMs = new Date().setHours(0, 0, 0, 0);

        const [slots, groups, users, waitlist, paymentOverrides, adminLogs] = await Promise.all([
            ctx.db.query("subscription_slots").collect(),
            ctx.db.query("groups").collect(),
            ctx.db.query("users").collect(),
            ctx.db.query("slot_waitlist").collect(),
            ctx.db.query("payment_overrides").collect(),
            ctx.db.query("admin_logs").order("desc").take(100),
        ]);

        const activeSlots = slots.filter(s => s.status === "filled");
        const openSlots = slots.filter(s => s.status === "open");
        const closingSlots = slots.filter(s => s.status === "closing");

        const waitingUsers = waitlist.filter(w => w.status === "waiting");

        const recentOverrides = paymentOverrides.filter(po => po.created_at >= todayMs);

        // Subscription health
        const healthScore = activeSlots.length / (activeSlots.length + openSlots.length) * 100;

        return {
            totalSlots: slots.length,
            activeSlots: activeSlots.length,
            openSlots: openSlots.length,
            closingSlots: closingSlots.length,
            totalGroups: groups.length,
            totalUsers: users.length,
            waitingUsers: waitingUsers.length,
            paymentOverridesToday: recentOverrides.length,
            healthScore: isNaN(healthScore) ? 100 : Math.round(healthScore),
            recentAdminLogs: await Promise.all(adminLogs.map(async (log) => {
                const admin = await ctx.db.get(log.admin_id);
                return { ...log, admin_name: admin?.full_name };
            })),
        };
    }
});

// ─── ACTIVITY LOGS QUERY ──────────────────────────────────────────────────────

export const getAdminLogs = query({
    args: {
        adminId: v.optional(v.id("users")),
        actionType: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let logs = await ctx.db.query("admin_logs").order("desc").collect();

        if (args.adminId) {
            logs = logs.filter(l => l.admin_id === args.adminId);
        }

        if (args.actionType) {
            logs = logs.filter(l => l.action_type === args.actionType);
        }

        if (args.limit) {
            logs = logs.slice(0, args.limit);
        }

        return await Promise.all(logs.map(async (log) => {
            const admin = await ctx.db.get(log.admin_id);
            return {
                ...log,
                admin_name: admin?.full_name,
                admin_email: admin?.email,
                admin_role: admin?.admin_role,
            };
        }));
    }
});

// ─── NOTIFICATION SYSTEM ──────────────────────────────────────────────────────

export const adminSendBulkNotification = mutation({
    args: {
        adminId: v.id("users"),
        userIds: v.array(v.id("users")),
        title: v.string(),
        message: v.string(),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        let sent = 0;
        for (const userId of args.userIds) {
            const user = await ctx.db.get(userId);
            if (user && !user.is_suspended) {
                await ctx.db.insert("notifications", {
                    user_id: userId,
                    title: args.title,
                    message: args.message,
                    type: args.type,
                    is_read: false,
                    created_at: Date.now(),
                });
                sent++;
            }
        }

        await logAdminAction(
            ctx,
            args.adminId,
            "bulk_notification",
            "notification",
            undefined,
            "Bulk Notification",
            `Sent notification to ${sent} users`,
            args.title
        );

        return { success: true, sent };
    }
});

export const adminSendSlotNotification = mutation({
    args: {
        adminId: v.id("users"),
        slotId: v.id("subscription_slots"),
        title: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.adminId);
        if (!admin?.is_admin) throw new Error("Unauthorized");

        const slot = await ctx.db.get(args.slotId);
        if (!slot || !slot.user_id) throw new Error("Slot not found or empty");

        await ctx.db.insert("notifications", {
            user_id: slot.user_id,
            title: args.title,
            message: args.message,
            type: "slot_update",
            is_read: false,
            created_at: Date.now(),
        });

        await logAdminAction(
            ctx,
            args.adminId,
            "slot_notification",
            "subscription_slot",
            args.slotId,
            "Slot Notification",
            `Sent notification for slot`
        );

        return { success: true };
    }
});
