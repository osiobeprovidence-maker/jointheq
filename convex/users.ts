import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { awardReputation } from "./reputation";
import bcrypt from "bcryptjs";

const MAX_SIGN_IN_HISTORY = 10;

function normalizeSignInProvider(provider: string | undefined) {
    const value = provider?.trim().toLowerCase();
    if (!value) return "password";
    if (value === "email" || value === "password") return "password";
    return value;
}

function buildSignInTrackingPatch(
    user: { sign_in_history?: Array<{ provider: string; signed_in_at: number }> } | null,
    provider: string,
    signedInAt: number,
) {
    const normalizedProvider = normalizeSignInProvider(provider);
    const previousHistory = Array.isArray(user?.sign_in_history) ? user.sign_in_history : [];

    return {
        last_sign_in_at: signedInAt,
        last_sign_in_provider: normalizedProvider,
        sign_in_history: [
            { provider: normalizedProvider, signed_in_at: signedInAt },
            ...previousHistory,
        ].slice(0, MAX_SIGN_IN_HISTORY),
    };
}

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
        const invitedUsers = await ctx.db
            .query("users")
            .withIndex("by_referred_by", (q) => q.eq("referred_by", args.userId))
            .order("desc")
            .collect();

        return await Promise.all(
            invitedUsers.map(async (invitedUser) => {
                const completedPayments = await ctx.db
                    .query("wallet_transactions")
                    .withIndex("by_user", (q) => q.eq("user_id", invitedUser._id))
                    .collect();

                const firstCompletedSubscriptionPayment = completedPayments
                    .filter(
                        (transaction) =>
                            transaction.status === "completed" &&
                            (transaction.type === "subscription" || transaction.type === "subscription_renewal")
                    )
                    .sort((a, b) => a.created_at - b.created_at)[0];

                return {
                    ...invitedUser,
                    has_first_payment: !!firstCompletedSubscriptionPayment,
                    first_payment_at: firstCompletedSubscriptionPayment?.created_at,
                };
            })
        );
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
            let referrer = await ctx.db
                .query("users")
                .withIndex("by_referral_code", (q) => q.eq("referral_code", normalizedReferredByCode))
                .unique();

            if (!referrer) {
                const normalizedReferralUsername = normalizedReferredByCode
                    .toLowerCase()
                    .replace(/^@+/, "")
                    .replace(/[^a-z0-9_]/g, "");

                if (normalizedReferralUsername) {
                    referrer = await ctx.db
                        .query("users")
                        .withIndex("by_username", (q) => q.eq("username", normalizedReferralUsername))
                        .unique();
                }
            }

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
            sign_in_history: [],
        });
        return userId;
    },
});

export const verifyUser = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        // Guard: token must be a non-empty string
        const trimmedToken = args.token?.trim();
        if (!trimmedToken) {
            return { success: false, error: "missing_token", message: "Verification token is missing." };
        }

        // Look up user by verification token
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("verification_token", trimmedToken))
            .unique();

        // Token not found — could be already verified (token was cleared) or never valid
        if (!user) {
            // Check if a user with this token was already verified (idempotent success)
            // We can't look them up by token since it's cleared, so just return a
            // friendly already-verified message. The frontend handles this gracefully.
            return { success: false, error: "invalid_token", message: "This verification link is invalid or has already been used. If your account is already verified, please log in." };
        }

        // Token already consumed (is_verified true but token somehow still present)
        if (user.is_verified) {
            // Clear any leftover token fields and return success
            await ctx.db.patch(user._id, {
                verification_token: undefined,
                verification_token_expires: undefined,
                verification_deadline: undefined,
            });
            return { success: true, userId: user._id, alreadyVerified: true };
        }

        // Check if token has expired
        if (user.verification_token_expires) {
            const expiry = new Date(user.verification_token_expires);
            if (expiry < new Date()) {
                return { success: false, error: "token_expired", message: "This verification link has expired. Please sign up again or request a new verification email." };
            }
        }

        // All checks passed — verify the user
        await ctx.db.patch(user._id, {
            is_verified: true,
            verification_token: undefined,
            verification_token_expires: undefined,
            verification_deadline: undefined,
        });

        return { success: true, userId: user._id, alreadyVerified: false };
    },
});

