import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { awardReputation } from "./reputation";

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

export const getById = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

export const getInvitedUsers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_referred_by", (q) => q.eq("referred_by", args.userId))
            .collect();
    },
});

export const createUser = mutation({
    args: {
        email: v.string(),
        full_name: v.string(),
        phone: v.optional(v.string()),
        password_hash: v.string(),
        verification_token: v.string(),
        verification_token_expires: v.string(),
        referral_code: v.string(),
        referred_by_code: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { referred_by_code, ...userArgs } = args;
        // Check for duplicate email
        const existingEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
        if (existingEmail) {
            throw new Error("Email already registered");
        }

        // Check for duplicate phone if provided
        if (args.phone) {
            const existingPhone = await ctx.db
                .query("users")
                .withIndex("by_phone", (q) => q.eq("phone", args.phone))
                .unique();
            if (existingPhone) {
                throw new Error("Phone number already registered");
            }
        }

        // Check for duplicate referral code
        const existingReferral = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) => q.eq("referral_code", args.referral_code))
            .unique();
        if (existingReferral) {
            throw new Error("Referral code already exists");
        }

        let referredById: any = undefined;
        if (referred_by_code) {
            const referrer = await ctx.db
                .query("users")
                .withIndex("by_referral_code", (q) => q.eq("referral_code", referred_by_code))
                .unique();
            if (referrer) {
                referredById = referrer._id;
            }
        }

        const userId = await ctx.db.insert("users", {
            ...userArgs,
            referred_by: referredById,
            q_score: 0,
            q_rank: "Rookie",
            wallet_balance: 0,
            boots_balance: 0,
            score_history: [],
            boots_history: [],
            penalty_history: [],
            is_admin: false,
            role: "user",
            is_verified: false,
            verification_deadline: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
            created_at: Date.now(),
        });
        return userId;
    },
});

export const verifyUser = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("verification_token", args.token))
            .unique();

        if (!user) throw new Error("Invalid token");
        if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
            throw new Error("Token expired");
        }

        await ctx.db.patch(user._id, {
            is_verified: true,
            verification_token: undefined,
            verification_token_expires: undefined,
            verification_deadline: undefined, // Clear the deadline once verified
        });
        return user._id;
    },
});

export const updatePhone = mutation({
    args: { id: v.id("users"), phone: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { phone: args.phone });
    },
});

export const login = mutation({
    args: { email: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) return { success: false, error: "Invalid credentials" };

        const now = Date.now();

        // Check if user is locked out
        if (user.lockout_until && now < user.lockout_until) {
            const minutesRemaining = Math.ceil((user.lockout_until - now) / (60 * 1000));
            return {
                success: false,
                error: `Account locked. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
                isLocked: true,
                lockoutMinutes: minutesRemaining
            };
        }

        // If lockout expired, reset the counter
        if (user.lockout_until && now >= user.lockout_until) {
            await ctx.db.patch(user._id, {
                failed_login_attempts: 0,
                lockout_until: undefined
            });
        }

        // Check if 3-day verification deadline has passed
        if (!user.is_verified && user.verification_deadline) {
            if (now > user.verification_deadline) {
                return {
                    success: false,
                    error: "Verification expired. Please check your email and verify your account to continue.",
                    requiresVerification: true
                };
            }
        }

        // Check password (in production, use bcrypt.compare)
        // For now, simple check - you should implement proper password hashing
        const isPasswordValid = user.password_hash === args.password; // Replace with bcrypt in production

        if (!isPasswordValid) {
            // Increment failed attempts
            const currentAttempts = (user.failed_login_attempts || 0) + 1;
            const maxAttempts = 5;

            if (currentAttempts >= maxAttempts) {
                // Lock out for 30 minutes
                const lockoutTime = now + (30 * 60 * 1000); // 30 minutes in ms
                await ctx.db.patch(user._id, {
                    failed_login_attempts: currentAttempts,
                    lockout_until: lockoutTime
                });

                return {
                    success: false,
                    error: `Too many failed attempts. Account locked for 30 minutes.`,
                    isLocked: true,
                    lockoutMinutes: 30
                };
            } else {
                await ctx.db.patch(user._id, {
                    failed_login_attempts: currentAttempts
                });

                const remainingAttempts = maxAttempts - currentAttempts;
                return {
                    success: false,
                    error: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before lockout.`,
                    attemptsRemaining: remainingAttempts
                };
            }
        }

        // Successful login - reset failed attempts
        const updateData: any = {
            failed_login_attempts: 0,
            lockout_until: undefined
        };

        if (user.email === 'riderezzy@gmail.com' && !user.is_admin) {
            updateData.is_admin = true;
            updateData.role = 'admin';
            user.is_admin = true;
            user.role = 'admin';
        }

        await ctx.db.patch(user._id, updateData);

        // Return user with verification status info
        return {
            success: true,
            user,
            isVerified: user.is_verified,
            verificationDeadline: user.verification_deadline,
            daysRemaining: user.verification_deadline ?
                Math.max(0, Math.ceil((user.verification_deadline - now) / (24 * 60 * 60 * 1000))) :
                null
        };
    },
});

export const adminLogin = query({
    args: { email: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (user && user.is_admin) {
            if (user.password_hash === args.password) {
                return { success: true, user };
            } else {
                return { success: false, error: "Invalid password" };
            }
        }
        return { success: false, error: "Unauthorized" };
    }
});

export const resetQScores = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            q_score: 0,
            q_rank: "Rookie",
            boots_balance: 0,
            score_history: [],
            boots_history: [],
            penalty_history: [],
        });
    },
});

export const updateReputation = mutation({
    args: {
        userId: v.id("users"),
        scoreChange: v.optional(v.number()),
        bootsChange: v.optional(v.number()),
        type: v.string(),
        description: v.string(),
        isPenalty: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await awardReputation(ctx, args.userId, {
            score: args.scoreChange || 0,
            boots: args.bootsChange || 0,
            type: args.type,
            description: args.description,
            isPenalty: args.isPenalty,
        });
        return { success: true };
    },
});

export const getAdmins = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("is_admin"), true))
            .collect();
    },
});

export const makeAdmin = mutation({
    args: { email: v.string(), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor || executor.email !== 'riderezzy@gmail.com') {
            throw new Error("Only super admin can make others admin.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) throw new Error("User not found.");

        await ctx.db.patch(user._id, { is_admin: true, role: "admin" });
        return { success: true };
    },
});

export const removeAdmin = mutation({
    args: { userId: v.id("users"), executorId: v.id("users") },
    handler: async (ctx, args) => {
        const executor = await ctx.db.get(args.executorId);
        if (!executor || executor.email !== 'riderezzy@gmail.com') {
            throw new Error("Only super admin can remove admins.");
        }

        const target = await ctx.db.get(args.userId);
        if (!target) throw new Error("User not found.");

        if (target.email === 'riderezzy@gmail.com') {
            throw new Error("Cannot remove super admin.");
        }

        await ctx.db.patch(args.userId, { is_admin: false, role: "user" });
        return { success: true };
    },
});

export const updateCard = mutation({
    args: {
        userId: v.id("users"),
        cardDetails: v.object({
            last4: v.string(),
            brand: v.string(),
            expiry: v.string(),
            auth_token: v.string(),
        })
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            direct_debit_card: args.cardDetails
        });
    },
});
