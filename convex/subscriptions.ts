import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { awardReputation } from "./reputation";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

const normalizeOwnerName = (owner?: string) => {
    const cleaned = (owner || "").trim().replace(/^@+/, "");
    return cleaned || "Unknown";
};

/**
 * Returns EACH listing as a separate item (no aggregation across listings).
 * Uses the new marketplace table for consolidated data.
 */
export const getActiveSubscriptions = query({
    handler: async (ctx) => {
        // Get marketplace listings from the new consolidated table
        const marketplaceListings = await ctx.db.query("marketplace")
            .withIndex("by_status", q => q.eq("status", "active"))
            .filter(q => q.neq(q.field("plan_owner"), "owner_listed"))
            .collect();

        const result = await Promise.all(
            marketplaceListings.map(async (listing) => {
                // Get the subscription catalog info for this listing
                const catalog = await ctx.db.get(listing.subscription_catalog_id);

                // Get slot types for this catalog
                const slotTypes = await ctx.db.query("slot_types")
                    .withIndex("by_subscription", q => q.eq("subscription_id", listing.subscription_catalog_id))
                    .collect();

                // Get slots for this listing via groups (backward compatibility)
                const allGroups = await ctx.db.query("groups")
                    .filter(q => q.eq(q.field("subscription_catalog_id"), listing.subscription_catalog_id))
                    .collect();

                const allSlots = [];
                for (const group of allGroups) {
                    const groupSlots = await ctx.db.query("subscription_slots")
                        .withIndex("by_group", q => q.eq("group_id", group._id))
                        .collect();
                    allSlots.push(...groupSlots);
                }

                // Calculate slot counts per slot type
                const slotTypesWithCount = await Promise.all(
                    slotTypes.map(async (st) => {
                        const slotsForThisType = allSlots.filter(s => s.slot_type_id === st._id);
                        const totalCapacity = slotsForThisType.length;
                        const currentMembers = slotsForThisType.filter(s => s.status === "filled").length;
                        const openSlots = slotsForThisType.filter(s => s.status === "open").length;

                        return {
                            ...st,
                            total_capacity: totalCapacity,
                            current_members: currentMembers,
                            open_slots: openSlots,
                            owner_name: listing.plan_owner,
                            sub_name: catalog?.name ?? "Unknown",
                            sub_logo: catalog?.logo_url,
                            account_email: listing.account_email,
                            billing_cycle_start: listing.billing_cycle_start,
                            slot_price: listing.slot_price,
                            owner_payout: listing.owner_payout,
                        };
                    })
                );

                // Return one entry per slot type
                return slotTypesWithCount.map(st => ({
                    ...st,
                    marketplace_id: listing._id,
                    account_email: listing.account_email,
                    billing_cycle_start: listing.billing_cycle_start,
                    plan_owner: listing.plan_owner,
                }));
            })
        );

        // Flatten the nested arrays
        return result.flat();
    },
});

export const getSlotsByUserId = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        // 1. Get standard subscription slots
        const slots = await ctx.db
            .query("subscription_slots")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();

        const standardSlots = await Promise.all(
            slots.map(async (slot) => {
                const slotType = slot.slot_type_id ? await ctx.db.get(slot.slot_type_id) : null;
                const sub = slotType ? await ctx.db.get((slotType as any).subscription_id) : null;
                return {
                    ...slot,
                    slot_name: (slotType as any)?.name,
                    sub_name: (sub as any)?.name,
                    price: (slotType as any)?.price,
                    access_type: (slotType as any)?.access_type,
                };
            })
        );

        // 2. Get migrated subscriptions
        const migrations = await ctx.db
            .query("migrated_subscriptions")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();

        const migratedSlots = migrations.map((m) => ({
            _id: m._id,
            _creationTime: m._creationTime,
            user_id: m.user_id,
            status: m.status,
            renewal_date: m.last_payment_date,
            slot_name: m.profile_name,
            sub_name: m.platform,
            price: 0, // Migrated slots might not have a set price yet
            allocation: m.assigned_group || "Pending Approval",
            access_type: "migrated",
            auto_renew: false,
        }));

        const result = [...standardSlots, ...migratedSlots].map(s => ({
            ...s,
            auto_renew: (s as any).auto_renew ?? false,
            removal_scheduled_at: (s as any).removal_scheduled_at
        }));

        return result;
    },
});

