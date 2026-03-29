import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SIMPLIFIED LISTING SYSTEM - Clean Architecture
 * 
 * FLOW:
 * 1. User submits (submitListing) → Creates pending subscription record
 * 2. Admin approves (approveListing) → Updates subscription status to "Active"
 * 3. Marketplace table is populated separately (automatic or via admin action)
 * 4. Consumers browse marketplace → see approved listings
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SLOT_RULES: Record<string, number> = {
  "Netflix Premium": 8,
  "Spotify Family": 6,
  "Apple Music": 6,
  "VPN": 5,
  "CapCut": 5,
  "AI Tools": 5,
  "Other": 1
};

/**
 * STEP 1: User submits a listing
 * 
 * This mutation ONLY:
 * - Checks for duplicates (by request_id or by key)
 * - Inserts into subscriptions table with status "Pending Review"
 * - Returns the subscription ID
 * 
 * Does NOT create catalog/groups/slots/marketplace - that's done on approval
 */
export const submitListing = mutation({
  args: {
    owner_id: v.id("users"),
    platform: v.string(),
    email: v.string(),
    password: v.string(),
    renewal_date: v.string(),
    category: v.optional(v.string()),
    request_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ──────────────────────────────────────────────────────────────────────
    // DUPLICATE PREVENTION: First check by request_id (idempotency)
    // ──────────────────────────────────────────────────────────────────────
    if (args.request_id) {
      const existingByRequest = await ctx.db.query("subscriptions")
        .filter(q => q.eq(q.field("request_id"), args.request_id))
        .first();
      if (existingByRequest) {
        console.log(`✓ [submitListing] Resubmission detected - idempotent return ${existingByRequest._id}`);
        return existingByRequest._id;
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // DUPLICATE PREVENTION: Check by content key
    // ──────────────────────────────────────────────────────────────────────
    const existing = await ctx.db.query("subscriptions")
      .filter(q => q.and(
        q.eq(q.field("owner_id"), args.owner_id),
        q.eq(q.field("platform"), args.platform),
        q.eq(q.field("login_email"), args.email),
        q.eq(q.field("renewal_date"), args.renewal_date),
      ))
      .first();

    if (existing) {
      console.log(`✓ [submitListing] Duplicate by content key - returning ${existing._id}`);
      return existing._id;
    }

    // ──────────────────────────────────────────────────────────────────────
    // CREATE: Insert subscription record (NOTHING ELSE)
    // ──────────────────────────────────────────────────────────────────────
    const total_slots = SLOT_RULES[args.platform] || 1;

    const subscriptionId = await ctx.db.insert("subscriptions", {
      owner_id: args.owner_id,
      platform: args.platform,
      login_email: args.email,
      login_password: args.password,
      renewal_date: args.renewal_date,
      category: args.category || "Streaming",
      status: "Pending Review",
      total_slots,
      slot_price: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      request_id: args.request_id || null,
    });

    console.log(`✓ [submitListing] Created subscription ${subscriptionId} for ${args.platform}`);
    return subscriptionId;
  },
});

/**
 * ADMIN VIEW: Get listings to approve
 * 
 * Shows only subscriptions table (user-submitted listings pending review)
 * Does NOT mix with marketplace table
 */
export const getAdminListings = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("subscriptions");

    // Filter by status if provided
    if (args.status && args.status !== "All") {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status!));
    }

    const results = await query.order("desc").collect();

    // Filter to only show user-submitted listings (those with login_password set)
    const userListings = results.filter(s => 
      s.login_password && 
      s.login_password !== "ADMIN_MANAGED" &&
      s.owner_id // Must have an owner
    );

    // Enrich with owner name in parallel
    return await Promise.all(userListings.map(async (s) => {
      const owner = await ctx.db.get(s.owner_id!);
      return {
        ...s,
        owner_name: owner?.full_name ?? "Unknown Owner",
        owner_email: owner?.email ?? "unknown@example.com",
        email: s.login_email, // For easy access
      };
    }));
  },
});


/**
 * STEP 2: Admin approves a listing
 * 
 * This mutation ONLY:
 * - Verifies listing exists
 * - Updates status from "Pending Review" to "Active"
 * - Sets approval details (pricing, payout, notes)
 * - Updates timestamp
 * 
 * Does NOT create catalog/groups/slots/marketplace - see createMarketplaceEntry()
 * 
 * This is simple, fast, and idempotent (safe to call multiple times)
 */
