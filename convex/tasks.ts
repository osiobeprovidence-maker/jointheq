import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createNotification } from "./notificationHelpers";

const PLATFORM_TASK_RATE = 1;

const taskFields = {
  title: v.string(),
  type: v.string(),
  description: v.string(),
  instructions: v.string(),
  externalUrl: v.optional(v.string()),
  bootsReward: v.number(),
  requiredCompletions: v.number(),
  proofType: v.string(),
  deadline: v.number(),
};

async function requireAdmin(ctx: any, adminId: Id<"users">) {
  const admin = await ctx.db.get(adminId);
  if (!admin?.is_admin) throw new Error("Administrator privileges required");
  return admin;
}

export const getTaskRate = query({
  args: {},
  handler: async () => PLATFORM_TASK_RATE,
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const listAvailable = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();

    const visibleTasks = activeTasks
      .filter((task) => task.deadline >= now && task.completedCount < task.requiredCompletions)
      .sort((a, b) => a.deadline - b.deadline);

    if (!args.userId) return visibleTasks.map((task) => ({ ...task, userSubmission: null }));

    const submissions = await ctx.db
      .query("task_submissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId!))
      .collect();
    const submissionByTask = new Map(submissions.map((submission) => [submission.taskId, submission]));

    return visibleTasks.map((task) => ({
      ...task,
      userSubmission: submissionByTask.get(task._id) ?? null,
    }));
  },
});

export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();
    const userSubmissions = await ctx.db
      .query("task_submissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const createdTasks = await ctx.db
      .query("tasks")
      .withIndex("by_creator", (q) => q.eq("creatorUserId", args.userId))
      .collect();

    const completedSubmissions = userSubmissions.filter((submission) => submission.status === "Completed");
    const completedTasks = await Promise.all(completedSubmissions.map((submission) => ctx.db.get(submission.taskId)));
    const bootsEarned = completedTasks.reduce((total, task) => total + (task?.bootsReward ?? 0), 0);

    return {
      availableTasks: activeTasks.filter((task) => task.deadline >= Date.now() && task.completedCount < task.requiredCompletions).length,
      bootsEarned,
      activePromotions: createdTasks.filter((task) => task.status === "Active" || task.status === "Pending Admin Approval").length,
    };
  },
});

export const getMyCreatedTasks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_creator", (q) => q.eq("creatorUserId", args.userId))
      .order("desc")
      .collect();
  },
});

export const createTask = mutation({
  args: {
    creatorUserId: v.id("users"),
    ...taskFields,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.creatorUserId);
    if (!user) throw new Error("User not found");
    if (args.bootsReward <= 0 || args.requiredCompletions <= 0) {
      throw new Error("Reward and completions must be greater than zero");
    }

    const totalCost = args.bootsReward * args.requiredCompletions * PLATFORM_TASK_RATE;
    if ((user.wallet_balance || 0) < totalCost) {
      throw new Error("Insufficient wallet balance. Please fund your wallet to create this task.");
    }

    await ctx.db.patch(args.creatorUserId, {
      wallet_balance: (user.wallet_balance || 0) - totalCost,
    });

    await ctx.db.insert("wallet_transactions", {
      user_id: args.creatorUserId,
      amount: totalCost,
      type: "task_promotion_payment",
      source: "wallet",
      status: "completed",
      description: `Task promotion payment: ${args.title}`,
      created_at: Date.now(),
    });

    const taskId = await ctx.db.insert("tasks", {
      creatorUserId: args.creatorUserId,
      title: args.title,
      type: args.type,
      description: args.description,
      instructions: args.instructions,
      externalUrl: args.externalUrl,
      bootsReward: args.bootsReward,
      requiredCompletions: args.requiredCompletions,
      completedCount: 0,
      proofType: args.proofType,
      deadline: args.deadline,
      totalCost,
      paymentSource: "wallet",
      status: "Pending Admin Approval",
      createdAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: args.creatorUserId,
      title: "Task submitted",
      message: "Your task is pending admin approval.",
      type: "task",
    });

    return { taskId, totalCost };
  },
});

