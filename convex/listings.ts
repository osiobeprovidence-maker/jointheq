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
  },
  handler: async (ctx, args) => {
    const total_slots = SLOT_RULES[args.platform] || 1;
    
    return await ctx.db.insert("subscription_owner_listings", {
      owner_id: args.owner_id,
      platform: args.platform,
      email: args.email,
      password: args.password,
      renewal_date: args.renewal_date,
      status: "Pending Review",
      total_slots,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const getOwnerListings = query({
  args: { owner_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscription_owner_listings")
      .withIndex("by_owner", (q) => q.eq("owner_id", args.owner_id))
      .order("desc")
      .collect();
  },
});

export const getAdminListings = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status && args.status !== "All") {
      return await ctx.db
        .query("subscription_owner_listings")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("subscription_owner_listings").order("desc").collect();
  },
});

export const approveListing = mutation({
  args: {
    listing_id: v.id("subscription_owner_listings"),
    admin_id: v.id("users"),
    total_slots: v.number(),
    price_per_slot: v.number(),
    owner_payout: v.number(),
    admin_note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listing_id);
    if (!listing) throw new Error("Listing not found");

    // 1. Find or create the Subscription Platform record in the "subscriptions" table
    let sub = await ctx.db.query("subscriptions")
      .filter(q => q.eq(q.field("name"), listing.platform))
      .first();
    
    if (!sub) {
      const subId = await ctx.db.insert("subscriptions", {
        name: listing.platform,
        description: `Owner-listed ${listing.platform} subscription`,
        base_cost: args.owner_payout,
        is_active: true,
      });
      sub = await ctx.db.get(subId);
    }

    // 2. Create the Marketplace Group
    const groupId = await ctx.db.insert("groups", {
      subscription_id: sub!._id,
      billing_cycle_start: listing.renewal_date,
      status: "active",
      account_email: listing.email,
      plan_owner: "user_owner", // Marker for revenue sharing
    });

    // 3. Create a Slot Type for this group if it doesn't exist
    // (In a real app, we might reuse slot types, but for now we create a specific one)
    const slotTypeId = await ctx.db.insert("slot_types", {
      subscription_id: sub!._id,
      name: "Standard Access",
      price: args.price_per_slot,
      device_limit: 1,
      downloads_enabled: true,
      min_q_score: 0,
      capacity: args.total_slots,
      access_type: "email_invite",
    });

    // 4. Create the actual Slots
    for (let i = 0; i < args.total_slots; i++) {
      await ctx.db.insert("slots", {
        group_id: groupId,
        slot_type_id: slotTypeId,
        status: "available",
        renewal_date: listing.renewal_date,
      });
    }

    // 5. Update the Owner Listing
    await ctx.db.patch(args.listing_id, {
      status: "Active",
      total_slots: args.total_slots,
      price_per_slot: args.price_per_slot,
      owner_payout_amount: args.owner_payout,
      group_id: groupId,
      admin_note: args.admin_note,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const rejectListing = mutation({
  args: {
    listing_id: v.id("subscription_owner_listings"),
    admin_note: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.listing_id, {
      status: "Rejected",
      admin_note: args.admin_note,
      updated_at: Date.now(),
    });
  },
});
