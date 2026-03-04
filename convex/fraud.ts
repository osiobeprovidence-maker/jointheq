import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// FINGERPRINT REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

/** Register or update a user's device fingerprint on login/signup */
export const registerFingerprint = mutation({
    args: {
        user_id: v.id("users"),
        device_fingerprint: v.optional(v.string()),
        ip_address: v.optional(v.string()),
        user_agent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Upsert fingerprint record
        const existing = await ctx.db
            .query("user_fingerprints")
            .withIndex("by_user", q => q.eq("user_id", args.user_id))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { last_seen: now, ip_address: args.ip_address, user_agent: args.user_agent });
        } else {
            await ctx.db.insert("user_fingerprints", {
                user_id: args.user_id,
                device_fingerprint: args.device_fingerprint,
                ip_address: args.ip_address,
                user_agent: args.user_agent,
                created_at: now,
                last_seen: now,
            });
        }

        // ── Check: same device fingerprint on different accounts ──────────────
        if (args.device_fingerprint) {
            const sameDevice = await ctx.db
                .query("user_fingerprints")
                .withIndex("by_device", q => q.eq("device_fingerprint", args.device_fingerprint!))
                .collect();

            const others = sameDevice.filter(fp => fp.user_id !== args.user_id);
            if (others.length > 0) {
                // Were these accounts created within 24h of each other?
                const currentUser = await ctx.db.get(args.user_id);
                for (const fp of others) {
                    const other = await ctx.db.get(fp.user_id);
                    if (!other || !currentUser) continue;
                    const timeDiff = Math.abs(currentUser.created_at - other.created_at);
                    const isRapid = timeDiff < 24 * 60 * 60 * 1000; // 24 hours

                    const existingFlag = await ctx.db
                        .query("fraud_flags")
                        .withIndex("by_user", q => q.eq("user_id", args.user_id))
                        .filter(q => q.eq(q.field("type"), "same_device"))
                        .first();

                    if (!existingFlag) {
                        await ctx.db.insert("fraud_flags", {
                            user_id: args.user_id,
                            type: "same_device",
                            severity: isRapid ? "high" : "medium",
                            description: `Account shares device fingerprint with user ${fp.user_id}${isRapid ? " (rapid signup detected)" : ""}`,
                            related_user_ids: [fp.user_id],
                            status: "open",
                            created_at: now,
                        });

                        // Also flag the other account
                        await ctx.db.insert("fraud_flags", {
                            user_id: fp.user_id,
                            type: "same_device",
                            severity: isRapid ? "high" : "medium",
                            description: `Account shares device fingerprint with user ${args.user_id}`,
                            related_user_ids: [args.user_id],
                            status: "open",
                            created_at: now,
                        });

                        if (isRapid) {
                            await ctx.db.patch(args.user_id, { is_fraud_flagged: true, fraud_review_reason: "Rapid multi-account creation on same device" });
                        }
                    }
                }
            }
        }

        // ── Check: same IP on multiple accounts (rapid signup) ────────────────
        if (args.ip_address) {
            const sameIP = await ctx.db
                .query("user_fingerprints")
                .withIndex("by_ip", q => q.eq("ip_address", args.ip_address!))
                .collect();

            const othersOnIP = sameIP.filter(fp => fp.user_id !== args.user_id);
            if (othersOnIP.length >= 3) {
                // More than 3 accounts on same IP — flag
                const existingIPFlag = await ctx.db
                    .query("fraud_flags")
                    .withIndex("by_user", q => q.eq("user_id", args.user_id))
                    .filter(q => q.eq(q.field("type"), "same_ip"))
                    .first();

                if (!existingIPFlag) {
                    await ctx.db.insert("fraud_flags", {
                        user_id: args.user_id,
                        type: "same_ip",
                        severity: "medium",
                        description: `IP address shared with ${othersOnIP.length} other accounts`,
                        related_user_ids: othersOnIP.slice(0, 10).map(fp => fp.user_id),
                        status: "open",
                        created_at: now,
                    });
                }
            }
        }
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// CIRCULAR REFERRAL DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a referral would create a circular chain.
 * A → B → C → A is circular (C cannot refer A if A referred B who referred C)
 */
export const checkCircularReferral = mutation({
    args: {
        campaign_id: v.id("campaigns"),
        referrer_id: v.id("users"),
        referred_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Trace the referrer's own referral chain upward (max 10 hops)
        const chain: Id<"users">[] = [args.referrer_id];
        let current: Id<"users"> = args.referrer_id;

        for (let i = 0; i < 10; i++) {
            const entry = await ctx.db
                .query("campaign_referrals")
                .withIndex("by_referred", q => q.eq("referred_id", current))
                .filter(q => q.eq(q.field("campaign_id"), args.campaign_id))
                .first();
            if (!entry) break;
            chain.push(entry.referrer_id);
            current = entry.referrer_id;
        }

        const isCircular = chain.includes(args.referred_id);

        if (isCircular) {
            const now = Date.now();
            // Flag both users
            for (const uid of [args.referrer_id, args.referred_id]) {
                const existingFlag = await ctx.db
                    .query("fraud_flags")
                    .withIndex("by_user", q => q.eq("user_id", uid))
                    .filter(q => q.eq(q.field("type"), "circular_referral"))
                    .first();

                if (!existingFlag) {
                    await ctx.db.insert("fraud_flags", {
                        user_id: uid,
                        type: "circular_referral",
                        severity: "high",
                        description: `Circular referral chain detected in campaign involving ${chain.length} users`,
                        related_user_ids: chain.filter(id => id !== uid).slice(0, 10),
                        related_campaign_id: args.campaign_id,
                        status: "open",
                        created_at: now,
                    });
                    await ctx.db.patch(uid, { is_fraud_flagged: true, fraud_review_reason: "Circular referral chain detected" });
                }
            }
        }

        return { isCircular, chain };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// RAPID REFERRAL DETECTION (many referrals in minutes)
// ─────────────────────────────────────────────────────────────────────────────

export const checkRapidReferrals = mutation({
    args: {
        campaign_id: v.id("campaigns"),
        referrer_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const windowMs = 30 * 60 * 1000; // 30 minutes
        const threshold = 10; // more than 10 referrals in 30 min = suspicious
        const now = Date.now();

        const recentReferrals = await ctx.db
            .query("campaign_referrals")
            .withIndex("by_referrer", q => q.eq("referrer_id", args.referrer_id))
            .filter(q =>
                q.and(
                    q.eq(q.field("campaign_id"), args.campaign_id),
                    q.gte(q.field("created_at"), now - windowMs)
                )
            )
            .collect();

        if (recentReferrals.length >= threshold) {
            const existingFlag = await ctx.db
                .query("fraud_flags")
                .withIndex("by_user", q => q.eq("user_id", args.referrer_id))
                .filter(q => q.eq(q.field("type"), "rapid_signup"))
                .first();

            if (!existingFlag) {
                await ctx.db.insert("fraud_flags", {
                    user_id: args.referrer_id,
                    type: "rapid_signup",
                    severity: "high",
                    description: `${recentReferrals.length} referrals submitted in under 30 minutes — possible bot activity`,
                    related_campaign_id: args.campaign_id,
                    status: "open",
                    created_at: now,
                });
                await ctx.db.patch(args.referrer_id, { is_fraud_flagged: true, fraud_review_reason: "Suspicious rapid referral activity" });
            }

            return { isSuspicious: true, count: recentReferrals.length };
        }

        return { isSuspicious: false, count: recentReferrals.length };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: FRAUD FLAGS QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get all fraud flags with user details */
export const getFraudFlags = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, { status }) => {
        const flags = status
            ? await ctx.db.query("fraud_flags").withIndex("by_status", q => q.eq("status", status)).collect()
            : await ctx.db.query("fraud_flags").collect();

        return await Promise.all(flags.map(async f => {
            const user = await ctx.db.get(f.user_id);
            return { ...f, full_name: user?.full_name ?? "Unknown", email: user?.email ?? "", username: user?.username ?? "" };
        }));
    },
});

/** Get fraud summary counts for admin dashboard */
export const getFraudSummary = query({
    handler: async (ctx) => {
        const allFlags = await ctx.db.query("fraud_flags").collect();
        const flaggedUsers = await ctx.db.query("users")
            .withIndex("by_fraud", q => q.eq("is_fraud_flagged", true))
            .collect();
        const flaggedReferrals = await ctx.db.query("campaign_referrals")
            .withIndex("by_fraud", q => q.eq("is_fraud_flagged", true))
            .collect();
        return {
            total_flags: allFlags.length,
            open_flags: allFlags.filter(f => f.status === "open").length,
            high_severity: allFlags.filter(f => f.severity === "high").length,
            flagged_users: flaggedUsers.length,
            flagged_referrals: flaggedReferrals.length,
            by_type: {
                same_device: allFlags.filter(f => f.type === "same_device").length,
                same_ip: allFlags.filter(f => f.type === "same_ip").length,
                circular_referral: allFlags.filter(f => f.type === "circular_referral").length,
                rapid_signup: allFlags.filter(f => f.type === "rapid_signup").length,
                suspicious_withdrawal: allFlags.filter(f => f.type === "suspicious_withdrawal").length,
            },
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: FRAUD REVIEW MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Admin clears or confirms a fraud flag */
export const reviewFlag = mutation({
    args: {
        flag_id: v.id("fraud_flags"),
        action: v.string(), // "clear" | "confirm" | "reviewing"
        reviewer_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const flag = await ctx.db.get(args.flag_id);
        if (!flag) throw new Error("Flag not found");

        const statusMap: Record<string, string> = {
            clear: "cleared",
            confirm: "confirmed",
            reviewing: "reviewing",
        };

        await ctx.db.patch(args.flag_id, {
            status: statusMap[args.action] ?? "reviewing",
            reviewed_by: args.reviewer_id,
            resolved_at: args.action !== "reviewing" ? Date.now() : undefined,
        });

        // If confirmed, suspend the user
        if (args.action === "confirm") {
            await ctx.db.patch(flag.user_id, { is_suspended: true, is_fraud_flagged: true });
        }

        // If cleared, remove fraud flag from user
        if (args.action === "clear") {
            const otherOpenFlags = await ctx.db
                .query("fraud_flags")
                .withIndex("by_user", q => q.eq("user_id", flag.user_id))
                .filter(q => q.eq(q.field("status"), "open"))
                .collect();

            if (otherOpenFlags.length === 0) {
                await ctx.db.patch(flag.user_id, { is_fraud_flagged: false, fraud_review_reason: undefined });
            }
        }
    },
});

/** Admin manually flags a user */
export const flagUser = mutation({
    args: {
        user_id: v.id("users"),
        type: v.string(),
        severity: v.string(),
        description: v.string(),
        reviewer_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("fraud_flags", {
            user_id: args.user_id,
            type: args.type,
            severity: args.severity,
            description: args.description,
            status: "open",
            created_at: Date.now(),
        });
        await ctx.db.patch(args.user_id, { is_fraud_flagged: true, fraud_review_reason: args.description });
    },
});
