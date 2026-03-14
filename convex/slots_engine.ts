import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * CORE PILLAR: Auto Slot Engine
 * Manages the lifecycle of slots: Creation, Allocation, and Optimization.
 */

/** Pre-generates slots for a new group based on slot types */
export const initializeGroupSlots = mutation({
  args: {
    group_id: v.id("groups"),
    subscription_catalog_id: v.id("subscription_catalog"),
  },
  handler: async (ctx, args) => {
    const slotTypes = await ctx.db
      .query("slot_types")
      .withIndex("by_subscription", (q) => q.eq("subscription_id", args.subscription_catalog_id))
      .collect();

    for (const st of slotTypes) {
      const capacity = st.capacity || 1;
      for (let i = 1; i <= capacity; i++) {
        await ctx.db.insert("subscription_slots", {
          group_id: args.group_id,
          slot_type_id: st._id,
          slot_number: i,
          status: "open",
          renewal_date: "", // Will be set when joined
          created_at: Date.now(),
        });
      }
    }
  },
});

/** Finds the most optimal empty slot for a user */
export const findOptimalSlot = query({
  args: {
    slot_type_id: v.id("slot_types"),
  },
  handler: async (ctx, args) => {
    const slotType = await ctx.db.get(args.slot_type_id);
    if (!slotType) return null;

    // 1. Get all active groups for this catalog item
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_catalog", (q) => q.eq("subscription_catalog_id", slotType.subscription_id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const group of groups) {
      // 2. Find an 'open' slot in this group of the correct type
      const emptySlot = await ctx.db
        .query("subscription_slots")
        .withIndex("by_group", (q) => q.eq("group_id", group._id))
        .filter((q) => 
          q.and(
            q.eq(q.field("slot_type_id"), slotType._id),
            q.eq(q.field("status"), "open")
          )
        )
        .first();

      if (emptySlot) return emptySlot;
    }

    return null;
  },
});
