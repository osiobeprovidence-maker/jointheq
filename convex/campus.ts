import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS TERRITORIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get all territories with leader + ambassador count */
export const getTerritories = query({
    handler: async (ctx) => {
        const territories = await ctx.db.query("campus_territories").collect();
        return await Promise.all(territories.map(async t => {
            const leader = t.leader_id ? await ctx.db.get(t.leader_id) : null;
            const ambassadors = await ctx.db
                .query("campus_territory_ambassadors")
                .withIndex("by_territory", q => q.eq("territory_id", t._id))
                .collect();
            const events = await ctx.db
                .query("campus_events")
                .withIndex("by_territory", q => q.eq("territory_id", t._id))
                .collect();
            return {
                ...t,
                leader_name: leader?.full_name ?? "No leader",
                leader_email: leader?.email ?? "",
                ambassador_count: ambassadors.length,
                event_count: events.length,
                active_ambassadors: ambassadors.filter(a => a.is_active).length,
            };
        }));
    },
});

/** Get a single territory with full details */
export const getTerritoryById = query({
    args: { id: v.id("campus_territories") },
    handler: async (ctx, { id }) => {
        const territory = await ctx.db.get(id);
        if (!territory) return null;
        const ambassadors = await ctx.db
            .query("campus_territory_ambassadors")
            .withIndex("by_territory", q => q.eq("territory_id", id))
            .collect();
        const enrichedAmbassadors = await Promise.all(ambassadors.map(async a => {
            const user = await ctx.db.get(a.user_id);
            return { ...a, full_name: user?.full_name ?? "Unknown", email: user?.email ?? "" };
        }));
        return { ...territory, ambassadors: enrichedAmbassadors };
    },
});

/** Create a new campus territory */
export const createTerritory = mutation({
    args: {
        campus_name: v.string(),
        city: v.string(),
        country: v.string(),
        leader_id: v.optional(v.id("users")),
        created_by: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("campus_territories", {
            campus_name: args.campus_name,
            city: args.city,
            country: args.country,
            leader_id: args.leader_id,
            total_users: 0,
            total_ambassadors: 0,
            total_subscriptions: 0,
            is_active: true,
            created_at: Date.now(),
        });

        // If a leader is set, add them as ambassador with role "leader"
        if (args.leader_id) {
            await ctx.db.insert("campus_territory_ambassadors", {
                territory_id: id,
                user_id: args.leader_id,
                role: "leader",
                referral_count: 0,
                total_earned: 0,
                is_active: true,
                joined_at: Date.now(),
            });
        }

        return id;
    },
});

/** Update territory details */
export const updateTerritory = mutation({
    args: {
        id: v.id("campus_territories"),
        campus_name: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        leader_id: v.optional(v.id("users")),
        is_active: v.optional(v.boolean()),
        total_users: v.optional(v.number()),
        total_subscriptions: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...updates }) => {
        const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        await ctx.db.patch(id, clean);
    },
});

/** Add an ambassador to a territory */
export const addAmbassador = mutation({
    args: {
        territory_id: v.id("campus_territories"),
        user_id: v.id("users"),
        role: v.string(), // "leader" | "ambassador"
    },
    handler: async (ctx, args) => {
        // Check not already in territory
        const existing = await ctx.db
            .query("campus_territory_ambassadors")
            .withIndex("by_territory", q => q.eq("territory_id", args.territory_id))
            .filter(q => q.eq(q.field("user_id"), args.user_id))
            .first();
        if (existing) throw new Error("User is already in this territory");

        await ctx.db.insert("campus_territory_ambassadors", {
            territory_id: args.territory_id,
            user_id: args.user_id,
            role: args.role,
            referral_count: 0,
            total_earned: 0,
            is_active: true,
            joined_at: Date.now(),
        });

        // If setting as leader, update territory
        if (args.role === "leader") {
            await ctx.db.patch(args.territory_id, { leader_id: args.user_id });
        }

        // Update ambassador count
        const territory = await ctx.db.get(args.territory_id);
        if (territory) {
            await ctx.db.patch(args.territory_id, { total_ambassadors: (territory.total_ambassadors ?? 0) + 1 });
        }
    },
});

/** Remove an ambassador from a territory */
export const removeAmbassador = mutation({
    args: { ambassador_id: v.id("campus_territory_ambassadors") },
    handler: async (ctx, { ambassador_id }) => {
        const amb = await ctx.db.get(ambassador_id);
        if (!amb) throw new Error("Ambassador not found");
        await ctx.db.patch(ambassador_id, { is_active: false });
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS EVENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Get all campus events */
export const getEvents = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, { status }) => {
        const events = status
            ? await ctx.db.query("campus_events").withIndex("by_status", q => q.eq("status", status)).collect()
            : await ctx.db.query("campus_events").collect();

        return await Promise.all(events.map(async ev => {
            const host = ev.host_id ? await ctx.db.get(ev.host_id) : null;
            return { ...ev, host_name: host?.full_name ?? "TBD" };
        }));
    },
});