export const toggleAutoRenew = mutation({
    args: { id: v.any(), auto_renew: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { auto_renew: args.auto_renew });
    },
});

export const renewSlot = mutation({
    args: { id: v.id("subscription_slots") },
    handler: async (ctx, args) => {
        const slot = await ctx.db.get(args.id);
        if (!slot || !slot.user_id || !slot.slot_type_id) throw new Error("Slot not found or inactive");

        const user = await ctx.db.get(slot.user_id);
        const slotType = await ctx.db.get(slot.slot_type_id);
        if (!user || !slotType) throw new Error("User or Slot Type not found");

        const price = slotType.price;
        if (user.wallet_balance < price) throw new Error("Insufficient balance to renew");

        // Deduct balance
        await ctx.db.patch(user._id, {
            wallet_balance: user.wallet_balance - price
        });

        // Record transaction
        await ctx.db.insert("wallet_transactions", {
            user_id: user._id,
            amount: price,
            type: "subscription_renewal",
            status: "completed",
            source: "wallet",
            description: `Renewed ${slotType.name}`,
            created_at: Date.now(),
        });

        // Update renewal date (add 30 days)
        const currentRenewal = slot.renewal_date ? new Date(slot.renewal_date) : new Date();
        const nextRenewal = new Date(currentRenewal.getTime() + 30 * 24 * 60 * 60 * 1000);

        await ctx.db.patch(slot._id, {
            renewal_date: nextRenewal.toISOString(),
            status: "filled",
            auto_renew: true
        });

        return { success: true };
    },
});


