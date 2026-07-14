import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export async function createUserActivityLog(
  ctx: any,
  args: {
    userId: Id<"users">;
    category: "wallet" | "payment" | "subscription" | "referral" | "account" | "support" | "raffle" | "rewards" | "admin";
    action: string;
    description?: string;
    status?: "success" | "pending" | "failed";
    amount?: number;
    metadata?: Record<string, any>;
  }
) {
  try {
    await ctx.db.insert("user_activities", {
      user_id: args.userId,
      category: args.category,
      action: args.action,
      description: args.description ?? "",
      status: args.status ?? "success",
      amount: args.amount,
      metadata: args.metadata,
      created_at: Date.now(),
    });
  } catch (error) {
    console.error("Failed to log user activity:", error);
  }
}