export const approveListing = mutation({
  args: {
    listing_id: v.id("subscriptions"),
    admin_id: v.id("users"),
    total_slots: v.number(),
    price_per_slot: v.number(),
    owner_payout: v.number(),
    category: v.optional(v.string()),
    admin_note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ──────────────────────────────────────────────────────────────────────
    // VERIFY: Check listing exists
    // ──────────────────────────────────────────────────────────────────────
    const listing = await ctx.db.get(args.listing_id);
    if (!listing) {
      throw new Error("❌ Listing not found");
    }

    if (listing.status === "Active") {
      console.log(`✓ [approveListing] Already approved - idempotent return`);
      // Idempotent: if already active, just return success
      return { 
        success: true, 
        message: "Listing already approved",
        listing_id: args.listing_id 
      };
    }

    // ──────────────────────────────────────────────────────────────────────
    // UPDATE: Set approval details on subscription record ONLY
    // ──────────────────────────────────────────────────────────────────────
    await ctx.db.patch(args.listing_id, {
      status: "Active",
      total_slots: args.total_slots,
      slot_price: args.price_per_slot,
      owner_payout_amount: args.owner_payout,
      category: args.category || listing.category || "Streaming",
      admin_note: args.admin_note,
      updated_at: Date.now(),
      // NO group_id, NO platform_catalog_id - those are for marketplace only
    });

    console.log(`✓ [approveListing] Approved subscription ${args.listing_id} for ${listing.platform}`);
    return { 
      success: true, 
      message: "Listing approved successfully",
      listing_id: args.listing_id 
    };
  },
});

/**
 * OPTIONAL: Create marketplace entry for an approved listing
 * 
 * Call this AFTER approveListing to make the listing visible to consumers
 * Separate from approval process to keep concerns clean
 */
export const createMarketplaceEntry = mutation({
  args: {
    listing_id: v.id("subscriptions"),
    admin_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ──────────────────────────────────────────────────────────────────────
    // VERIFY: Check listing is approved
    // ──────────────────────────────────────────────────────────────────────
    const listing = await ctx.db.get(args.listing_id);
    if (!listing) throw new Error("Listing not found");
    if (listing.status !== "Active") {
      throw new Error(`Cannot publish - listing status is "${listing.status}", only "Active" listings can be published`);
    }

    // ──────────────────────────────────────────────────────────────────────
    // FIND OR CREATE: Subscription Catalog
    // ──────────────────────────────────────────────────────────────────────
    let catalog = await ctx.db.query("subscription_catalog")
      .filter(q => q.eq(q.field("name"), listing.platform!))
      .first();

    if (!catalog) {
      const catalogId = await ctx.db.insert("subscription_catalog", {
        name: listing.platform!,
        category: listing.category || "Streaming",
        description: `Owner-listed: ${listing.platform}`,
        logo_url: undefined,
        base_cost: listing.owner_payout_amount || 0,
        is_active: true,
      });
      catalog = await ctx.db.get(catalogId);
      console.log(`✓ Created catalog ${catalogId}`);
    }

    // ──────────────────────────────────────────────────────────────────────
    // CHECK: Don't create duplicate marketplace entry
    // ──────────────────────────────────────────────────────────────────────
    const existing = await ctx.db.query("marketplace")
      .filter(q => q.and(
        q.eq(q.field("subscription_catalog_id"), catalog!._id),
        q.eq(q.field("account_email"), listing.login_email || ""),
        q.eq(q.field("billing_cycle_start"), listing.renewal_date || ""),
      ))
      .first();

    if (existing) {
      console.log(`✓ Marketplace entry already exists: ${existing._id}`);
      return { success: true, message: "Already published", marketplace_id: existing._id };
    }

    // ──────────────────────────────────────────────────────────────────────
    // CREATE: Marketplace entry
    // ──────────────────────────────────────────────────────────────────────
    const marketplaceId = await ctx.db.insert("marketplace", {
      subscription_catalog_id: catalog!._id,
      owner_user_id: listing.owner_id,
      admin_creator_id: args.admin_id,

      platform_name: listing.platform!,
      account_email: listing.login_email || "",
      plan_owner: "owner_listed",
      billing_cycle_start: listing.renewal_date || "",
      status: "active",

      total_slots: listing.total_slots || 1,
      filled_slots: 0,
      available_slots: listing.total_slots || 1,

      slot_price: listing.slot_price || 0,
      owner_payout: listing.owner_payout_amount || 0,

      category: listing.category,
      admin_note: undefined,

      created_at: Date.now(),
      updated_at: Date.now(),
    });

    console.log(`✓ Created marketplace entry ${marketplaceId}`);
    return { 
      success: true, 
      message: "Listing published to marketplace",
      marketplace_id: marketplaceId 
    };
  },
});

/**
 * STEP 3: Reject a listing
 */
export const rejectListing = mutation({
  args: {
    listing_id: v.id("subscriptions"),
    admin_note: v.optional(v.string()),
    admin_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listing_id);
    if (!listing) throw new Error("Listing not found");

    await ctx.db.patch(args.listing_id, {
      status: "Rejected",
      admin_note: args.admin_note,
      updated_at: Date.now(),
    });

    console.log(`✓ [rejectListing] Rejected ${args.listing_id}`);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUERIES - For Reading Data (Frontend & Admin)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get owner's submitted listings (pending, active, rejected)
 * Allows owners to track their submissions
 */
export const getOwnerListings = query({
  args: { owner_id: v.id("users") },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_id", args.owner_id))
      .order("desc")
      .collect();

    return subscriptions.map(s => ({
      ...s,
      _id: s._id,
      status: s.status || "Pending Review",
    }));
  },
});

/**
 * CONSUMER MARKETPLACE: Get all active listings for browsing
 * 
 * This is what consumers see when they browse the marketplace
 * Pulls from marketplace table (only active, approved listings)
 * Already enriched with catalog info
 */
export const getMarketplaceListings = query({
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("marketplace")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Enrich with catalog and owner info
    return await Promise.all(listings.map(async (listing) => {
      const catalog = await ctx.db.get(listing.subscription_catalog_id);
      const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;

      return {
        ...listing,
        platform_name: listing.platform_name,
        platform_logo: catalog?.logo_url,
        platform_category: catalog?.category || "Streaming",
        owner_name: owner?.full_name,
        owner_q_score: owner?.q_score || 0,
        available_for_join: listing.available_slots > 0,
      };
    }));
  },
});

