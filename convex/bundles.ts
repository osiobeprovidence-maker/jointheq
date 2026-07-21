import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function requireAdmin(ctx: MutationCtx | QueryCtx, adminId: Id<"users">) {
    const admin = await ctx.db.get(adminId);
    if (!admin?.is_admin) throw new Error("Unauthorized");
    return admin;
}

/** Admin: get all bundles (regardless of status) */
export const getAllBundles = query({
    args: { adminId: v.id("users") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.adminId);
        const catalogs = await ctx.db.query("subscription_catalog")
            .filter(q => q.eq(q.field("is_bundle"), true))
            .collect();

        const results = [];
        for (const c of catalogs) {
            const marketplaceEntry = await ctx.db.query("marketplace")
                .withIndex("by_catalog", q => q.eq("subscription_catalog_id", c._id))
                .first();
            results.push({
                ...c,
                catalog_id: c._id,
                marketplace_id: marketplaceEntry?._id,
                marketplace_status: marketplaceEntry?.status,
                slot_price: marketplaceEntry?.slot_price,
                subscriber_count: marketplaceEntry?.filled_slots ?? 0,
            });
        }

        // Sort by display_order, then by name
        results.sort((a, b) => {
            const ao = (a.display_order ?? 999);
            const bo = (b.display_order ?? 999);
            if (ao !== bo) return ao - bo;
            return (a.name || "").localeCompare(b.name || "");
        });

        return results;
    },
});

/** Public: get only published, public, active bundles for marketplace */
export const getPublishedBundles = query({
    handler: async (ctx) => {
        const catalogs = await ctx.db.query("subscription_catalog")
            .filter(q => q.and(
                q.eq(q.field("is_bundle"), true),
                q.eq(q.field("is_active"), true),
            ))
            .collect();

        const results = [];
        for (const c of catalogs) {
            const status = (c as any).bundle_status ?? "published";
            const visibility = (c as any).visibility ?? "public";
            if (status !== "published" || visibility !== "public") continue;

            const marketplaceEntry = await ctx.db.query("marketplace")
                .withIndex("by_catalog", q => q.eq("subscription_catalog_id", c._id))
                .first();
            if (!marketplaceEntry || marketplaceEntry.status !== "active") continue;

            // Check expiry
            const expiry = (c as any).expiry_date;
            if (expiry && Date.now() > expiry) continue;

            // Check launch date
            const launch = (c as any).launch_date;
            if (launch && Date.now() < launch) continue;

            results.push({
                _id: c._id,
                catalog_id: c._id,
                marketplace_id: marketplaceEntry._id,
                name: c.name,
                description: c.description,
                tagline: (c as any).tagline ?? undefined,
                price: c.base_cost,
                original_price: (c as any).original_price ?? undefined,
                bundle_tools: (c as any).bundle_tools ?? undefined,
                launch_badge: (c as any).launch_badge ?? undefined,
                banner_image: (c as any).banner_image ?? undefined,
                thumbnail: (c as any).thumbnail ?? undefined,
                badges: (c as any).badges ?? undefined,
                slug: (c as any).slug ?? undefined,
                currency: (c as any).currency ?? "NGN",
                display_order: (c as any).display_order ?? 0,
                featured: (c as any).featured ?? false,
                is_active: c.is_active,
                price_per_slot: marketplaceEntry.price_per_slot,
                included_subscriptions: (marketplaceEntry as any).included_subscriptions ?? [],
            });
        }

        results.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        return results;
    },
});

/** Admin: get a single bundle by catalog_id */
export const getBundleById = query({
    args: { adminId: v.id("users"), catalogId: v.id("subscription_catalog") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.adminId);
        const catalog = await ctx.db.get(args.catalogId);
        if (!catalog || !catalog.is_bundle) throw new Error("Bundle not found");

        const marketplaceEntry = await ctx.db.query("marketplace")
            .withIndex("by_catalog", q => q.eq("subscription_catalog_id", args.catalogId))
            .first();

        return { ...catalog, marketplace: marketplaceEntry ?? undefined };
    },
});