export const submitTask = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    proofType: v.string(),
    proofValue: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "Active") throw new Error("This task is not available");
    if (task.deadline < Date.now()) throw new Error("This task has expired");
    if (task.completedCount >= task.requiredCompletions) throw new Error("This task is already complete");
    if (task.creatorUserId === args.userId) throw new Error("You cannot complete your own promoted task");

    const existing = await ctx.db
      .query("task_submissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("taskId"), args.taskId))
      .first();

    if (existing) throw new Error("You have already submitted this task");

    const submissionId = await ctx.db.insert("task_submissions", {
      taskId: args.taskId,
      userId: args.userId,
      proofType: args.proofType,
      proofValue: args.proofValue,
      screenshotUrl: args.screenshotUrl,
      status: "Pending Review",
      submittedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: args.userId,
      title: "Task proof submitted",
      message: "Your proof is pending admin review.",
      type: "task",
    });

    return submissionId;
  },
});

export const adminListTasks = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status && args.status !== "All") {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

export const adminListSubmissions = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const submissions = args.status && args.status !== "All"
      ? await ctx.db
        .query("task_submissions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect()
      : await ctx.db.query("task_submissions").order("desc").collect();

    return await Promise.all(submissions.map(async (submission) => ({
      ...submission,
      task: await ctx.db.get(submission.taskId),
      user: await ctx.db.get(submission.userId),
    })));
  },
});

export const approveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "Pending Admin Approval") throw new Error("Task is not pending approval");

    await ctx.db.patch(args.taskId, {
      status: "Active",
      reviewedAt: Date.now(),
      reviewedBy: args.adminId,
    });

    await createNotification(ctx, {
      userId: task.creatorUserId,
      title: "Task approved",
      message: "Your promoted task is now active.",
      type: "task",
    });

    return { success: true };
  },
});

export const rejectTask = mutation({
  args: {
    taskId: v.id("tasks"),
    adminId: v.id("users"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      status: "Rejected",
      reviewedAt: Date.now(),
      reviewedBy: args.adminId,
      adminNote: args.adminNote,
    });

    await createNotification(ctx, {
      userId: task.creatorUserId,
      title: "Task rejected",
      message: args.adminNote ? `Your task was rejected: ${args.adminNote}` : "Your task was rejected by admin review.",
      type: "task",
    });

    return { success: true };
  },
});

export const approveSubmission = mutation({
  args: {
    submissionId: v.id("task_submissions"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");
    if (submission.status !== "Pending Review") throw new Error("Submission is not pending review");

    const task = await ctx.db.get(submission.taskId);
    if (!task) throw new Error("Task not found");
    const user = await ctx.db.get(submission.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.submissionId, {
      status: "Completed",
      reviewedAt: Date.now(),
      reviewedBy: args.adminId,
    });

    const completedCount = task.completedCount + 1;
    await ctx.db.patch(submission.taskId, {
      completedCount,
      status: completedCount >= task.requiredCompletions ? "Completed" : task.status,
    });

    await ctx.db.patch(submission.userId, {
      boots_balance: (user.boots_balance ?? user.boot_balance ?? 0) + task.bootsReward,
    });

    await ctx.db.insert("boot_transactions", {
      user_id: submission.userId,
      amount: task.bootsReward,
      type: "task_reward",
      description: `Task reward: ${task.title}`,
      task_id: submission.taskId,
      created_at: Date.now(),
    });

    await createNotification(ctx, {
      userId: submission.userId,
      title: "Task approved",
      message: `${task.bootsReward} BOOTS have been added to your account.`,
      type: "task",
    });

    return { success: true };
  },
});

export const rejectSubmission = mutation({
  args: {
    submissionId: v.id("task_submissions"),
    adminId: v.id("users"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    await ctx.db.patch(args.submissionId, {
      status: "Rejected",
      reviewedAt: Date.now(),
      reviewedBy: args.adminId,
      adminNote: args.adminNote,
    });

    await createNotification(ctx, {
      userId: submission.userId,
      title: "Task proof rejected",
      message: args.adminNote ? `Your proof was rejected: ${args.adminNote}` : "Your task proof was rejected.",
      type: "task",
    });

    return { success: true };
  },
});
