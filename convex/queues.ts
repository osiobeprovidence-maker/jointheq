import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ────────────────────────────────────────────────────────────────────────
// QUEUE QUERIES
// ────────────────────────────────────────────────────────────────────────

/**
 * Get all active queues for the marketplace
 */
export const getActiveQueues = query({
  args: {},
  handler: async (ctx) => {
    const queues = await ctx.db
      .query("queues")
      .withIndex("by_visibility", (q) => q.eq("visibility", true))
      .filter((q) => q.and(
        q.eq(q.field("stage"), "official"),
        q.eq(q.field("status"), "active"),
      ))
      .collect();

    // Enhance with member details
    return Promise.all(
      queues.map(async (queue) => {
        const members = await ctx.db
          .query("queue_members")
          .withIndex("by_queue", (q) => q.eq("queue_id", queue._id))
          .collect();

        const approvedMembers = members.filter((m) => m.status === "approved");

        return {
          ...queue,
          approved_members: approvedMembers.length,
          remaining_spots: queue.max_members - approvedMembers.length,
        };
      })
    );
  },
});

/**
 * Get a single queue with all details
 */
export const getQueueDetails = query({
  args: { queueId: v.id("queues") },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) return null;

    // Get members
    const members = await ctx.db
      .query("queue_members")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .collect();

    const approvedMembers = members.filter((m) => m.status === "approved");
    const pendingMembers = members.filter((m) => m.status === "pending");

    // Enrich member data with user info
    const memberDetails = await Promise.all(
      approvedMembers.map(async (member) => {
        const user = await ctx.db.get(member.user_id);
        return { ...member, user };
      })
    );

    const pendingDetails = await Promise.all(
      pendingMembers.map(async (member) => {
        const user = await ctx.db.get(member.user_id);
        return { ...member, user };
      })
    );

    return {
      ...queue,
      approved_members: memberDetails,
      pending_members: pendingDetails,
      total_approved: approvedMembers.length,
      total_pending: pendingMembers.length,
      remaining_spots: queue.max_members - approvedMembers.length,
    };
  },
});

/**
 * Get queues created by an admin
 */
export const getAdminQueues = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const queues = await ctx.db
      .query("queues")
      .withIndex("by_admin", (q) => q.eq("admin_id", args.adminId))
      .collect();

    return Promise.all(
      queues.map(async (queue) => {
        const members = await ctx.db
          .query("queue_members")
          .withIndex("by_queue", (q) => q.eq("queue_id", queue._id))
          .collect();

        const approvedMembers = members.filter((m) => m.status === "approved");

        return {
          ...queue,
          approved_members: approvedMembers.length,
          pending_members: members.filter((m) => m.status === "pending").length,
          remaining_spots: queue.max_members - approvedMembers.length,
        };
      })
    );
  },
});

/**
 * Get user's joined queues
 */
export const getUserQueues = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get queue memberships for this user
    const memberships = await ctx.db
      .query("queue_members")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();

    // Get queue details for each membership
    return Promise.all(
      memberships.map(async (membership) => {
        const queue = await ctx.db.get(membership.queue_id);
        return { ...queue, membership };
      })
    );
  },
});

/**
 * Get pending invitations for a user
 */
export const getPendingInvitations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query("queue_invitations")
      .withIndex("by_recipient", (q) => q.eq("recipient_id", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return Promise.all(
      invitations.map(async (inv) => {
        const queue = await ctx.db.get(inv.queue_id);
        const sender = await ctx.db.get(inv.sender_id);
        return { ...inv, queue, sender };
      })
    );
  },
});

// ────────────────────────────────────────────────────────────────────────
// QUEUE MUTATIONS
// ────────────────────────────────────────────────────────────────────────

/**
 * Create a new queue (Admin only)
 */
export const createQueue = mutation({
  args: {
    admin_id: v.id("users"),
    service_name: v.string(),
    description: v.string(),
    category: v.string(),
    service_image_url: v.optional(v.string()),
    total_cost: v.number(),
    max_members: v.number(),
    closing_date: v.number(),
    visibility: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const queueId = await ctx.db.insert("queues", {
      creator_id: args.admin_id,
      admin_id: args.admin_id,
      service_name: args.service_name,
      description: args.description,
      category: args.category,
      service_image_url: args.service_image_url,
      stage: "official",
      total_cost: args.total_cost,
      max_members: args.max_members,
      current_members: 0,
      current_price_per_member: args.total_cost,
      status: "active",
      visibility: args.visibility,
      closing_date: args.closing_date,
      created_at: now,
      updated_at: now,
    });

    return queueId;
  },
});