export const joinSlot = mutation({
    args: {
        user_id: v.id("users"),
        slot_type_id: v.id("slot_types"),
        use_boots: v.boolean(),
        auto_renew: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.user_id);
        const st = await ctx.db.get(args.slot_type_id);

        if (!user || !st) throw new Error("User or Slot Type not found");
        if (!("price" in st)) throw new Error("Invalid Slot Type");

        const total_price = st.price;
        let boots_to_use = 0;
        let coins_to_use = total_price;

        if (args.use_boots) {
            boots_to_use = total_price / 2;
            coins_to_use = total_price / 2;
            if (user.boots_balance < boots_to_use) {
                throw new Error("Insufficient boot balance for 50/50 split");
            }
        }

        if (user.wallet_balance < coins_to_use) throw new Error("Insufficient coin balance");
        if (user.q_score < st.min_q_score) throw new Error("Q Score too low for this slot");

        // ALLOCATION ENGINE: Find an 'open' slot pre-generated by the system
        const groups = await ctx.db
            .query("groups")
            .withIndex("by_catalog", (q) => q.eq("subscription_catalog_id", st.subscription_id as any))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        let targetSlot = null;
        for (const g of groups) {
            const openSlot = await ctx.db
                .query("subscription_slots")
                .withIndex("by_group", (q) => q.eq("group_id", g._id))
                .filter(q =>
                    q.and(
                        q.eq(q.field("slot_type_id"), st._id),
                        q.eq(q.field("status"), "open")
                    )
                )
                .first();

            if (openSlot) {
                targetSlot = openSlot;
                break;
            }
        }

        if (!targetSlot) {
            throw new Error("No open slots found in active groups. Please contact support.");
        }

        // Update balances
        await ctx.db.patch(user._id, {
            wallet_balance: user.wallet_balance - coins_to_use,
            boots_balance: user.boots_balance - boots_to_use,
        });

        // Record transactions
        if (coins_to_use > 0) {
            await ctx.db.insert("wallet_transactions", {
                user_id: user._id,
                amount: coins_to_use,
                type: "subscription",
                status: "completed",
                source: "wallet",
                description: `Joined ${st.name} (Coins)`,
                created_at: Date.now(),
            });
        }

        if (boots_to_use > 0) {
            await ctx.db.insert("boot_transactions", {
                user_id: user._id,
                amount: -boots_to_use,
                type: "payment",
                description: `Joined ${st.name} (Boots)`,
                created_at: Date.now(),
            });
        }

        // Fill the pre-existing slot
        await ctx.db.patch(targetSlot._id, {
            user_id: user._id,
            status: "filled",
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: args.auto_renew || false,
        });

        // Award Reward for self (Join/Pay)
        await awardReputation(ctx, user._id, {
            score: 30,
            boots: 20,
            type: "payment",
            description: `Joined ${st.name} slot`
        });

        // Assign slot
        const existingSlots = await ctx.db
            .query("subscription_slots")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .collect();

        // If this is the only slot (the one we just inserted), reward the referrer
        if (existingSlots.length === 1) {
            await awardReputation(ctx, user.referred_by, {
                score: 50,
                boots: 30,
                type: "referral_reward",
                description: `Referral reward for inviting ${user.full_name}`
            });
        }

        // Auto-message logic based on access_type
        let adminUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "riderezzy@gmail.com"))
            .unique();

        if (!adminUser) {
            const anyAdmin = await ctx.db.query("users").filter((q) => q.eq(q.field("is_admin"), true)).first();
            adminUser = anyAdmin || user; // Fallback entirely, shouldn't normally happen
        }

        const sub = await ctx.db.get(st.subscription_id);
        const subName = sub?.name || "Premium";

        let welcomeMessage = `Welcome to your ${subName} slot!\n\n`;

        if (st.access_type === "code_access") {
            welcomeMessage += `To get your access code:\n1. Reply to this chat to request your code\n2. Enjoy 🍿`;
        } else if (st.access_type === "invite_link") {
            welcomeMessage += `To join the Family Plan:\n1. We will send your invite link shortly.\n2. In the meantime, prepare the required address provided in your dashboard.\n3. Reply if you need help!`;
        } else if (st.access_type === "email_invite") {
            welcomeMessage += `To get your email invite:\n1. Reply to this chat with your Google email address.\n2. We will send the family invite shortly.`;
        } else if (st.access_type === "login_with_code") {
            welcomeMessage += `To access your account:\n1. Login using the email shown on your dashboard.\n2. Request the verification code.\n3. Reply to this chat immediately to receive the code!`;
        } else {
            welcomeMessage += `To begin using your subscription:\n1. Please wait for our team to activate your account.\n2. Reply to this chat if you have any questions!`;
        }

        await ctx.db.insert("messages", {
            sender_id: adminUser._id,
            receiver_id: user._id,
            content: welcomeMessage,
            is_from_admin: true,
            created_at: Date.now(),
        });

        return { success: true };
    },
});
export const updateAllocation = mutation({
    args: { id: v.any(), allocation: v.string() },
    handler: async (ctx, args) => {
        // Try patching subscription_slots first
        try {
            await ctx.db.patch(args.id, { allocation: args.allocation });
        } catch (e) {
            // If that fails, try migrated_subscriptions (which uses assigned_group field)
            await ctx.db.patch(args.id, { assigned_group: args.allocation });
        }
    },
});

export const leaveSlot = mutation({
    args: { id: v.any() },
    handler: async (ctx, args) => {
        // 1. Try standard subscription slots
        try {
            const slot = await ctx.db.get(args.id);
            if (slot && (slot as any).user_id) {
                await ctx.db.patch(args.id, {
                    auto_renew: false,
                    status: "closing",
                });
                return { success: true, type: "slot", message: "Removal scheduled for end of cycle" };
            }
        } catch (e) { }

        // 2. Try migrated subscriptions
        try {
            const migration = await ctx.db.get(args.id);
            if (migration && (migration as any).user_id) {
                await ctx.db.patch(args.id, {
                    status: "closing"
                });
                return { success: true, type: "migration" };
            }
        } catch (e) { }

        throw new Error("Subscription not found or already removed.");
    },
});

