import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { awardReputation } from "./reputation";
import bcrypt from "bcryptjs";

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

export const getByUsername = query({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
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
        username: v.string(),
        phone: v.optional(v.string()),
        password_hash: v.string(),
        verification_token: v.string(),
        verification_token_expires: v.string(),
        referral_code: v.optional(v.string()),
        referred_by_code: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.trim().toLowerCase();
        const normalizedPhone = args.phone?.trim();
        const normalizedReferredByCode = args.referred_by_code?.trim().toUpperCase();

        const referralBase = (
            args.full_name.split(" ")[0] ||
            normalizedEmail.split("@")[0] ||
            "USER"
        )
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 10) || "USER";

        const sanitizeReferralCode = (code: string) =>
            code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

        const buildFallbackReferralCode = () =>
            `Q-${referralBase}-${Math.floor(100000 + Math.random() * 900000)}`;

        // Check for duplicate email
        const existingEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .unique();
        if (existingEmail) {
            throw new Error("Email already registered");
        }

        // Check for duplicate phone if provided
        if (normalizedPhone) {
            const existingPhone = await ctx.db
                .query("users")
                .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
                .unique();
            if (existingPhone) {
                throw new Error("Phone number already registered");
            }
        }

        // Resolve a unique referral code server-side to avoid signup failures from collisions.
        let resolvedReferralCode = args.referral_code
            ? sanitizeReferralCode(args.referral_code)
            : buildFallbackReferralCode();

        let referralCollisionChecks = 0;
        while (referralCollisionChecks < 10) {
            const existingReferral = await ctx.db
                .query("users")
                .withIndex("by_referral_code", (q) => q.eq("referral_code", resolvedReferralCode))
                .unique();

            if (!existingReferral) {
                break;
            }

            resolvedReferralCode = buildFallbackReferralCode();
            referralCollisionChecks += 1;
        }

        if (referralCollisionChecks >= 10) {
            throw new Error("Unable to generate referral code. Please try again.");
        }

        // Check for duplicate username
        const normalizedUsername = args.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!normalizedUsername || normalizedUsername.length < 3) {
            throw new Error("Username must be at least 3 characters (letters, numbers, underscores only)");
        }
        const existingUsername = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
            .unique();
        if (existingUsername) {
            throw new Error("Username already taken — try another");
        }

        let referredById: any = undefined;
        if (normalizedReferredByCode) {
            const referrer = await ctx.db
                .query("users")
                .withIndex("by_referral_code", (q) => q.eq("referral_code", normalizedReferredByCode))
                .unique();
            if (referrer) {
                referredById = referrer._id;
            }
        }

        const userId = await ctx.db.insert("users", {
            email: normalizedEmail,
            full_name: args.full_name,
            phone: normalizedPhone,
            verification_token: args.verification_token,
            verification_token_expires: args.verification_token_expires,
            referral_code: resolvedReferralCode,
            password_hash: bcrypt.hashSync(args.password_hash, 10),
            username: normalizedUsername,
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
            verification_deadline: Date.now() + 3 * 24 * 60 * 60 * 1000,
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
    args: { identifier: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        // Try to find by email first
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.identifier.toLowerCase()))
            .unique();

        // If not found, try by username
        if (!user) {
            user = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", args.identifier.toLowerCase()))
                .unique();
        }

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

        // Check password using bcrypt with fallback for plain text
        let isPasswordValid = false;
        if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
            isPasswordValid = bcrypt.compareSync(args.password, user.password_hash);
        } else {
            // Fallback for plain text passwords
            isPasswordValid = user.password_hash === args.password;
            // Upgrade password to hash if it was plain text and valid
            if (isPasswordValid) {
                await ctx.db.patch(user._id, {
                    password_hash: bcrypt.hashSync(args.password, 10)
                });
            }
        }

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
    args: { identifier: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        // Try to find by email first
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.identifier.toLowerCase()))
            .unique();

        // If not found, try by username
        if (!user) {
            user = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", args.identifier.toLowerCase()))
                .unique();
        }

        if (user && user.is_admin) {
            let isPasswordValid = false;
            if (user.password_hash?.startsWith("$2a$") || user.password_hash?.startsWith("$2b$")) {
                isPasswordValid = bcrypt.compareSync(args.password, user.password_hash);
            } else {
                isPasswordValid = user.password_hash === args.password;
            }

            if (isPasswordValid) {
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

export const updateUsername = mutation({
    args: { userId: v.id("users"), username: v.string() },
    handler: async (ctx, args) => {
        const normalized = args.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!normalized || normalized.length < 3) {
            throw new Error("Username must be at least 3 characters (letters, numbers, underscores)");
        }
        if (normalized.length > 30) {
            throw new Error("Username cannot exceed 30 characters");
        }
        const existing = await ctx.db
            .query("users")
            .withIndex("by_username", q => q.eq("username", normalized))
            .unique();
        if (existing && existing._id !== args.userId) {
            throw new Error("Username already taken — try another");
        }
        await ctx.db.patch(args.userId, { username: normalized });
        return { username: normalized };
    },
});

export const updateProfile = mutation({
    args: { userId: v.id("users"), full_name: v.optional(v.string()), university: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const { userId, ...patch } = args;
        await ctx.db.patch(userId, patch);
        return { success: true };
    },
});

export const getCampusRep = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("campus_reps")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .unique();
    },
});

