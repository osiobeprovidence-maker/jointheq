import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── MIGRATION FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Migrate data from groups table to new marketplace table
 * Run this once to move existing marketplace data
 */
export const migrateGroupsToMarketplace = mutation({
    args: {
        dryRun: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const groups = await ctx.db.query("groups").collect();
        const migrated: any[] = [];
        const skipped: any[] = [];

        for (const group of groups) {
            // Get subscription catalog info
            const catalog = group.subscription_catalog_id 
                ? await ctx.db.get(group.subscription_catalog_id) 
                : null;

            if (!catalog) {
                skipped.push({ groupId: group._id, reason: "No catalog found" });
                continue;
            }

            // Get all slots for this group to calculate capacity
            const slots = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .collect();

            const filledSlots = slots.filter(s => s.status === "filled").length;
            const availableSlots = slots.filter(s => s.status === "open").length;

            // Get slot types to find pricing
            const slotTypes = await ctx.db.query("slot_types")
                .withIndex("by_subscription", q => q.eq("subscription_id", group.subscription_catalog_id))
                .collect();

            const slotPrice = slotTypes[0]?.price ?? 0;

            // Find original subscription to get owner info
            const subscription = await ctx.db.query("subscriptions")
                .filter(q => q.eq(q.field("group_id"), group._id))
                .first();

            const isOwnerListed = group.plan_owner === "owner_listed" || group.plan_owner === "owner";
            
            if (!args.dryRun) {
                const marketplaceId = await ctx.db.insert("marketplace", {
                    subscription_catalog_id: group.subscription_catalog_id,
                    owner_user_id: subscription?.owner_id,
                    admin_creator_id: isOwnerListed ? undefined : (await ctx.db.query("users").filter(q => q.eq(q.field("is_admin"), true)).first())?._id,
                    
                    platform_name: catalog.name,
                    account_email: group.account_email || "",
                    plan_owner: group.plan_owner || "admin",
                    billing_cycle_start: group.billing_cycle_start || "",
                    status: group.status || "active",
                    
                    total_slots: slots.length,
                    filled_slots: filledSlots,
                    available_slots: availableSlots,
                    
                    slot_price: slotPrice,
                    owner_payout: subscription?.owner_payout_amount,
                    
                    category: catalog.category,
                    admin_note: subscription?.admin_note,
                    request_id: group.request_id,
                    
                    created_at: group._creationTime || Date.now(),
                    updated_at: Date.now(),
                });

                migrated.push({
                    groupId: group._id,
                    marketplaceId,
                    platform: catalog.name,
                });
            } else {
                migrated.push({
                    groupId: group._id,
                    platform: catalog.name,
                    wouldMigrate: true,
                });
            }
        }

        return {
            migrated,
            skipped,
            total: groups.length,
            dryRun: args.dryRun ?? false,
        };
    },
});

/**
 * Rollback migration - delete marketplace records created from groups
 */
export const rollbackMarketplaceMigration = mutation({
    handler: async (ctx) => {
        const marketplace = await ctx.db.query("marketplace").collect();
        let deleted = 0;

        for (const item of marketplace) {
            await ctx.db.delete(item._id);
            deleted++;
        }

        return { deleted, message: `Deleted ${deleted} marketplace records` };
    },
});

// ─── MARKETPLACE QUERIES ──────────────────────────────────────────────────────

/**
 * Get all marketplace listings for public browsing
 * Excludes owner-listed items (those are managed separately)
 */
export const getPublicMarketplace = query({
    handler: async (ctx) => {
        const listings = await ctx.db.query("marketplace")
            .withIndex("by_status", q => q.eq("status", "active"))
            .filter(q => q.neq(q.field("plan_owner"), "owner_listed"))
            .collect();

        const visibleListings = await Promise.all(listings.map(async (listing) => {
            const groups = await ctx.db.query("groups")
                .withIndex("by_catalog", q => q.eq("subscription_catalog_id", listing.subscription_catalog_id))
                .filter(q => q.and(
                    q.eq(q.field("account_email"), listing.account_email),
                    q.eq(q.field("billing_cycle_start"), listing.billing_cycle_start),
                    q.eq(q.field("plan_owner"), listing.plan_owner)
                ))
                .collect();

            let openSlots = 0;
            let filledSlots = 0;

            for (const group of groups) {
                const slots = await ctx.db.query("subscription_slots")
                    .withIndex("by_group", q => q.eq("group_id", group._id))
                    .collect();

                openSlots += slots.filter((slot) => slot.status === "open").length;
                filledSlots += slots.filter((slot) => slot.status === "filled").length;
            }

            if (openSlots <= 0) {
                return null;
            }

            const catalog = await ctx.db.get(listing.subscription_catalog_id);
            const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;

            return {
                ...listing,
                filled_slots: filledSlots,
                available_slots: openSlots,
                platform_logo: catalog?.logo_url,
                platform_category: catalog?.category,
                owner_name: owner?.full_name,
                owner_username: owner?.username,
            };
        }));

        return visibleListings.filter((listing): listing is NonNullable<typeof listing> => !!listing);
    },
});