/** Admin: create a new bundle (draft by default) */
export const adminCreateBundle = mutation({
    args: {
        adminId: v.id("users"),
        name: v.string(),
        description: v.string(),
        tagline: v.optional(v.string()),
        price: v.number(),
        original_price: v.optional(v.number()),
        bundle_tools: v.optional(v.array(v.object({
            name: v.string(),
            icon: v.optional(v.string()),
        }))),
        banner_image: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        slug: v.optional(v.string()),
        currency: v.optional(v.string()),
        display_order: v.optional(v.number()),
        badges: v.optional(v.array(v.string())),
        bundle_status: v.optional(v.string()),
        visibility: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        launch_date: v.optional(v.number()),
        expiry_date: v.optional(v.number()),
        is_active: v.optional(v.boolean()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx, args.adminId);
        const slug = args.slug || args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const bundleStatus = args.bundle_status || "draft";

        const catalogId = await ctx.db.insert("subscription_catalog", {
            name: args.name,
            description: args.description,
            category: args.category || "AI",
            is_active: bundleStatus === "published",
            base_cost: args.price,
            is_bundle: true,
            original_price: args.original_price,
            launch_badge: args.badges?.[0],
            tagline: args.tagline,
            bundle_tools: args.bundle_tools || [],
            banner_image: args.banner_image,
            thumbnail: args.thumbnail,
            slug,
            currency: args.currency || "NGN",
            display_order: args.display_order ?? 0,
            badges: args.badges || [],
            bundle_status: bundleStatus,
            visibility: args.visibility || "public",
            featured: args.featured ?? false,
            launch_date: args.launch_date,
            expiry_date: args.expiry_date,
        } as any);

        if (bundleStatus === "published") {
            const toolNames = (args.bundle_tools || []).map(t => t.name);
            await ctx.db.insert("marketplace", {
                subscription_catalog_id: catalogId,
                admin_creator_id: args.adminId,
                type: "pack",
                pack_name: args.name,
                pack_description: args.description,
                included_subscriptions: toolNames,
                price_per_slot: args.price,
                platform_name: args.name,
                account_email: "bundle@jointheq.sbs",
                plan_owner: "admin",
                billing_cycle_start: new Date().toISOString().slice(0, 10),
                status: "active",
                total_slots: 99999,
                filled_slots: 0,
                available_slots: 99999,
                slot_price: args.price,
                category: args.category || "AI",
                display_order: args.display_order ?? 0,
                created_at: Date.now(),
                updated_at: Date.now(),
            });
        }

        return { success: true, catalogId };
    },
});

/** Admin: update an existing bundle */
export const adminUpdateBundle = mutation({
    args: {
        adminId: v.id("users"),
        catalogId: v.id("subscription_catalog"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        tagline: v.optional(v.string()),
        price: v.optional(v.number()),
        original_price: v.optional(v.number()),
        bundle_tools: v.optional(v.array(v.object({
            name: v.string(),
            icon: v.optional(v.string()),
        }))),
        banner_image: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        slug: v.optional(v.string()),
        currency: v.optional(v.string()),
        display_order: v.optional(v.number()),
        badges: v.optional(v.array(v.string())),
        bundle_status: v.optional(v.string()),
        visibility: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        launch_date: v.optional(v.number()),
        expiry_date: v.optional(v.number()),
        is_active: v.optional(v.boolean()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx, args.adminId);
        const catalog = await ctx.db.get(args.catalogId);
        if (!catalog || !catalog.is_bundle) throw new Error("Bundle not found");

        const patch: Record<string, any> = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.description !== undefined) patch.description = args.description;
        if (args.tagline !== undefined) patch.tagline = args.tagline;
        if (args.price !== undefined) patch.base_cost = args.price;
        if (args.original_price !== undefined) patch.original_price = args.original_price;
        if (args.bundle_tools !== undefined) patch.bundle_tools = args.bundle_tools;
        if (args.banner_image !== undefined) patch.banner_image = args.banner_image;
        if (args.thumbnail !== undefined) patch.thumbnail = args.thumbnail;
        if (args.slug !== undefined) patch.slug = args.slug;
        if (args.currency !== undefined) patch.currency = args.currency;
        if (args.display_order !== undefined) patch.display_order = args.display_order;
        if (args.badges !== undefined) {
            patch.badges = args.badges;
            patch.launch_badge = args.badges[0] ?? undefined;
        }
        if (args.bundle_status !== undefined) patch.bundle_status = args.bundle_status;
        if (args.visibility !== undefined) patch.visibility = args.visibility;
        if (args.featured !== undefined) patch.featured = args.featured;
        if (args.launch_date !== undefined) patch.launch_date = args.launch_date;
        if (args.expiry_date !== undefined) patch.expiry_date = args.expiry_date;
        if (args.is_active !== undefined) patch.is_active = args.is_active;
        if (args.category !== undefined) patch.category = args.category;

        // Sync is_active with bundle_status
        if (args.bundle_status !== undefined) {
            patch.is_active = args.bundle_status === "published";
        }

        await ctx.db.patch(args.catalogId, patch as any);

        // Sync marketplace entry
        const marketplaceEntry = await ctx.db.query("marketplace")
            .withIndex("by_catalog", q => q.eq("subscription_catalog_id", args.catalogId))
            .first();

        const isPublished = (args.bundle_status ?? (catalog as any).bundle_status ?? "draft") === "published";
        const toolNames = (args.bundle_tools ?? (catalog as any).bundle_tools ?? []).map((t: any) => t.name);
        const currentName = args.name ?? catalog.name;
        const currentPrice = args.price ?? catalog.base_cost;
        const currentCategory = args.category ?? catalog.category ?? "AI";

        if (isPublished && !marketplaceEntry) {
            await ctx.db.insert("marketplace", {
                subscription_catalog_id: args.catalogId,
                admin_creator_id: args.adminId,
                type: "pack",
                pack_name: currentName,
                pack_description: args.description ?? catalog.description,
                included_subscriptions: toolNames,
                price_per_slot: currentPrice,
                platform_name: currentName,
                account_email: "bundle@jointheq.sbs",
                plan_owner: "admin",
                billing_cycle_start: new Date().toISOString().slice(0, 10),
                status: "active",
                total_slots: 99999,
                filled_slots: 0,
                available_slots: 99999,
                slot_price: currentPrice,
                category: currentCategory,
                display_order: args.display_order ?? (catalog as any).display_order ?? 0,
                created_at: Date.now(),
                updated_at: Date.now(),
            });
        } else if (!isPublished && marketplaceEntry) {
            await ctx.db.delete(marketplaceEntry._id);
        } else if (marketplaceEntry) {
            const mpPatch: Record<string, any> = { updated_at: Date.now() };
            if (args.name !== undefined) { mpPatch.pack_name = args.name; mpPatch.platform_name = args.name; }
            if (args.description !== undefined) mpPatch.pack_description = args.description;
            if (args.bundle_tools !== undefined) mpPatch.included_subscriptions = toolNames;
            if (args.price !== undefined) { mpPatch.price_per_slot = args.price; mpPatch.slot_price = args.price; }
            if (args.category !== undefined) mpPatch.category = args.category;
            if (args.display_order !== undefined) mpPatch.display_order = args.display_order;
            await ctx.db.patch(marketplaceEntry._id, mpPatch as any);
        }

        return { success: true };
    },
});