/** Create a campus event */
export const createEvent = mutation({
    args: {
        name: v.string(),
        territory_id: v.optional(v.id("campus_territories")),
        campus_name: v.string(),
        city: v.string(),
        event_date: v.number(),
        host_id: v.optional(v.id("users")),
        description: v.optional(v.string()),
        type: v.string(),
        expected_participants: v.optional(v.number()),
        created_by: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("campus_events", {
            ...args,
            actual_attendance: 0,
            new_users_acquired: 0,
            subscriptions_created: 0,
            status: "upcoming",
            created_at: Date.now(),
        });
    },
});

/** Update event status or outcomes */
export const updateEvent = mutation({
    args: {
        id: v.id("campus_events"),
        status: v.optional(v.string()),
        actual_attendance: v.optional(v.number()),
        new_users_acquired: v.optional(v.number()),
        subscriptions_created: v.optional(v.number()),
        description: v.optional(v.string()),
        host_id: v.optional(v.id("users")),
    },
    handler: async (ctx, { id, ...updates }) => {
        const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        await ctx.db.patch(id, clean);
    },
});

/** Admin dashboard: campus program overview */
export const getCampusOverview = query({
    handler: async (ctx) => {
        const territories = await ctx.db.query("campus_territories").collect();
        const ambassadors = await ctx.db.query("campus_territory_ambassadors").collect();
        const events = await ctx.db.query("campus_events").collect();

        const activeTerritories = territories.filter(t => t.is_active);
        const upcomingEvents = events.filter(e => e.status === "upcoming");
        const completedEvents = events.filter(e => e.status === "completed");
        const totalUsersAcquired = completedEvents.reduce((s, e) => s + (e.new_users_acquired ?? 0), 0);
        const totalSubscriptions = completedEvents.reduce((s, e) => s + (e.subscriptions_created ?? 0), 0);

        return {
            total_territories: territories.length,
            active_territories: activeTerritories.length,
            total_ambassadors: ambassadors.filter(a => a.is_active).length,
            total_events: events.length,
            upcoming_events: upcomingEvents.length,
            total_users_acquired: totalUsersAcquired,
            total_subscriptions_from_campus: totalSubscriptions,
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Submit a new campus application */
export const submitCampusApplication = mutation({
    args: {
        userId: v.id("users"),
        university: v.string(),
        social_handle: v.optional(v.string()),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user already has a pending application
        const existing = await ctx.db
            .query("campus_applications")
            .withIndex("by_user", q => q.eq("user_id", args.userId))
            .filter(q => q.eq(q.field("status"), "pending"))
            .first();

        if (existing) {
            throw new Error("You already have a pending application.");
        }

        return await ctx.db.insert("campus_applications", {
            user_id: args.userId,
            university: args.university,
            social_handle: args.social_handle,
            reason: args.reason,
            status: "pending",
            created_at: Date.now(),
        });
    },
});

/** Get all campus applications for admin review */
export const getCampusApplications = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, { status }) => {
        let q = ctx.db.query("campus_applications");
        if (status) {
            q = q.withIndex("by_status", q => q.eq("status", status));
        }
        const apps = await q.collect();

        return await Promise.all(apps.map(async app => {
            const user = await ctx.db.get(app.user_id);
            return {
                ...app,
                user_name: user?.full_name ?? "Unknown",
                user_email: user?.email ?? "",
                user_username: user?.username ?? "",
            };
        }));
    },
});

/** Review a campus application */
export const reviewCampusApplication = mutation({
    args: {
        applicationId: v.id("campus_applications"),
        adminId: v.id("users"),
        status: v.string(), // "approved" | "rejected"
    },
    handler: async (ctx, { applicationId, adminId, status }) => {
        const app = await ctx.db.get(applicationId);
        if (!app) throw new Error("Application not found");

        await ctx.db.patch(applicationId, {
            status,
            reviewed_by: adminId,
            updated_at: Date.now(),
        });

        // If approved, optionally do something like notify user or add to a territory
        // For now, just updating the status is enough.
        return applicationId;
    },
});

/** Get the current user's campus application */
export const getMyCampusApplication = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("campus_applications")
            .withIndex("by_user", q => q.eq("user_id", userId))
            .order("desc")
            .first();
    },
});