/**
 * Get marketplace data for admin panel with full details
 */
export const getAdminMarketplace = query({
    handler: async (ctx) => {
        const listings = await ctx.db.query("marketplace").collect();

        return await Promise.all(listings.map(async (listing) => {
            const catalog = await ctx.db.get(listing.subscription_catalog_id);
            const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;
            const admin = listing.admin_creator_id ? await ctx.db.get(listing.admin_creator_id) : null;

            // Get slots for this marketplace listing
            // Note: slots still reference groups, so we need to map group_id to marketplace
            // For now, we'll get all slots and filter (this should be optimized with a marketplace_id in slots)
            const allSlots = await ctx.db.query("subscription_slots").collect();
            
            // Get slot types
            const slotTypes = await ctx.db.query("slot_types")
                .withIndex("by_subscription", q => q.eq("subscription_id", listing.subscription_catalog_id))
                .collect();

            return {
                ...listing,
                platform_logo: catalog?.logo_url,
                platform_description: catalog?.description,
                owner_name: owner?.full_name,
                owner_email: owner?.email,
                admin_name: admin?.full_name,
                slot_types: slotTypes,
            };
        }));
    },
});

/**
 * Get marketplace listings by status filter
 */
export const getMarketplaceByStatus = query({
    args: { status: v.string() },
    handler: async (ctx, args) => {
        const listings = await ctx.db.query("marketplace")
            .withIndex("by_status", q => q.eq("status", args.status))
            .collect();

        return await Promise.all(listings.map(async (listing) => {
            const catalog = await ctx.db.get(listing.subscription_catalog_id);
            return {
                ...listing,
                platform_name: catalog?.name ?? "Unknown",
                platform_category: catalog?.category,
            };
        }));
    },
});

/**
 * Get user's marketplace listings (as owner)
 */
export const getUserMarketplaceListings = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const listings = await ctx.db.query("marketplace")
            .withIndex("by_owner", q => q.eq("owner_user_id", args.user_id))
            .collect();

        return await Promise.all(listings.map(async (listing) => {
            const catalog = await ctx.db.get(listing.subscription_catalog_id);
            return {
                ...listing,
                platform_name: catalog?.name ?? "Unknown",
                platform_logo: catalog?.logo_url,
            };
        }));
    },
});

/**
 * Get single marketplace listing by ID
 */
export const getMarketplaceListing = query({
    args: { marketplace_id: v.id("marketplace") },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.marketplace_id);
        if (!listing) return null;

        const catalog = await ctx.db.get(listing.subscription_catalog_id);
        const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;

        return {
            ...listing,
            platform_logo: catalog?.logo_url,
            platform_description: catalog?.description,
            platform_category: catalog?.category,
            owner_name: owner?.full_name,
        };
    },
});

// ─── MARKETPLACE MUTATIONS ────────────────────────────────────────────────────

/**
 * Create a new marketplace listing (admin only)
 */
