import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const importUsers = mutation({
    args: { users: v.array(v.any()) },
    handler: async (ctx, args) => {
        const mapping: Record<number, string> = {};
        for (const user of args.users) {
            const oldId = user.id;
            delete user.id;
            // Map common fields to what schema expects
            const sanitizedUser: any = {};
            for (const key in user) {
                if (user[key] !== null) sanitizedUser[key] = user[key];
            }

            const id = await ctx.db.insert("users", {
                ...sanitizedUser,
                created_at: typeof user.created_at === 'string' ? new Date(user.created_at).getTime() : user.created_at,
                is_admin: user.is_admin === 1 || user.is_admin === true,
                is_verified: user.is_verified === 1 || user.is_verified === true,
            });
            mapping[oldId] = id;
        }
        return mapping;
    },
});

export const importSubscriptions = mutation({
    args: { subscriptions: v.array(v.any()) },
    handler: async (ctx, args) => {
        const mapping: Record<number, string> = {};
        for (const sub of args.subscriptions) {
            const oldId = sub.id;
            delete sub.id;

            const sanitizedSub: any = {};
            for (const key in sub) {
                if (sub[key] !== null) sanitizedSub[key] = sub[key];
            }

            const id = await ctx.db.insert("subscriptions", {
                ...sanitizedSub,
                is_active: sub.is_active === 1 || sub.is_active === true,
            });
            mapping[oldId] = id;
        }
        return mapping;
    },
});

export const importSlotTypes = mutation({
    args: { slot_types: v.array(v.any()) },
    handler: async (ctx, args) => {
        const mapping: Record<number, string> = {};
        for (const st of args.slot_types) {
            const oldId = st.id;
            delete st.id;

            const sanitizedST: any = {};
            for (const key in st) {
                if (st[key] !== null) sanitizedST[key] = st[key];
            }

            const id = await ctx.db.insert("slot_types", {
                ...sanitizedST,
                downloads_enabled: st.downloads_enabled === 1 || st.downloads_enabled === true,
            });
            mapping[oldId] = id;
        }
        return mapping;
    },
});

export const importGroups = mutation({
    args: { groups: v.array(v.any()) },
    handler: async (ctx, args) => {
        const mapping: Record<number, string> = {};
        for (const g of args.groups) {
            const oldId = g.id;
            delete g.id;

            const sanitizedG: any = {};
            for (const key in g) {
                if (g[key] !== null) sanitizedG[key] = g[key];
            }

            const id = await ctx.db.insert("groups", sanitizedG);
            mapping[oldId] = id;
        }
        return mapping;
    },
});

export const importGeneric = mutation({
    args: { table: v.string(), records: v.array(v.any()) },
    handler: async (ctx, args) => {
        for (const record of args.records) {
            delete record.id;

            const sanitizedRecord: any = {};
            for (const key in record) {
                if (record[key] !== null) sanitizedRecord[key] = record[key];
            }

            // Handle timestamps
            if (sanitizedRecord.created_at && typeof sanitizedRecord.created_at === 'string') {
                sanitizedRecord.created_at = new Date(sanitizedRecord.created_at).getTime();
            }
            if (sanitizedRecord.last_used && typeof sanitizedRecord.last_used === 'string') {
                sanitizedRecord.last_used = new Date(sanitizedRecord.last_used).getTime();
            }
            // Handle booleans (SQLite uses 0/1)
            if (sanitizedRecord.is_from_admin !== undefined) sanitizedRecord.is_from_admin = sanitizedRecord.is_from_admin === 1 || sanitizedRecord.is_from_admin === true;
            if (sanitizedRecord.is_active !== undefined) sanitizedRecord.is_active = sanitizedRecord.is_active === 1 || sanitizedRecord.is_active === true;
            if (sanitizedRecord.downloads_enabled !== undefined) sanitizedRecord.downloads_enabled = sanitizedRecord.downloads_enabled === 1 || sanitizedRecord.downloads_enabled === true;

            await ctx.db.insert(args.table as any, sanitizedRecord);
        }
    },
});
