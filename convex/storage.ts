import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveUploadUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId as Id<"_storage">);
    if (!url) throw new Error("Failed to resolve upload URL");
    return url;
  },
});

export const deleteFile = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId as Id<"_storage">);
  },
});