export const requestPasswordReset = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.trim().toLowerCase();
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .unique();

        if (!user) {
            return { success: true };
        }

        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = Date.now() + 60 * 60 * 1000;

        await ctx.db.patch(user._id, {
            reset_password_token: token,
            reset_password_token_expires: expiresAt,
        });

        return {
            success: true,
            email: user.email,
            name: user.full_name,
            token,
        };
    },
});

export const validatePasswordResetToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const trimmedToken = args.token?.trim();
        if (!trimmedToken) {
            return { valid: false, message: "Reset link is missing." };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_reset_password_token", (q) => q.eq("reset_password_token", trimmedToken))
            .unique();

        if (!user) {
            return { valid: false, message: "This reset link is invalid or has already been used." };
        }

        if (!user.reset_password_token_expires || user.reset_password_token_expires < Date.now()) {
            return { valid: false, message: "This reset link has expired. Request a new one to continue." };
        }

        return {
            valid: true,
            email: user.email,
        };
    },
});

export const resetPassword = mutation({
    args: {
        token: v.string(),
        new_password: v.string(),
    },
    handler: async (ctx, args) => {
        const trimmedToken = args.token?.trim();
        const trimmedPassword = args.new_password?.trim();

        if (!trimmedToken) {
            return { success: false, error: "Reset link is missing." };
        }

        if (!trimmedPassword || trimmedPassword.length < 6) {
            return { success: false, error: "Password must be at least 6 characters." };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_reset_password_token", (q) => q.eq("reset_password_token", trimmedToken))
            .unique();

        if (!user) {
            return { success: false, error: "This reset link is invalid or has already been used." };
        }

        if (!user.reset_password_token_expires || user.reset_password_token_expires < Date.now()) {
            await ctx.db.patch(user._id, {
                reset_password_token: undefined,
                reset_password_token_expires: undefined,
            });
            return { success: false, error: "This reset link has expired. Request a new one to continue." };
        }

        await ctx.db.patch(user._id, {
            password_hash: bcrypt.hashSync(trimmedPassword, 10),
            reset_password_token: undefined,
            reset_password_token_expires: undefined,
            failed_login_attempts: 0,
            lockout_until: undefined,
        });

        return { success: true };
    },
});

export const updatePhone = mutation({
    args: { id: v.id("users"), phone: v.string() },
    handler: async (ctx, args) => {
        const normalizedPhone = args.phone.trim();
        if (!normalizedPhone) {
            throw new Error("Phone number is required");
        }

        const existingPhone = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
            .unique();

        if (existingPhone && existingPhone._id !== args.id) {
            throw new Error("Phone number already registered");
        }

        await ctx.db.patch(args.id, { phone: normalizedPhone });
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
        if (!user.password_hash) {
            return { success: false, error: "Invalid credentials" };
        }
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
            lockout_until: undefined,
            ...buildSignInTrackingPatch(user, "password", now),
        };

        if (user.email === 'riderezzy@gmail.com' && !user.is_admin) {
            updateData.is_admin = true;
            updateData.role = 'admin';
            user.is_admin = true;
            user.role = 'admin';
        }

        await ctx.db.patch(user._id, updateData);

        const updatedUser = await ctx.db.get(user._id);

        // Return user with verification status info
        return {
            success: true,
            user: updatedUser ?? { ...user, ...updateData },
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

export const removeCard = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            direct_debit_card: undefined
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
    args: {
        userId: v.id("users"),
        full_name: v.optional(v.string()),
        university: v.optional(v.string()),
        profile_image_url: v.optional(v.string())
    },
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

/**
 * Cleanup duplicate users and fix invalid data
 * Only callable by super admin
 */
export const cleanupDuplicates = mutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();

        // Find and delete duplicate admin@jointheq.sbs (keep the oldest)
        const adminUsers = users
            .filter(u => u.email === "admin@jointheq.sbs")
            .sort((a, b) => a.created_at - b.created_at);

        let deletedCount = 0;
        if (adminUsers.length > 1) {
            // Delete all but the first (oldest) one
            for (let i = 1; i < adminUsers.length; i++) {
                await ctx.db.delete(adminUsers[i]._id);
                deletedCount++;
            }
        }

        // Fix demo@jointheq.sbs - add missing role field
        const demoUser = users.find(u => u.email === "demo@jointheq.sbs");
        let fixedCount = 0;
        if (demoUser && !demoUser.role) {
            await ctx.db.patch(demoUser._id, { role: "user" });
            fixedCount++;
        }

        // Fix any other users with missing role
        const usersMissingRole = users.filter(u => !u.role && u.email !== "demo@jointheq.sbs");
        for (const user of usersMissingRole) {
            await ctx.db.patch(user._id, { role: "user" });
            fixedCount++;
        }

        return {
            success: true,
            deleted_duplicates: deletedCount,
            fixed_missing_role: fixedCount,
        };
    },
});

export const socialLogin = mutation({
    args: { 
        email: v.string(), 
        full_name: v.string(),
        provider: v.string(), 
        provider_id: v.string(),
        profile_image_url: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.trim().toLowerCase();
        
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .unique();

        if (user) {
            // Check if locked out
            const now = Date.now();
            if (user.lockout_until && now < user.lockout_until) {
                const minutesRemaining = Math.ceil((user.lockout_until - now) / (60 * 1000));
                return {
                    success: false,
                    error: `Account locked. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
                    isLocked: true,
                    lockoutMinutes: minutesRemaining
                };
            }

            // Update if necessary
            const updates: any = {
                failed_login_attempts: 0,
                lockout_until: undefined,
                is_verified: true, // Social logins are verified by definition
                ...buildSignInTrackingPatch(user, args.provider, now),
            };
            
            if (args.profile_image_url && !user.profile_image_url) {
                updates.profile_image_url = args.profile_image_url;
            }

            await ctx.db.patch(user._id, updates);

            // Fetch the updated user
            user = await ctx.db.get(user._id);
            
            return {
                success: true,
                user,
                isVerified: true
            };
        }

        // Create new user for social login
        const referralBase = (
            args.full_name.split(" ")[0] ||
            normalizedEmail.split("@")[0] ||
            "USER"
        )
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 10) || "USER";

        const buildFallbackReferralCode = () =>
            `Q-${referralBase}-${Math.floor(100000 + Math.random() * 900000)}`;

        let resolvedReferralCode = buildFallbackReferralCode();
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

        const usernameBase = (args.full_name || normalizedEmail.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 20);
        const username = `${usernameBase || "user"}${Math.floor(100 + Math.random() * 900)}`;

        const userId = await ctx.db.insert("users", {
            email: normalizedEmail,
            full_name: args.full_name,
            profile_image_url: args.profile_image_url,
            referral_code: resolvedReferralCode,
            username: username,
            q_score: 0,
            q_rank: "Rookie",
            wallet_balance: 0,
            boots_balance: 0,
            score_history: [],
            boots_history: [],
            penalty_history: [],
            is_admin: false,
            role: "user",
            is_verified: true, // Social login means verified email
            created_at: Date.now(),
            last_sign_in_at: Date.now(),
            last_sign_in_provider: normalizeSignInProvider(args.provider),
            sign_in_history: [
                {
                    provider: normalizeSignInProvider(args.provider),
                    signed_in_at: Date.now(),
                },
            ],
        });
        
        const newUser = await ctx.db.get(userId);
        return { success: true, user: newUser, isVerified: true };
    },
});