export const createMarketplaceListing = mutation({
    args: {
        admin_id: v.id("users"),
        subscription_catalog_id: v.id("subscription_catalog"),
        account_email: v.string(),
        plan_owner: v.string(),
        billing_cycle_start: v.string(),
        slot_price: v.number(),
        total_slots: v.number(),
        owner_payout: v.optional(v.number()),
        category: v.optional(v.string()),
        request_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Verify admin
        const admin = await ctx.db.get(args.admin_id);
        if (!admin?.is_admin) {
            throw new Error("Unauthorized: Admin access required");
        }

        // Check for duplicate request_id (idempotency)
        if (args.request_id) {
            const existing = await ctx.db.query("marketplace")
                .withIndex("by_request_id", q => q.eq("request_id", args.request_id))
                .first();
            
            if (existing) {
                return { success: true, marketplace_id: existing._id, created: false };
            }
        }

        // Check for duplicate by account email + billing cycle
        const duplicate = await ctx.db.query("marketplace")
            .filter(q => q.and(
                q.eq(q.field("subscription_catalog_id"), args.subscription_catalog_id),
                q.eq(q.field("account_email"), args.account_email),
                q.eq(q.field("billing_cycle_start"), args.billing_cycle_start)
            ))
            .first();

        if (duplicate) {
            return { success: true, marketplace_id: duplicate._id, created: false };
        }

        const catalog = await ctx.db.get(args.subscription_catalog_id);
        if (!catalog) {
            throw new Error("Subscription catalog not found");
        }

        const marketplaceId = await ctx.db.insert("marketplace", {
            subscription_catalog_id: args.subscription_catalog_id,
            admin_creator_id: args.admin_id,
            
            platform_name: catalog.name,
            account_email: args.account_email,
            plan_owner: args.plan_owner,
            billing_cycle_start: args.billing_cycle_start,
            status: "active",
            
            total_slots: args.total_slots,
            filled_slots: 0,
            available_slots: args.total_slots,
            
            slot_price: args.slot_price,
            owner_payout: args.owner_payout,
            
            category: args.category || catalog.category,
            request_id: args.request_id,
            
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return { success: true, marketplace_id: marketplaceId, created: true };
    },
});

/**
 * Update marketplace listing (admin only)
 */
export const updateMarketplaceListing = mutation({
    args: {
        admin_id: v.id("users"),
        marketplace_id: v.id("marketplace"),
        status: v.optional(v.string()),
        slot_price: v.optional(v.number()),
        owner_payout: v.optional(v.number()),
        admin_note: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.admin_id);
        if (!admin?.is_admin) {
            throw new Error("Unauthorized: Admin access required");
        }

        const listing = await ctx.db.get(args.marketplace_id);
        if (!listing) {
            throw new Error("Marketplace listing not found");
        }

        const patchData: any = { updated_at: Date.now() };
        
        if (args.status !== undefined) patchData.status = args.status;
        if (args.slot_price !== undefined) patchData.slot_price = args.slot_price;
        if (args.owner_payout !== undefined) patchData.owner_payout = args.owner_payout;
        if (args.admin_note !== undefined) patchData.admin_note = args.admin_note;

        await ctx.db.patch(args.marketplace_id, patchData);

        return { success: true };
    },
});

/**
 * Delete marketplace listing (admin only)
 */
export const deleteMarketplaceListing = mutation({
    args: {
        admin_id: v.id("users"),
        marketplace_id: v.id("marketplace"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db.get(args.admin_id);
        if (!admin?.is_admin) {
            throw new Error("Unauthorized: Admin access required");
        }

        await ctx.db.delete(args.marketplace_id);
        return { success: true };
    },
});

/**
 * Update slot counts when a user joins/leaves a slot
 */
export const updateMarketplaceSlotCounts = mutation({
    args: {
        marketplace_id: v.id("marketplace"),
        delta: v.number(), // +1 for join, -1 for leave
    },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.marketplace_id);
        if (!listing) {
            throw new Error("Marketplace listing not found");
        }

        const newFilled = Math.max(0, listing.filled_slots + args.delta);
        const newAvailable = Math.max(0, listing.available_slots - args.delta);

        await ctx.db.patch(args.marketplace_id, {
            filled_slots: newFilled,
            available_slots: newAvailable,
            updated_at: Date.now(),
        });

        return { success: true, filled_slots: newFilled, available_slots: newAvailable };
    },
});

// ─── MARKETPLACE STATISTICS ───────────────────────────────────────────────────

/**
 * Get marketplace statistics for dashboard
 */
export const getMarketplaceStats = query({
    handler: async (ctx) => {
        const listings = await ctx.db.query("marketplace").collect();

        const stats = {
            total_listings: listings.length,
            active_listings: listings.filter(l => l.status === "active").length,
            paused_listings: listings.filter(l => l.status === "paused").length,
            closed_listings: listings.filter(l => l.status === "closed").length,
            
            total_slots: listings.reduce((sum, l) => sum + l.total_slots, 0),
            filled_slots: listings.reduce((sum, l) => sum + l.filled_slots, 0),
            available_slots: listings.reduce((sum, l) => sum + l.available_slots, 0),
            
            total_revenue_monthly: listings.reduce((sum, l) => sum + (l.filled_slots * l.slot_price), 0),
            total_owner_payouts: listings.reduce((sum, l) => sum + (l.filled_slots * (l.owner_payout || 0)), 0),
        };

        // Calculate platform breakdown
        const platformMap = new Map<string, number>();
        listings.forEach(l => {
            const count = platformMap.get(l.platform_name) || 0;
            platformMap.set(l.platform_name, count + 1);
        });

        return {
            ...stats,
            platform_breakdown: Object.fromEntries(platformMap),
            occupancy_rate: stats.total_slots > 0 
                ? Math.round((stats.filled_slots / stats.total_slots) * 100) 
                : 0,
        };
    },
});