/**
 * Update queue details (Admin only)
 */
export const updateQueue = mutation({
  args: {
    queueId: v.id("queues"),
    service_name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    service_image_url: v.optional(v.string()),
    total_cost: v.optional(v.number()),
    max_members: v.optional(v.number()),
    closing_date: v.optional(v.number()),
    visibility: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    const updates: any = { updated_at: Date.now() };

    if (args.service_name !== undefined) updates.service_name = args.service_name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.service_image_url !== undefined)
      updates.service_image_url = args.service_image_url;
    if (args.total_cost !== undefined) {
      updates.total_cost = args.total_cost;
      // Recalculate price per member
      updates.current_price_per_member =
        args.total_cost / Math.max(queue.current_members, 1);
    }
    if (args.max_members !== undefined) updates.max_members = args.max_members;
    if (args.closing_date !== undefined) updates.closing_date = args.closing_date;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.queueId, updates);
    return args.queueId;
  },
});

/**
 * User joins a queue
 */
export const joinQueue = mutation({
  args: {
    queueId: v.id("queues"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    if (queue.status !== "active")
      throw new Error("Queue is not currently accepting new members");

    // Check if user already in queue
    const existing = await ctx.db
      .query("queue_members")
      .withIndex("by_queue_user", (q) =>
        q.eq("queue_id", args.queueId).eq("user_id", args.userId)
      )
      .first();

    if (existing) throw new Error("User already in queue");

    // Add user as pending member
    const memberId = await ctx.db.insert("queue_members", {
      queue_id: args.queueId,
      user_id: args.userId,
      status: "pending", // Requires admin approval
      join_date: Date.now(),
    });

    return memberId;
  },
});

/**
 * Admin approves a pending queue member
 */
export const approveMember = mutation({
  args: {
    memberId: v.id("queue_members"),
    queueId: v.id("queues"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    // Check if queue is full
    const approvedMembers = await ctx.db
      .query("queue_members")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();
    const approvedCount = approvedMembers.length;

    if (approvedCount >= queue.max_members)
      throw new Error("Queue is full");

    // Approve member
    await ctx.db.patch(args.memberId, {
      status: "approved",
      approved_date: Date.now(),
    });

    // Recalculate price per member
    const newMemberCount = approvedCount + 1;
    const newPricePerMember = queue.total_cost / newMemberCount;

    // Update queue
    await ctx.db.patch(args.queueId, {
      current_members: newMemberCount,
      current_price_per_member: newPricePerMember,
      updated_at: Date.now(),
      status: newMemberCount === queue.max_members ? "full" : "active",
    });

    // Send notification to user
    await ctx.db.insert("notifications", {
      user_id: member.user_id,
      title: "Queue Request Approved",
      message: `Your request to join ${queue.service_name} has been approved!`,
      type: "queue_approval",
      is_read: false,
      created_at: Date.now(),
    });

    return args.memberId;
  },
});

/**
 * Admin rejects a pending queue member
 */
export const rejectMember = mutation({
  args: {
    memberId: v.id("queue_members"),
    queueId: v.id("queues"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    // Update member status
    await ctx.db.patch(args.memberId, {
      status: "rejected",
      member_notes: args.reason,
    });

    // Send notification to user
    await ctx.db.insert("notifications", {
      user_id: member.user_id,
      title: "Queue Request Rejected",
      message: `Your request to join ${queue.service_name} has been rejected.`,
      type: "queue_rejection",
      is_read: false,
      created_at: Date.now(),
    });

    return args.memberId;
  },
});

/**
 * User leaves a queue
 */
export const leaveQueue = mutation({
  args: {
    queueId: v.id("queues"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("queue_members")
      .withIndex("by_queue_user", (q) =>
        q.eq("queue_id", args.queueId).eq("user_id", args.userId)
      )
      .first();

    if (!member) throw new Error("Member not found in queue");

    const wasApproved = member.status === "approved";

    // Update member status
    await ctx.db.patch(member._id, { status: "left" });

    // If was approved, recalculate pricing
    if (wasApproved) {
      const queue = await ctx.db.get(args.queueId);
      if (!queue) throw new Error("Queue not found");

      const approvedMembers = await ctx.db
        .query("queue_members")
        .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
        .filter((q) => q.eq(q.field("status"), "approved"))
        .collect();
      const approvedCount = approvedMembers.length;

      const newMemberCount = Math.max(0, approvedCount - 1);
      const newPricePerMember =
        newMemberCount > 0
          ? queue.total_cost / newMemberCount
          : queue.total_cost;

      await ctx.db.patch(args.queueId, {
        current_members: newMemberCount,
        current_price_per_member: newPricePerMember,
        updated_at: Date.now(),
        status: newMemberCount === 0 ? "active" : "active", // Can be active again
      });
    }

    return member._id;
  },
});

/**
 * Send invitation to user to join queue
 */
export const sendQueueInvitation = mutation({
  args: {
    queueId: v.id("queues"),
    senderId: v.id("users"),
    recipientId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    const recipient = await ctx.db.get(args.recipientId);
    if (!recipient) throw new Error("Recipient not found");

    // Check if already invited or member
    const existing = await ctx.db
      .query("queue_invitations")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .filter((q) => q.eq(q.field("recipient_id"), args.recipientId))
      .first();

    if (existing && existing.status === "pending")
      throw new Error("User already has a pending invitation");

    // Create invitation (expires in 7 days)
    const invitationId = await ctx.db.insert("queue_invitations", {
      queue_id: args.queueId,
      sender_id: args.senderId,
      recipient_id: args.recipientId,
      status: "pending",
      message: args.message,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      sent_at: Date.now(),
      email_sent: false,
    });

    // Send in-app notification
    const notificationId = await ctx.db.insert("notifications", {
      user_id: args.recipientId,
      title: "Queue Invitation",
      message: `You've been invited to join ${queue.service_name}`,
      type: "queue_invitation",
      is_read: false,
      created_at: Date.now(),
    });

    // Update invitation with notification id
    await ctx.db.patch(invitationId, {
      in_app_notification_id: notificationId,
    });

    return invitationId;
  },
});

/**
 * Accept a queue invitation
 */
export const acceptInvitation = mutation({
  args: {
    invitationId: v.id("queue_invitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.status !== "pending")
      throw new Error("Invitation is no longer valid");

    // Update invitation
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      responded_at: Date.now(),
    });

    // Add user as approved member directly (since invited)
    const existing = await ctx.db
      .query("queue_members")
      .withIndex("by_queue_user", (q) =>
        q
          .eq("queue_id", invitation.queue_id)
          .eq("user_id", invitation.recipient_id)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("queue_members", {
        queue_id: invitation.queue_id,
        user_id: invitation.recipient_id,
        status: "approved",
        join_date: Date.now(),
        approved_date: Date.now(),
        approved_by: invitation.sender_id,
      });

      // Update queue pricing
      const queue = await ctx.db.get(invitation.queue_id);
      if (queue) {
        const approvedMembers = await ctx.db
          .query("queue_members")
          .withIndex("by_queue", (q) => q.eq("queue_id", invitation.queue_id))
          .filter((q) => q.eq(q.field("status"), "approved"))
          .collect();
        const approvedCount = approvedMembers.length;

        const newPricePerMember = queue.total_cost / (approvedCount + 1);

        await ctx.db.patch(invitation.queue_id, {
          current_members: approvedCount + 1,
          current_price_per_member: newPricePerMember,
          updated_at: Date.now(),
          status:
            approvedCount + 1 === queue.max_members ? "full" : "active",
        });
      }
    }

    return args.invitationId;
  },
});

/**
 * Decline a queue invitation
 */
export const declineInvitation = mutation({
  args: {
    invitationId: v.id("queue_invitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    await ctx.db.patch(args.invitationId, {
      status: "declined",
      responded_at: Date.now(),
    });

    return args.invitationId;
  },
});

/**
 * Send announcement to all queue members
 */
export const sendQueueAnnouncement = mutation({
  args: {
    queueId: v.id("queues"),
    adminId: v.id("users"),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    // Create announcement record
    const announcementId = await ctx.db.insert("queue_announcements", {
      queue_id: args.queueId,
      admin_id: args.adminId,
      title: args.title,
      message: args.message,
      sent_to_all: true,
      created_at: Date.now(),
    });

    // Get all approved members
    const members = await ctx.db
      .query("queue_members")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    // Send notification to each member
    for (const member of members) {
      await ctx.db.insert("notifications", {
        user_id: member.user_id,
        title: args.title,
        message: args.message,
        type: "queue_announcement",
        is_read: false,
        created_at: Date.now(),
      });
    }

    return announcementId;
  },
});

/**
 * Close queue (no more members can join)
 */
export const closeQueue = mutation({
  args: {
    queueId: v.id("queues"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    await ctx.db.patch(args.queueId, {
      status: "closed",
      completed_at: Date.now(),
      cancelled_reason: args.reason,
      updated_at: Date.now(),
    });

    // Notify all members
    const members = await ctx.db
      .query("queue_members")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    for (const member of members) {
      await ctx.db.insert("notifications", {
        user_id: member.user_id,
        title: "Queue Closed",
        message: `${queue.service_name} queue has been closed.`,
        type: "queue_closed",
        is_read: false,
        created_at: Date.now(),
      });
    }

    return args.queueId;
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUE REQUESTS (Interest Queue System)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all interest queues (requests that haven't been converted yet)
 */
export const getQueueRequests = query({
  args: {},
  handler: async (ctx) => {
    const queues = await ctx.db
      .query("queues")
      .withIndex("by_stage", (q) => q.eq("stage", "interest"))
      .filter((q) => q.and(
        q.eq(q.field("status"), "interest"),
        q.eq(q.field("visibility"), true),
      ))
      .collect();

    return Promise.all(
      queues.map(async (queue) => {
        const creator = await ctx.db.get(queue.creator_id);
        const members = await ctx.db
          .query("queue_members")
          .withIndex("by_queue", (q) => q.eq("queue_id", queue._id))
          .collect();
        const approvedMembers = members.filter((m) => m.status === "approved");
        return {
          ...queue,
          creator_name: creator?.full_name || "Unknown",
          creator_username: creator?.username || "",
          total_interested: approvedMembers.length,
        };
      })
    );
  },
});

/**
 * Get user's own queue requests
 */
export const getMyQueueRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const queues = await ctx.db
      .query("queues")
      .withIndex("by_creator", (q) => q.eq("creator_id", args.userId))
      .collect();

    return Promise.all(
      queues.map(async (queue) => {
        const members = await ctx.db
          .query("queue_members")
          .withIndex("by_queue", (q) => q.eq("queue_id", queue._id))
          .collect();
        const approvedMembers = members.filter((m) => m.status === "approved");
        return {
          ...queue,
          total_interested: approvedMembers.length,
        };
      })
    );
  },
});

/**
 * Create a queue request (interest queue)
 * User enters service name, optional description, estimated price, notes
 */
export const createQueueRequest = mutation({
  args: {
    userId: v.id("users"),
    service_name: v.string(),
    description: v.optional(v.string()),
    estimated_price: v.optional(v.number()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limit: check user doesn't have too many active requests
    const existingRequests = await ctx.db
      .query("queues")
      .withIndex("by_creator", (q) => q.eq("creator_id", args.userId))
      .filter((q) => q.eq(q.field("stage"), "interest"))
      .filter((q) => q.eq(q.field("status"), "interest"))
      .collect();

    if (existingRequests.length >= 3) {
      throw new Error("You can have at most 3 active queue requests");
    }

    const now = Date.now();
    const slug = `${args.service_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${now.toString(36)}`;

    // Create the queue as an interest request
    const queueId = await ctx.db.insert("queues", {
      creator_id: args.userId,
      admin_id: undefined,
      service_name: args.service_name,
      description: args.description || `I need ${args.service_name}`,
      category: args.category || "other",
      service_image_url: undefined,
      notes: args.notes,
      stage: "interest",
      total_cost: args.estimated_price || 0,
      max_members: 1,
      current_members: 1,
      current_price_per_member: args.estimated_price || 0,
      service_fee: undefined,
      status: "interest",
      visibility: true,
      closing_date: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      created_at: now,
      updated_at: now,
    });

    // Auto-add creator as first member
    await ctx.db.insert("queue_members", {
      queue_id: queueId,
      user_id: args.userId,
      status: "approved",
      join_date: now,
      approved_date: now,
    });

    // Notify everyone about the new queue
    const allUsers = await ctx.db.query("users").collect();

    for (const user of allUsers) {
      if (user._id === args.userId) continue;
      await ctx.db.insert("notifications", {
        user_id: user._id,
        title: "🔥 New Interest Queue!",
        message: `${args.service_name} just dropped — jump in before it pops off!`,
        type: "queue_request",
        is_read: false,
        created_at: now,
      });
    }

    return {
      queueId,
      slug,
      share_link: `/queue/${slug}`,
    };
  },
});

/**
 * Join an interest queue
 */
export const joinQueueRequest = mutation({
  args: {
    queueId: v.id("queues"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");
    if (queue.stage !== "interest") throw new Error("This is not an interest queue");
    if (queue.status !== "interest") throw new Error("This queue is not accepting members");

    // Check if already joined
    const existing = await ctx.db
      .query("queue_members")
      .withIndex("by_queue_user", (q) =>
        q.eq("queue_id", args.queueId).eq("user_id", args.userId)
      )
      .first();

    if (existing) throw new Error("You already joined this queue");

    const now = Date.now();

    // Auto-approve for interest queues
    const memberId = await ctx.db.insert("queue_members", {
      queue_id: args.queueId,
      user_id: args.userId,
      status: "approved",
      join_date: now,
      approved_date: now,
    });

    // Update member count
    await ctx.db.patch(args.queueId, {
      current_members: queue.current_members + 1,
      updated_at: now,
    });

    // Notify creator + all existing approved members
    const existingMembers = await ctx.db
      .query("queue_members")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const notifiedIds = new Set<string>();
    notifiedIds.add(queue.creator_id);

    await ctx.db.insert("notifications", {
      user_id: queue.creator_id,
      title: "🎉 New member joined!",
      message: `Someone new is interested in ${queue.service_name} — your queue is growing!`,
      type: "queue_join",
      is_read: false,
      created_at: now,
    });

    for (const member of existingMembers) {
      if (notifiedIds.has(member.user_id)) continue;
      notifiedIds.add(member.user_id);
      await ctx.db.insert("notifications", {
        user_id: member.user_id,
        title: "🎉 Queue growing!",
        message: `A new person joined ${queue.service_name} — ${existingMembers.length + 1} people interested so far!`,
        type: "queue_join",
        is_read: false,
        created_at: now,
      });
    }

    return memberId;
  },
});

/**
 * Get all plans for a queue
 */
export const getQueuePlans = query({
  args: { queueId: v.id("queues") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("queue_plans")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .collect();
  },
});

/**
 * Admin converts interest queue to official with plans
 */
export const convertToOfficialQueue = mutation({
  args: {
    queueId: v.id("queues"),
    adminId: v.id("users"),
    service_fee: v.optional(v.number()),
    closing_date: v.optional(v.number()),
    max_members: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");

    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");
    if (queue.stage !== "interest") throw new Error("Queue is already official");

    const now = Date.now();

    // Convert to official
    await ctx.db.patch(args.queueId, {
      stage: "official",
      status: "active",
      admin_id: args.adminId,
      service_fee: args.service_fee || 0,
      max_members: args.max_members || queue.max_members,
      closing_date: args.closing_date || queue.closing_date,
      updated_at: now,
    });

    // Notify all interested members
    const members = await ctx.db
      .query("queue_members")
      .withIndex("by_queue", (q) => q.eq("queue_id", args.queueId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    for (const member of members) {
      await ctx.db.insert("notifications", {
        user_id: member.user_id,
        title: `${queue.service_name} is now available!`,
        message: `Plans are now available. Choose your plan and secure your spot.`,
        type: "queue_ready",
        is_read: false,
        created_at: now,
      });
    }

    return { success: true };
  },
});

/**
 * Admin adds a plan to a queue
 */
export const addQueuePlan = mutation({
  args: {
    queueId: v.id("queues"),
    adminId: v.id("users"),
    name: v.string(),
    price: v.number(),
    description: v.optional(v.string()),
    max_members: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");

    const queue = await ctx.db.get(args.queueId);
    if (!queue) throw new Error("Queue not found");

    // Check plan name uniqueness
    const existing = await ctx.db
      .query("queue_plans")
      .withIndex("by_queue_name", (q) =>
        q.eq("queue_id", args.queueId).eq("name", args.name)
      )
      .first();

    if (existing) throw new Error(`A plan named "${args.name}" already exists`);

    const planId = await ctx.db.insert("queue_plans", {
      queue_id: args.queueId,
      name: args.name,
      price: args.price,
      description: args.description,
      max_members: args.max_members,
      current_members: 0,
      created_at: Date.now(),
    });

    return planId;
  },
});

/**
 * Admin updates a plan
 */
export const updateQueuePlan = mutation({
  args: {
    planId: v.id("queue_plans"),
    adminId: v.id("users"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    description: v.optional(v.string()),
    max_members: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.price !== undefined) updates.price = args.price;
    if (args.description !== undefined) updates.description = args.description;
    if (args.max_members !== undefined) updates.max_members = args.max_members;

    await ctx.db.patch(args.planId, updates);
    return args.planId;
  },
});

/**
 * Admin removes a plan
 */
export const removeQueuePlan = mutation({
  args: {
    planId: v.id("queue_plans"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    // Unselect plan for all members who chose it
    const members = await ctx.db
      .query("queue_members")
      .withIndex("by_plan", (q) => q.eq("plan_id", args.planId))
      .collect();

    for (const member of members) {
      await ctx.db.patch(member._id, { plan_id: undefined });
    }

    await ctx.db.delete(args.planId);
    return { success: true };
  },
});

/**
 * Member selects a plan for a queue they've joined
 */
export const selectQueuePlan = mutation({
  args: {
    queueId: v.id("queues"),
    userId: v.id("users"),
    planId: v.id("queue_plans"),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.queue_id !== args.queueId) throw new Error("Plan does not belong to this queue");

    // Check plan capacity
    if (plan.current_members >= plan.max_members) {
      throw new Error("This plan is full");
    }

    // Find user's membership
    const member = await ctx.db
      .query("queue_members")
      .withIndex("by_queue_user", (q) =>
        q.eq("queue_id", args.queueId).eq("user_id", args.userId)
      )
      .first();

    if (!member) throw new Error("You haven't joined this queue");
    if (member.status !== "approved") throw new Error("Your membership is not approved");

    // If user had a previous plan, decrement its count
    if (member.plan_id && member.plan_id !== args.planId) {
      const oldPlan = await ctx.db.get(member.plan_id);
      if (oldPlan) {
        await ctx.db.patch(member.plan_id, {
          current_members: Math.max(0, oldPlan.current_members - 1),
        });
      }
    }

    // Update member's plan
    await ctx.db.patch(member._id, { plan_id: args.planId });

    // Increment plan's member count (only if changing to a different plan)
    if (member.plan_id !== args.planId) {
      await ctx.db.patch(args.planId, {
        current_members: plan.current_members + 1,
      });
    }

    return { success: true };
  },
});

/**
 * Get official queues with plan info for marketplace
 */
export const getOfficialQueues = query({
  args: {},
  handler: async (ctx) => {
    const queues = await ctx.db
      .query("queues")
      .withIndex("by_stage", (q) => q.eq("stage", "official"))
      .filter((q) => q.and(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("visibility"), true),
      ))
      .collect();

    return Promise.all(
      queues.map(async (queue) => {
        const plans = await ctx.db
          .query("queue_plans")
          .withIndex("by_queue", (q) => q.eq("queue_id", queue._id))
          .collect();

        const members = await ctx.db
          .query("queue_members")
          .withIndex("by_queue", (q) => q.eq("queue_id", queue._id))
          .filter((q) => q.eq(q.field("status"), "approved"))
          .collect();

        const totalApproved = members.length;

        // Dynamic pricing: for each plan, calculate effective price
        const plansWithPricing = plans.map((plan) => {
          const filled = plan.current_members;
          const remaining = plan.max_members - filled;
          const fullPrice = plan.price;
          const currentPrice = plan.max_members > 0
            ? Math.ceil((plan.price + (queue.service_fee || 0)) / Math.max(filled + 1, 1))
            : plan.price;

          return {
            ...plan,
            filled,
            remaining,
            full_price: fullPrice,
            current_price: currentPrice,
            progress_pct: plan.max_members > 0
              ? Math.min(100, Math.round((filled / plan.max_members) * 100))
              : 0,
          };
        });

        return {
          ...queue,
          plans: plansWithPricing,
          total_members: totalApproved,
        };
      })
    );
  },
});
