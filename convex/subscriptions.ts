import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { awardReputation } from "./reputation";

export const getActiveSubscriptions = query({
    handler: async (ctx) => {
        const subs = await ctx.db
            .query("subscriptions")
            .filter((q) => q.eq(q.field("is_active"), true))
            .collect();

        return Promise.all(
            subs.map(async (sub) => {
                const slot_types = await ctx.db
                    .query("slot_types")
                    .withIndex("by_subscription", (q) => q.eq("subscription_id", sub._id))
                    .collect();

                const slot_types_with_count = await Promise.all(
                    slot_types.map(async (st) => {
                        // Find active group for this subscription
                        const group = await ctx.db
                            .query("groups")
                            .withIndex("by_subscription", (q) => q.eq("subscription_id", sub._id))
                            .filter((q) => q.eq(q.field("status"), "active"))
                            .first();

                        let current_members = 0;
                        if (group) {
                            const slots = await ctx.db
                                .query("slots")
                                .withIndex("by_group", (q) => q.eq("group_id", group._id))
                                .filter((q) => q.eq(q.field("slot_type_id"), st._id))
                                .collect();
                            current_members = slots.length;
                        }

                        return {
                            ...st,
                            current_members,
                            owner_name: group?.plan_owner || "admin",
                            sub_name: sub.name,
                            sub_logo: sub.logo_url
                        };
                    })
                );

                return { ...sub, slot_types: slot_types_with_count };
            })
        );
    },
});

