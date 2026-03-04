import { mutation } from "./_generated/server";

export const seed = mutation({
    handler: async (ctx) => {
        // 1. Seed Subscriptions & Slot Types
        const subCount = await ctx.db.query("subscriptions").collect();
        if (subCount.length === 0) {
            const netflixId = await ctx.db.insert("subscriptions", {
                name: "Netflix",
                description: "Premium 4K Streaming",
                base_cost: 8000,
                is_active: true,
            });
            await ctx.db.insert("slot_types", {
                subscription_id: netflixId,
                name: "Profile Slot",
                price: 2500,
                device_limit: 4,
                downloads_enabled: true,
                min_q_score: 70,
                capacity: 4,
                features: ["4K Streaming", "Unlimited Downloads", "Mobile & Tablet", "Ad-Free Experience"]
            });
            await ctx.db.insert("slot_types", {
                subscription_id: netflixId,
                name: "Download Slot",
                price: 1700,
                device_limit: 2,
                downloads_enabled: true,
                min_q_score: 50,
                capacity: 2,
                features: ["HD Streaming", "Limited Downloads", "Mobile & Tablet", "Ad-Free Experience"]
            });
            await ctx.db.insert("slot_types", {
                subscription_id: netflixId,
                name: "Streaming Slot",
                price: 1000,
                device_limit: 2,
                downloads_enabled: false,
                min_q_score: 0,
                capacity: 5,
                features: ["SD Streaming", "No Downloads", "Mobile Only", "Ad-Free Experience"]
            });

            const spotifyId = await ctx.db.insert("subscriptions", {
                name: "Spotify",
                description: "Family Plan",
                base_cost: 1500,
                is_active: true,
            });
            await ctx.db.insert("slot_types", {
                subscription_id: spotifyId,
                name: "Standard Slot",
                price: 750,
                device_limit: 1,
                downloads_enabled: true,
                min_q_score: 0,
                capacity: 6,
                features: ["Ad-Free Music", "Offline Playback", "Unlimited Skips", "Very High Quality Audio"]
            });

            const youtubeId = await ctx.db.insert("subscriptions", {
                name: "YouTube Premium",
                description: "Family Plan",
                base_cost: 1700,
                is_active: true,
            });
            await ctx.db.insert("slot_types", {
                subscription_id: youtubeId,
                name: "Standard Slot",
                price: 800,
                device_limit: 1,
                downloads_enabled: true,
                min_q_score: 0,
                capacity: 6,
                features: ["Ad-Free Videos", "Background Play", "YouTube Music Premium", "Video Downloads"]
            });
        }

        // 2. Seed Campaigns
        const campaigns = await ctx.db.query("campaigns").collect();
        // If we have campaigns with the OLD schema (missing target_goal), clear them
        const needsClear = campaigns.some(c => !c.target_goal);

        if (campaigns.length === 0 || needsClear) {
            for (const c of campaigns) {
                await ctx.db.delete(c._id);
            }

            await ctx.db.insert("campaigns", {
                name: "Easter Reward Jar",
                type: "jar",
                description: "Help fill the jar by inviting friends to join subscriptions. Every payment adds to the jar!",
                reward_type: "boots",
                reward_amount: 500,
                start_date: Date.now(),
                end_date: Date.now() + (14 * 24 * 60 * 60 * 1000),
                target_goal: 1000,
                current_progress: 150,
                status: "active",
            });
        }

        // 3. Seed Demo User
        const demoUser = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), "demo@jointheq.com"))
            .unique();
        if (!demoUser) {
            await ctx.db.insert("users", {
                email: "demo@jointheq.com",
                full_name: "Demo User",
                phone: "+2348000000000",
                q_score: 100,
                q_rank: "Explorer",
                wallet_balance: 5000,
                boots_balance: 200,
                referral_code: "DEMO123",
                is_admin: true,
                is_verified: true,
                created_at: Date.now(),
            });
        }

        return "Seeding completed";
    },
});
