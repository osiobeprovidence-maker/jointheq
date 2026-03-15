import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { awardReputation } from "./reputation";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const normalizeOwnerName = (owner?: string) => {
    const cleaned = (owner || "").trim().replace(/^@+/, "");
    return cleaned || "admin";
};

export const getActiveSubscriptions = query({
    handler: async (ctx) => {
        const subs = await ctx.db
            .query("subscription_catalog")
            .filter((q) => q.eq(q.field("is_active"), true))
            .collect();

        const result = await Promise.all(
            subs.map(async (sub) => {
                const slot_types = await ctx.db
                    .query("slot_types")
                    .withIndex("by_subscription", (q) => q.eq("subscription_id", sub._id))
                    .collect();

                // Find ALL active groups for this catalog item
                const groups = await ctx.db
                    .query("groups")
                    .withIndex("by_catalog", (q) => q.eq("subscription_catalog_id", sub._id))
                    .filter((q) => q.eq(q.field("status"), "active"))
                    .collect();

                // If no groups, still return the subscription with default values
                const slot_types_with_count = await Promise.all(
                    slot_types.map(async (st) => {
                        let total_capacity = 0;
                        let current_members = 0;
                        let open_slots = 0;
                        let owner_name = "admin";

                        // Aggregate counts across all active groups for this specific slot type
                        if (groups.length > 0) {
                            for (const group of groups) {
                                const slots = await ctx.db
                                    .query("subscription_slots")
                                    .withIndex("by_group", (q) => q.eq("group_id", group._id))
                                    .filter((q) => q.eq(q.field("slot_type_id"), st._id))
                                    .collect();

                                total_capacity += slots.length;
                                current_members += slots.filter(s => s.status === "filled").length;
                                open_slots += slots.filter(s => s.status === "open").length;
                            }

                            // Use the owner from the first group as a representative
                            const representativeGroup = groups[0];
                            owner_name = normalizeOwnerName(representativeGroup?.plan_owner);
                        }

                        return {
                            ...st,
                            total_capacity,
                            current_members,
                            open_slots,
                            owner_name,
                            sub_name: sub.name,
                            sub_logo: sub.logo_url
                        };
                    })
                );

                return { ...sub, slot_types: slot_types_with_count };
            })
        );

        return result;
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
        }));

        return [...standardSlots, ...migratedSlots];
    },
});

export const joinSlot = mutation({
    args: {
        user_id: v.id("users"),
        slot_type_id: v.id("slot_types"),
        use_boots: v.boolean(),
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
                    user_id: undefined,
                    status: "open",
                    renewal_date: undefined,
                    allocation: undefined,
                });
                return { success: true, type: "slot" };
            }
        } catch (e) {}

        // 2. Try migrated subscriptions
        try {
            const migration = await ctx.db.get(args.id);
            if (migration && (migration as any).user_id) {
                await ctx.db.delete(args.id);
                return { success: true, type: "migration" };
            }
        } catch (e) {}

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
        slot_types: v.array(v.object({
            name: v.string(),
            price: v.number(),
            capacity: v.number(),
            access_type: v.string(),
            downloads_enabled: v.boolean(),
        }))
    },
    handler: async (ctx, args) => {
        const normalizedPlanOwner = normalizeOwnerName(args.plan_owner);

        // Find or create the catalog row by name (case-insensitive)
        const existing = await ctx.db.query("subscription_catalog")
            .filter(q => q.eq(q.field("name"), args.platform_name))
            .first();

        let catalogId = existing?._id;
        if (!catalogId) {
            catalogId = await ctx.db.insert("subscription_catalog", {
                name: args.platform_name,
                description: `${args.platform_name} subscription`,
                is_active: true,
                base_cost: 0,
            });
        }

        const adminUser = await ctx.db.query("users").filter(q => q.eq(q.field("is_admin"), true)).first();

        const groupId = await ctx.db.insert("groups", {
            subscription_catalog_id: catalogId,
            billing_cycle_start: args.admin_renewal_date,
            status: "active",
            account_email: args.account_email,
            plan_owner: normalizedPlanOwner,
        });

        // PILLAR 2: Create Subscription (Account) record
        const subscriptionId = await ctx.db.insert("subscriptions", {
            owner_id: adminUser?._id ?? (catalogId as any), // Fallback
            platform: args.platform_name,
            platform_catalog_id: catalogId,
            login_email: args.account_email,
            login_password: "ADMIN_MANAGED",
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

/** Delete an entire group listing (and its slots) */
export const adminDeleteGroup = mutation({
    args: { group_id: v.id("groups") },
    handler: async (ctx, args) => {
        // Delete all slots inside this group
        const slots = await ctx.db.query("subscription_slots")
            .withIndex("by_group", q => q.eq("group_id", args.group_id))
            .collect();
        await Promise.all(slots.map(s => ctx.db.delete(s._id)));
        await ctx.db.delete(args.group_id);
    }
});

/** Get full marketplace data for admin: groups + members + slot_types for inline management */
export const getAdminMarketplace = query({
    handler: async (ctx) => {
        const groups = await ctx.db.query("groups").collect();
        return await Promise.all(groups.map(async (group) => {
            const sub = group.subscription_catalog_id ? await ctx.db.get(group.subscription_catalog_id) : null;
            const slots = await ctx.db.query("subscription_slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .collect();
            const slotTypes = await ctx.db.query("slot_types")
                .withIndex("by_subscription", q => q.eq("subscription_id", group.subscription_catalog_id))
                .collect();

            const members = await Promise.all(slots.map(async (s) => {
                const u = s.user_id ? await ctx.db.get(s.user_id) : null;
                const st = s.slot_type_id ? await ctx.db.get(s.slot_type_id) : null;
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
                ...group,
                subscription_name: sub?.name ?? "Unknown",
                member_count: slots.length,
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