export const getSlotsByUserId = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const slots = await ctx.db
            .query("slots")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .collect();

        return Promise.all(
            slots.map(async (slot) => {
                const slotType = await ctx.db.get(slot.slot_type_id);
                const sub = slotType ? await ctx.db.get(slotType.subscription_id) : null;
                return {
                    ...slot,
                    slot_name: slotType?.name,
                    sub_name: sub?.name,
                    price: slotType?.price,
                    access_type: slotType?.access_type,
                };
            })
        );
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
        const slotType = await ctx.db.get(args.slot_type_id);

        if (!user || !slotType) throw new Error("User or Slot Type not found");

        const total_price = slotType.price;
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
        if (user.q_score < slotType.min_q_score) throw new Error("Q Score too low for this slot");

        // Find a group with space for this SPECIFIC slot type
        const groups = await ctx.db
            .query("groups")
            .withIndex("by_subscription", (q) => q.eq("subscription_id", slotType.subscription_id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        let group = null;
        for (const g of groups) {
            const existingSlotsCount = (await ctx.db
                .query("slots")
                .withIndex("by_group", (q) => q.eq("group_id", g._id))
                .filter(q => q.eq(q.field("slot_type_id"), slotType._id))
                .collect()).length;

            if (existingSlotsCount < (slotType.capacity || 5)) {
                group = g;
                break;
            }
        }

        if (!group) {
            throw new Error("No active groups have space for this slot type. Please contact support.");
        }

        // Update balances
        await ctx.db.patch(user._id, {
            wallet_balance: user.wallet_balance - coins_to_use,
            boots_balance: user.boots_balance - boots_to_use,
        });

        // Record transactions
        if (coins_to_use > 0) {
            await ctx.db.insert("transactions", {
                user_id: user._id,
                amount: coins_to_use,
                type: "payment",
                description: `Joined ${slotType.name} (Coins)`,
                created_at: Date.now(),
            });
        }

        if (boots_to_use > 0) {
            await ctx.db.insert("boot_transactions", {
                user_id: user._id,
                amount: -boots_to_use,
                type: "payment",
                description: `Joined ${slotType.name} (Boots)`,
                created_at: Date.now(),
            });
        }

        // Assign slot
        await ctx.db.insert("slots", {
            group_id: group._id,
            slot_type_id: slotType._id,
            user_id: user._id,
            status: "active",
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Award Reward for self (Join/Pay)
        await awardReputation(ctx, user._id, {
            score: 30,
            boots: 20,
            type: "payment",
            description: `Joined ${slotType.name} slot`
        });

        // Handle Referral Reward (only on first slot purchase)
        if (user.referred_by) {
            const existingSlots = await ctx.db
                .query("slots")
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

        const sub = await ctx.db.get(slotType.subscription_id);
        const subName = sub?.name || "Premium";

        let welcomeMessage = `Welcome to your ${subName} slot!\n\n`;

        switch (slotType.access_type) {
            case "code_access":
                welcomeMessage += `To get your access code:\n1. Reply to this chat to request your code\n2. Enjoy 🍿`;
                break;
            case "invite_link":
                welcomeMessage += `To join the Family Plan:\n1. We will send your invite link shortly.\n2. In the meantime, prepare the required address provided in your dashboard.\n3. Reply if you need help!`;
                break;
            case "email_invite":
                welcomeMessage += `To get your email invite:\n1. Reply to this chat with your Google email address.\n2. We will send the family invite shortly.`;
                break;
            case "login_with_code":
                welcomeMessage += `To access your account:\n1. Login using the email shown on your dashboard.\n2. Request the verification code.\n3. Reply to this chat immediately to receive the code!`;
                break;
            default:
                welcomeMessage += `To begin using your subscription:\n1. Please wait for our team to activate your account.\n2. Reply to this chat if you have any questions!`;
                break;
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
    args: { id: v.id("slots"), allocation: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { allocation: args.allocation });
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
        // Find or create the subscription row by name (case-insensitive)
        const existing = await ctx.db.query("subscriptions")
            .filter(q => q.eq(q.field("name"), args.platform_name))
            .first();

        let subscriptionId = existing?._id;
        if (!subscriptionId) {
            subscriptionId = await ctx.db.insert("subscriptions", {
                name: args.platform_name,
                description: `${args.platform_name} subscription`,
                is_active: true,
                base_cost: 0,
            });
        }

        const groupId = await ctx.db.insert("groups", {
            subscription_id: subscriptionId,
            billing_cycle_start: args.admin_renewal_date,
            status: "active",
            account_email: args.account_email,
            plan_owner: args.plan_owner,
        });

        for (const st of args.slot_types) {
            await ctx.db.insert("slot_types", {
                subscription_id: subscriptionId,
                name: st.name,
                price: st.price,
                capacity: st.capacity,
                access_type: st.access_type,
                device_limit: 1,
                downloads_enabled: st.downloads_enabled,
                min_q_score: 0,
                features: ["Premium Access", "Support Included"]
            });
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
        const slots = await ctx.db.query("slots")
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
            const sub = await ctx.db.get(group.subscription_id);
            const slots = await ctx.db.query("slots")
                .withIndex("by_group", q => q.eq("group_id", group._id))
                .collect();
            const slotTypes = await ctx.db.query("slot_types")
                .withIndex("by_subscription", q => q.eq("subscription_id", group.subscription_id))
                .collect();

            const members = await Promise.all(slots.map(async (s) => {
                const u = s.user_id ? await ctx.db.get(s.user_id) : null;
                const st = await ctx.db.get(s.slot_type_id);
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
        const netflixId = await ctx.db.insert("subscriptions", {
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
            features: [
                "Personal profile access",
                "Watch on 1 device",
                "Full 4K streaming",
                "Private watch history",
                "Can download content"
            ]
        });

        await ctx.db.insert("slot_types", {
            subscription_id: netflixId,
            name: "Netflix Download Slot",
            price: 1700,
            device_limit: 1,
            downloads_enabled: true,
            min_q_score: 0,
            capacity: 5,
            features: [
                "Download content access",
                "Limited streaming access",
                "Shared profile"
            ]
        });

        await ctx.db.insert("slot_types", {
            subscription_id: netflixId,
            name: "Netflix Streaming Slot",
            price: 1000,
            device_limit: 1,
            downloads_enabled: false,
            min_q_score: 0,
            capacity: 5,
            features: [
                "Streaming only",
                "No downloads",
                "Shared profile",
                "Standard HD quality"
            ]
        });

        // Spotify
        const spotifyId = await ctx.db.insert("subscriptions", {
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
            features: [
                "Individual Spotify account",
                "Ad-free listening",
                "Offline downloads",
                "Family plan membership"
            ]
        });

        // YouTube
        const youtubeId = await ctx.db.insert("subscriptions", {
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
            features: ["Ad-free YouTube", "YouTube Music Premium", "Offline downloads", "Background play"]
        });

        // Canva
        const canvaId = await ctx.db.insert("subscriptions", {
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
            features: ["100M+ premium assets", "Magic Resize", "Brand Kit", "Background Remover"]
        });

        // ChatGPT
        const chatgptId = await ctx.db.insert("subscriptions", {
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
            features: ["GPT-4o access", "DALL-E image generation", "Advanced Data Analysis", "Custom GPTs"]
        });
    }
});
