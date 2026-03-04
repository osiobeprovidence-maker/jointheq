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
            });
            await ctx.db.insert("slot_types", {
                subscription_id: netflixId,
                name: "Download Slot",
                price: 1700,
                device_limit: 2,
                downloads_enabled: true,
                min_q_score: 50,
            });
            await ctx.db.insert("slot_types", {
                subscription_id: netflixId,
                name: "Streaming Slot",
                price: 1000,
                device_limit: 2,
                downloads_enabled: false,
                min_q_score: 0,
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
            });
        }

        // 2. Seed Campaigns
        const campCount = await ctx.db.query("campaigns").collect();
        if (campCount.length === 0) {
            await ctx.db.insert("campaigns", {
                name: "Easter Jar 🌸",
                description: "Grow your Easter Jar by inviting friends. Earn 100 Boots per qualified referral.",
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                reward_formula: "100_per_referral",
                boot_pool_max: 500000,
                boots_issued: 0,
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
                q_score: 85,
                consistency_score: 90,
                timeliness_score: 80,
                stability_score: 95,
                wallet_balance: 5000,
                boot_balance: 200,
                referral_code: "DEMO123",
                is_admin: true,
                is_verified: true,
                created_at: Date.now(),
            });
        }

        return "Seeding completed";
    },
});