/** Admin creates a new listing — accepts platform name as free text, auto-creates subscription row */
export const adminCreateListing = mutation({
    args: {
        platform_name: v.string(),         // e.g. "Netflix", "Spotify"
        account_email: v.string(),
        plan_owner: v.string(),
        admin_renewal_date: v.string(),
        request_id: v.optional(v.string()),
        slot_types: v.array(v.object({
            name: v.string(),
            price: v.number(),
            capacity: v.number(),
            access_type: v.string(),
            downloads_enabled: v.boolean(),
        })),
        category: v.optional(v.string()),
        login_password: v.optional(v.string()),
        base_cost: v.optional(v.number()),
        instructions_text: v.optional(v.string()),
        instructions_image_url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const normalizedPlanOwner = normalizeOwnerName(args.plan_owner);

        // Logging the request for debugging duplicate submissions
        console.log(`[adminCreateListing] platform=${args.platform_name} account=${args.account_email} request_id=${args.request_id}`);

        // Idempotency: check marketplace table first (new consolidated source)
        if (args.request_id) {
            const existingMarketplace = await ctx.db.query("marketplace")
                .withIndex("by_request_id", q => q.eq("request_id", args.request_id))
                .first();
            if (existingMarketplace) {
                console.log(`[adminCreateListing] duplicate request detected - returning existing marketplace ${existingMarketplace._id}`);
                return { success: true, marketplaceId: existingMarketplace._id };
            }

            // Also check groups for backward compatibility
            const existingByRequest = await ctx.db.query("groups")
                .filter(q => q.eq(q.field("request_id"), args.request_id))
                .first();
            if (existingByRequest) {
                console.log(`[adminCreateListing] duplicate request detected - returning existing group ${existingByRequest._id}`);
                return { success: true, groupId: existingByRequest._id };
            }
        }

        // Additional safeguard: check for an existing group with same key fields (email + owner + renewal date)
        const existingByKey = await ctx.db.query("groups")
            .filter(q => q.and(
                q.eq(q.field("account_email"), args.account_email),
                q.eq(q.field("plan_owner"), normalizedPlanOwner),
                q.eq(q.field("billing_cycle_start"), args.admin_renewal_date),
            ))
            .first();

        if (existingByKey) {
            console.log(`[adminCreateListing] existing group found by key - returning ${existingByKey._id}`);
            return { success: true, groupId: existingByKey._id };
        }

        // Find or create the catalog row by name (case-insensitive)
        const existing = await ctx.db.query("subscription_catalog")
            .filter(q => q.eq(q.field("name"), args.platform_name))
            .first();

        let catalogId = existing?._id;
        if (!catalogId) {
            catalogId = await ctx.db.insert("subscription_catalog", {
                name: args.platform_name,
                description: `${args.platform_name} subscription`,
                category: args.category || "Streaming",
                is_active: true,
                base_cost: args.base_cost || 0,
            });
        } else if (args.category || args.base_cost !== undefined) {
            await ctx.db.patch(catalogId, {
                ...(args.category && { category: args.category }),
                ...(args.base_cost !== undefined && { base_cost: args.base_cost })
            });
        }

        const adminUser = await ctx.db.query("users").filter(q => q.eq(q.field("is_admin"), true)).first();

        const groupId = await ctx.db.insert("groups", {
            subscription_catalog_id: catalogId,
            billing_cycle_start: args.admin_renewal_date,
            status: "active",
            account_email: args.account_email,
            plan_owner: normalizedPlanOwner,
            request_id: args.request_id || undefined,
        });

        // PILLAR 2: Create Subscription (Account) record
        const subscriptionId = await ctx.db.insert("subscriptions", {
            owner_id: adminUser?._id ?? (catalogId as any), // Fallback
            platform: args.platform_name,
            platform_catalog_id: catalogId,
            login_email: args.account_email,
            login_password: args.login_password || "ADMIN_MANAGED",
            base_cost: args.base_cost || 0,
            instructions_text: args.instructions_text,
            instructions_image_url: args.instructions_image_url,
            renewal_date: args.admin_renewal_date,
            total_slots: args.slot_types.reduce((a, b) => a + b.capacity, 0),
            slot_price: args.slot_types[0]?.price ?? 0,
            status: "active",
            group_id: groupId,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        for (const st of args.slot_types) {
            const slotTypeId = await ctx.db.insert("slot_types", {
                subscription_id: catalogId,
                name: st.name,
                price: st.price,
                capacity: st.capacity,
                access_type: st.access_type,
                device_limit: 1,
                downloads_enabled: st.downloads_enabled,
                min_q_score: 0,
                features: ["Premium Access"]
            });

            // PILLAR 3: Pre-generate slots for the Auto Slot Engine
            for (let i = 1; i <= st.capacity; i++) {
                await ctx.db.insert("subscription_slots", {
                    subscription_id: subscriptionId,
                    group_id: groupId,
                    slot_type_id: slotTypeId,
                    slot_number: i,
                    status: "open",
                    renewal_date: "",
                    created_at: Date.now(),
                });
            }
        }

        // PILLAR 4: Create marketplace entry for consolidated marketplace table
        const totalSlots = args.slot_types.reduce((a, b) => a + b.capacity, 0);
        const slotPrice = args.slot_types[0]?.price ?? 0;

        await ctx.db.insert("marketplace", {
            subscription_catalog_id: catalogId,
            admin_creator_id: adminUser?._id,

            platform_name: args.platform_name,
            account_email: args.account_email,
            plan_owner: normalizedPlanOwner,
            billing_cycle_start: args.admin_renewal_date,
            status: "active",

            total_slots: totalSlots,
            filled_slots: 0,
            available_slots: totalSlots,

            slot_price: slotPrice,

            category: args.category || "Streaming",
            admin_note: undefined,
            request_id: args.request_id,

            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return { success: true, groupId };
    }
});

/** Update a slot_type (price, capacity, access_type, name) */
export const adminUpdateSlotType = mutation({
    args: {
        slot_type_id: v.id("slot_types"),
        name: v.optional(v.string()),
        price: v.optional(v.number()),
        capacity: v.optional(v.number()),
        access_type: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { slot_type_id, ...patch } = args;
        const filtered = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
        await ctx.db.patch(slot_type_id, filtered);
    }
});

/** Delete an entire group/marketplace listing (and its slots) */
export const adminDeleteGroup = mutation({
    args: {
        group_id: v.id("marketplace"),
    },
    handler: async (ctx, args) => {
        // Delete from marketplace table (new consolidated source)
        const listing = await ctx.db.get(args.group_id);
        if (!listing) throw new Error("Marketplace listing not found");

        // Find and delete associated groups and slots
        const groups = await ctx.db.query("groups")
            .filter(q => q.eq(q.field("subscription_catalog_id"), listing.subscription_catalog_id))
            .collect();

        for (const group of groups) {
            const slots = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .collect();
            await Promise.all(slots.map(s => ctx.db.delete(s._id)));
            await ctx.db.delete(group._id);
        }

        // Delete the marketplace record
        await ctx.db.delete(args.group_id);
    }
});

/** Get full marketplace data for admin: uses new marketplace table */
export const getAdminMarketplace = query({
    handler: async (ctx) => {
        // Use the new marketplace table as the primary source
        const listings = await ctx.db.query("marketplace").collect();

        return await Promise.all(listings.map(async (listing) => {
            const catalog = listing.subscription_catalog_id ? await ctx.db.get(listing.subscription_catalog_id) : null;
            const owner = listing.owner_user_id ? await ctx.db.get(listing.owner_user_id) : null;
            const admin = listing.admin_creator_id ? await ctx.db.get(listing.admin_creator_id) : null;

            // Get slots via groups (backward compatibility)
            const allGroups = await ctx.db.query("groups")
                .filter(q => q.eq(q.field("subscription_catalog_id"), listing.subscription_catalog_id))
                .collect();

            const allSlots = [];
            for (const group of allGroups) {
                const groupSlots = await ctx.db.query("subscription_slots")
                    .withIndex("by_group", q => q.eq("group_id", group._id))
                    .collect();
                allSlots.push(...groupSlots);
            }

            const slotTypes = await ctx.db.query("slot_types")
                .withIndex("by_subscription", q => q.eq("subscription_id", listing.subscription_catalog_id))
                .collect();

            const members = await Promise.all(allSlots.map(async (s) => {
                const u: Doc<"users"> | null = s.user_id
                    ? await ctx.db.get(s.user_id as Id<"users">)
                    : null;
                const st: Doc<"slot_types"> | null = s.slot_type_id
                    ? await ctx.db.get(s.slot_type_id as Id<"slot_types">)
                    : null;
                return {
                    slot_id: s._id,
                    user_name: u?.full_name ?? "Empty Slot",
                    user_id: s.user_id,
                    slot_name: st?.name ?? "Unknown",
                    slot_type_id: s.slot_type_id,
                    renewal: s.renewal_date,
                };
            }));

            return {
                ...listing,
                subscription_name: catalog?.name ?? "Unknown",
                platform_description: catalog?.description,
                platform_logo: catalog?.logo_url,
                owner_name: owner?.full_name,
                owner_email: owner?.email,
                admin_name: admin?.full_name,
                member_count: allSlots.length,
                members,
                slot_types: slotTypes,
            };
        }));
    }
});


export const seedMarketplace = mutation({
    handler: async (ctx) => {
        // Netflix
        const netflixId = await ctx.db.insert("subscription_catalog", {
            name: "Netflix",
            description: "Stream your favorite movies and shows",
            is_active: true,
            category: "Streaming",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: netflixId,
            name: "Netflix Premium Profile Slot",
            price: 2500,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 5,
            access_type: "login_with_code",
            features: ["Personal profile access", "Watch on 1 device"]
        });

        // Spotify
        const spotifyId = await ctx.db.insert("subscription_catalog", {
            name: "Spotify",
            description: "Music for everyone",
            is_active: true,
            category: "Music",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: spotifyId,
            name: "Spotify Family Standard Slot",
            price: 750,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 6,
            access_type: "email_invite",
            features: ["Ad-free listening", "Offline downloads"]
        });

        // YouTube
        const youtubeId = await ctx.db.insert("subscription_catalog", {
            name: "YouTube",
            description: "Ad-free videos and music",
            is_active: true,
            category: "Streaming",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: youtubeId,
            name: "YouTube Premium Slot",
            price: 1100,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 6,
            access_type: "email_invite",
            features: ["Ad-free YouTube", "Background play"]
        });

        // Canva
        const canvaId = await ctx.db.insert("subscription_catalog", {
            name: "Canva",
            description: "Design anything",
            is_active: true,
            category: "Design",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_logo_2021.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: canvaId,
            name: "Canva Pro Team Slot",
            price: 1500,
            device_limit: 5,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 5,
            access_type: "email_invite",
            features: ["Premium assets", "Background Remover"]
        });

        // ChatGPT
        const chatgptId = await ctx.db.insert("subscription_catalog", {
            name: "ChatGPT",
            description: "The most capable AI",
            is_active: true,
            category: "AI",
            base_cost: 0,
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
        });

        await ctx.db.insert("slot_types", {
            subscription_id: chatgptId,
            name: "ChatGPT Plus Slot",
            price: 3500,
            device_limit: 1,
            downloads_enabled: false,
            min_q_score: 0,
            capacity: 2,
            access_type: "login_with_code",
            features: ["GPT-4o access", "DALL-E"]
        });
    }
});