/**
 * Get single marketplace listing detail
 */
export const getMarketplaceListingDetail = query({
  args: { marketplace_id: v.id("marketplace") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.marketplace_id);
    if (!listing) return null;

    if (listing.status !== "active") {
      return null; // Only show active listings
    }

    const catalog = await ctx.db.get(listing.subscription_catalog_id);
    const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;

    return {
      ...listing,
      platform_logo: catalog?.logo_url,
      platform_description: catalog?.description,
      owner_name: owner?.full_name,
      owner_q_score: owner?.q_score || 0,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN OPERATIONS - Clear & Delete
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ADMIN ONLY: Permanently delete all subscription listings (pending/active/rejected)
 * ⚠️ WARNING: This cannot be undone!
 */
export const clearAllSubscriptions = mutation({
  args: { admin_id: v.id("users") },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db.get(args.admin_id);
    if (!admin?.is_admin) {
      throw new Error("❌ Unauthorized - admin only");
    }

    // Get all subscriptions
    const subscriptions = await ctx.db.query("subscriptions").collect();
    
    // Delete each one
    let deleted = 0;
    for (const sub of subscriptions) {
      await ctx.db.delete(sub._id);
      deleted++;
    }

    console.log(`✓ [clearAllSubscriptions] Deleted ${deleted} subscriptions`);
    return { 
      success: true, 
      message: `Permanently deleted ${deleted} subscriptions`, 
      count: deleted 
    };
  },
});

/**
 * ADMIN ONLY: Permanently delete all marketplace listings
 * ⚠️ WARNING: This cannot be undone!
 */
export const clearAllMarketplace = mutation({
  args: { admin_id: v.id("users") },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db.get(args.admin_id);
    if (!admin?.is_admin) {
      throw new Error("❌ Unauthorized - admin only");
    }

    // Get all marketplace listings
    const listings = await ctx.db.query("marketplace").collect();
    
    // Delete each one
    let deleted = 0;
    for (const listing of listings) {
      await ctx.db.delete(listing._id);
      deleted++;
    }

    console.log(`✓ [clearAllMarketplace] Deleted ${deleted} marketplace listings`);
    return { 
      success: true, 
      message: `Permanently deleted ${deleted} marketplace listings`, 
      count: deleted 
    };
  },
});

/**
 * ADMIN ONLY: Permanently delete ALL listings (both subscriptions and marketplace)
 * ⚠️ WARNING: This is a full nuclear option - cannot be undone!
 */
export const clearAllListings = mutation({
  args: { admin_id: v.id("users") },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db.get(args.admin_id);
    if (!admin?.is_admin) {
      throw new Error("❌ Unauthorized - admin only");
    }

    // Delete all subscriptions
    const subscriptions = await ctx.db.query("subscriptions").collect();
    let subCount = 0;
    for (const sub of subscriptions) {
      await ctx.db.delete(sub._id);
      subCount++;
    }

    // Delete all marketplace listings
    const marketplaceListings = await ctx.db.query("marketplace").collect();
    let marketCount = 0;
    for (const listing of marketplaceListings) {
      await ctx.db.delete(listing._id);
      marketCount++;
    }

    console.log(`✓ [clearAllListings] Deleted ${subCount} subscriptions + ${marketCount} marketplace listings`);
    return { 
      success: true, 
      message: `Permanently deleted all listings: ${subCount} subscriptions + ${marketCount} marketplace`, 
      subscriptions_deleted: subCount,
      marketplace_deleted: marketCount,
      total_deleted: subCount + marketCount
    };
  },
});

/**
 * ADMIN ONLY: Delete a specific marketplace listing by ID
 */
export const deleteMarketplaceListing = mutation({
  args: {
    marketplace_id: v.id("marketplace"),
    admin_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db.get(args.admin_id);
    if (!admin?.is_admin) {
      throw new Error("❌ Unauthorized - admin only");
    }

    // Get the listing
    const listing = await ctx.db.get(args.marketplace_id);
    if (!listing) {
      throw new Error("❌ Marketplace listing not found");
    }

    // Delete it
    await ctx.db.delete(args.marketplace_id);

    console.log(`✓ [deleteMarketplaceListing] Deleted marketplace listing ${args.marketplace_id}`);
    return { 
      success: true, 
      message: `Deleted "${listing.platform_name}" listing`,
      deleted_id: args.marketplace_id
    };
  },
});

