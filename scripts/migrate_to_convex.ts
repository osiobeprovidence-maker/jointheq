
import Database from 'better-sqlite3';
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
const db = new Database('q_platform.db');

async function migrate() {
    console.log("Starting migration using ConvexHttpClient...");

    // 1. Users
    const sqliteUsers = db.prepare("SELECT * FROM users").all();
    console.log(`Found ${sqliteUsers.length} users in SQLite.`);
    const userMapping = await client.mutation("migration:importUsers" as any, { users: sqliteUsers }) as Record<number, string>;
    console.log("Users imported.");

    // 2. Subscriptions
    const sqliteSubs = db.prepare("SELECT * FROM subscriptions").all();
    const subMapping = await client.mutation("migration:importSubscriptions" as any, { subscriptions: sqliteSubs }) as Record<number, string>;
    console.log("Subscriptions imported.");

    // 3. Slot Types
    const sqliteSlotTypes = db.prepare("SELECT * FROM slot_types").all().map((st: any) => ({
        ...st,
        subscription_id: subMapping[st.subscription_id]
    }));
    const slotTypeMapping = await client.mutation("migration:importSlotTypes" as any, { slot_types: sqliteSlotTypes }) as Record<number, string>;
    console.log("Slot types imported.");

    // 4. Groups
    const sqliteGroups = db.prepare("SELECT * FROM groups").all().map((g: any) => ({
        ...g,
        subscription_id: subMapping[g.subscription_id]
    }));
    const groupMapping = await client.mutation("migration:importGroups" as any, { groups: sqliteGroups }) as Record<number, string>;
    console.log("Groups imported.");

    // 5. Campaigns
    const sqliteCampaigns = db.prepare("SELECT * FROM campaigns").all();
    await client.mutation("migration:importGeneric" as any, { table: "campaigns", records: sqliteCampaigns });
    console.log("Campaigns imported.");

    // 6. Devices
    const sqliteDevices = db.prepare("SELECT * FROM devices").all().map((d: any) => ({
        ...d,
        user_id: userMapping[d.user_id]
    }));
    await client.mutation("migration:importGeneric" as any, { table: "devices", records: sqliteDevices });
    console.log("Devices imported.");

    // 7. Slots
    const sqliteSlots = db.prepare("SELECT * FROM slots").all().map((s: any) => ({
        ...s,
        user_id: s.user_id ? userMapping[s.user_id] : undefined,
        group_id: groupMapping[s.group_id],
        slot_type_id: slotTypeMapping[s.slot_type_id]
    }));
    await client.mutation("migration:importGeneric" as any, { table: "slots", records: sqliteSlots });
    console.log("Slots imported.");

    // 8. Messages
    const sqliteMessages = db.prepare("SELECT * FROM messages").all().map((m: any) => ({
        ...m,
        sender_id: userMapping[m.sender_id],
        receiver_id: m.receiver_id ? userMapping[m.receiver_id] : undefined
    }));
    await client.mutation("migration:importGeneric" as any, { table: "messages", records: sqliteMessages });
    console.log("Messages imported.");

    // 9. Lunar Memories
    const sqliteMemories = db.prepare("SELECT * FROM lunar_memories").all().map((m: any) => ({
        ...m,
        added_by: userMapping[m.added_by]
    }));
    await client.mutation("migration:importGeneric" as any, { table: "lunar_memories", records: sqliteMemories });
    console.log("Lunar memories imported.");

    // 10. Lunar Subscriptions
    const sqliteLunarSubs = db.prepare("SELECT * FROM lunar_subscriptions").all().map((ls: any) => ({
        ...ls,
        user_id: userMapping[ls.user_id]
    }));
    await client.mutation("migration:importGeneric" as any, { table: "lunar_subscriptions", records: sqliteLunarSubs });
    console.log("Lunar subscriptions imported.");

    // 11. Transactions
    const sqliteTransactions = db.prepare("SELECT * FROM transactions").all().map((t: any) => ({
        ...t,
        user_id: userMapping[t.user_id]
    }));
    await client.mutation("migration:importGeneric" as any, { table: "transactions", records: sqliteTransactions });
    console.log("Transactions imported.");

    // 12. Boot Transactions
    const sqliteBootTransactions = db.prepare("SELECT * FROM boot_transactions").all().map((bt: any) => ({
        ...bt,
        user_id: userMapping[bt.user_id]
    }));
    await client.mutation("migration:importGeneric" as any, { table: "boot_transactions", records: sqliteBootTransactions });
    console.log("Boot transactions imported.");

    console.log("Migration completed successfully!");
}

migrate().catch(console.error);
