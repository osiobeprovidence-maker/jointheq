import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
