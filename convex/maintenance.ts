import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Delete subscriptions and their groups/slots for cleanup tasks. */
export const deleteSubscriptions = mutation({
  args: { subscription_ids: v.array(v.id("subscriptions")) },
  handler: async (ctx, args) => {
    for (const sid of args.subscription_ids) {
      const sub = await ctx.db.get(sid);
      if (!sub) continue;

      // If subscription had an associated group, delete its slots and the group
      if ((sub as any).group_id) {
        const slots = await ctx.db.query("subscription_slots").withIndex("by_group", q => q.eq("group_id", (sub as any).group_id)).collect();
        await Promise.all(slots.map(s => ctx.db.delete(s._id)));
        try {
          await ctx.db.delete((sub as any).group_id);
        } catch (e) {
          // ignore if group already deleted
        }
      }

      // Finally delete the subscription record
      try {
        await ctx.db.delete(sid);
      } catch (e) {
        // ignore deletion errors
      }
    }
    return { success: true };
  },
});

export const listDuplicateSubscriptions = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("subscriptions").collect();
    const groups: Record<string, any[]> = {};
    for (const s of all) {
      const k = `${s.owner_id}||${s.platform}||${s.login_email}||${s.renewal_date}`;
      (groups[k] = groups[k] || []).push(s);
    }
    const duplicates: string[] = [];
    for (const k of Object.keys(groups)) {
      const arr = groups[k];
      if (arr.length <= 1) continue;
      arr.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
      const dup = arr.slice(1);
      duplicates.push(...dup.map(d => d._id));
    }
    return duplicates;
  }
});