/** Admin: delete a bundle */
export const adminDeleteBundle = mutation({
    args: { adminId: v.id("users"), catalogId: v.id("subscription_catalog") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.adminId);
        const catalog = await ctx.db.get(args.catalogId);
        if (!catalog || !catalog.is_bundle) throw new Error("Bundle not found");

        const marketplaceEntry = await ctx.db.query("marketplace")
            .withIndex("by_catalog", q => q.eq("subscription_catalog_id", args.catalogId))
            .first();

        if (marketplaceEntry) await ctx.db.delete(marketplaceEntry._id);
        await ctx.db.delete(args.catalogId);
        return { success: true };
    },
});

/** Admin: duplicate a bundle */
export const adminDuplicateBundle = mutation({
    args: { adminId: v.id("users"), catalogId: v.id("subscription_catalog") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.adminId);
        const catalog = await ctx.db.get(args.catalogId);
        if (!catalog || !catalog.is_bundle) throw new Error("Bundle not found");

        const newName = `${catalog.name} (Copy)`;
        const catalogId = await ctx.db.insert("subscription_catalog", {
            ...catalog,
            _id: undefined as any,
            _creationTime: undefined as any,
            name: newName,
            is_active: false,
            bundle_status: "draft",
            featured: false,
            slug: ((catalog as any).slug ?? catalog.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) + "-copy",
        } as any);

        return { success: true, catalogId };
    },
});

/** Admin: archive a bundle */
export const adminArchiveBundle = mutation({
    args: { adminId: v.id("users"), catalogId: v.id("subscription_catalog") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.adminId);
        const catalog = await ctx.db.get(args.catalogId);
        if (!catalog || !catalog.is_bundle) throw new Error("Bundle not found");

        await ctx.db.patch(args.catalogId, {
            bundle_status: "archived",
            is_active: false,
        } as any);

        const marketplaceEntry = await ctx.db.query("marketplace")
            .withIndex("by_catalog", q => q.eq("subscription_catalog_id", args.catalogId))
            .first();

        if (marketplaceEntry) {
            await ctx.db.patch(marketplaceEntry._id, { status: "closed", updated_at: Date.now() } as any);
        }

        return { success: true };
    },
});
