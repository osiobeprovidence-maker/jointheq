import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const SLOT_RULES: Record<string, number> = {
  "Netflix Premium": 8,
  "Spotify Family": 6,
  "Apple Music": 6,
  "VPN": 5,
  "CapCut": 5,
  "AI Tools": 5,
  "Other": 1
};

export const submitListing = mutation({
  args: {
    owner_id: v.id("users"),
    platform: v.string(),
    email: v.string(),
    password: v.string(),
    renewal_date: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const total_slots = SLOT_RULES[args.platform] || 1;
    
    return await ctx.db.insert("subscriptions", {
      owner_id: args.owner_id,
      platform: args.platform,
      login_email: args.email,
      login_password: args.password,
      renewal_date: args.renewal_date,
      category: args.category,
      status: "Pending Review",
      total_slots,
      slot_price: 0, // Set by admin on approval
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const getOwnerListings = query({
  args: { owner_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_id", args.owner_id))
      .order("desc")
      .collect();
  },
});

export const getAdminListings = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Only show subscriptions that came from user listings (not admin-created ones)
    // They are identified by having a login_password set by users
    if (args.status && args.status !== "All") {
      const results = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
      // Enrich with owner name
      return await Promise.all(results.map(async (s) => {
        const owner = await ctx.db.get(s.owner_id);
        return { ...s, owner_name: owner?.full_name ?? "Unknown", email: s.login_email };
      }));
    }
    const results = await ctx.db.query("subscriptions").order("desc").collect();
    return await Promise.all(results.map(async (s) => {
      const owner = await ctx.db.get(s.owner_id);
      return { ...s, owner_name: owner?.full_name ?? "Unknown", email: s.login_email };
    }));
  },
});

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
    const listing = await ctx.db.get(args.listing_id);
    if (!listing) throw new Error("Listing not found");

    // 1. Find or create the Catalog record
    let catalog = await ctx.db.query("subscription_catalog")
      .filter(q => q.eq(q.field("name"), listing.platform))
      .first();
    
    if (!catalog) {
      const catalogId = await ctx.db.insert("subscription_catalog", {
        name: listing.platform,
        category: args.category || listing.category || "Streaming",
        description: `Owner-listed ${listing.platform}`,
        base_cost: args.owner_payout,
        is_active: true,
      });
      catalog = await ctx.db.get(catalogId);
    }

    // 2. Create the Marketplace Group
    const groupId = await ctx.db.insert("groups", {
      subscription_catalog_id: catalog!._id,
      billing_cycle_start: listing.renewal_date,
      status: "active",
      account_email: listing.login_email,
      plan_owner: "owner_listed",
    });

    // 3. Create a Slot Type
    const slotTypeId = await ctx.db.insert("slot_types", {
      subscription_catalog_id: catalog!._id,
      name: "Owner Slot",
      sub_name: "Reserved",
      price: args.price_per_slot,
      device_limit: 1,
      downloads_enabled: true,
      min_q_score: 0,
      capacity: args.total_slots,
      access_type: "email_invite",
    });

    // 4. Create pre-generated Slots (PILLAR 3)
    for (let i = 1; i <= args.total_slots; i++) {
      await ctx.db.insert("subscription_slots", {
        subscription_id: listing._id,
        group_id: groupId,
        slot_type_id: slotTypeId,
        slot_number: i,
        status: "open",
        renewal_date: listing.renewal_date,
        created_at: Date.now(),
      });
    }

    // 5. Update the Subscription Account record
    await ctx.db.patch(args.listing_id, {
      status: "Active",
      total_slots: args.total_slots,
      slot_price: args.price_per_slot,
      owner_payout_amount: args.owner_payout,
      category: args.category || listing.category,
      group_id: groupId,
      platform_catalog_id: catalog!._id,
      admin_note: args.admin_note,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const rejectListing = mutation({
  args: {
    listing_id: v.id("subscriptions"),
    admin_note: v.optional(v.string()),
    admin_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.listing_id, {
      status: "Rejected",
      admin_note: args.admin_note,
      updated_at: Date.now(),
    });
  },
});
