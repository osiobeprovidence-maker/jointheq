import Database from 'better-sqlite3';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

async function migrate() {
    const db = new Database('q_platform.db');
    const tables = [
        'users', 'devices', 'campaigns', 'boot_transactions',
        'subscriptions', 'slot_types', 'groups', 'slots',
        'messages', 'lunar_memories', 'lunar_subscriptions', 'transactions'
    ];

    if (!existsSync('migration_data')) {
        mkdirSync('migration_data');
    }

    tables.forEach(table => {
        try {
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            let jsonl = '';
            for (const row of rows) {
                // Map boolean fields if necessary (SQLite uses 0/1)
                if (table === 'users') {
                    row.isAdmin = row.is_admin === 1;
                    row.isVerified = row.is_verified === 1;
                    row.fullName = row.full_name;
                    row.qScore = row.q_score;
                    row.consistencyScore = row.consistency_score;
                    row.timelinessScore = row.timeliness_score;
                    row.stabilityScore = row.stability_score;
                    row.walletBalance = row.wallet_balance;
                    row.bootBalance = row.boot_balance;
                    row.referralCode = row.referral_code;
                    row.referredBy = row.referred_by || undefined;
                    row.passwordHash = row.password_hash;
                    row.verificationToken = row.verification_token;
                    row.verificationTokenExpires = row.verification_token_expires;
                    row.createdAt = new Date(row.created_at).getTime();

                    // Cleanup old fields for clean Convex import
                    delete row.is_admin;
                    delete row.is_verified;
                    delete row.full_name;
                    delete row.q_score;
                    delete row.consistency_score;
                    delete row.timeliness_score;
                    delete row.stability_score;
                    delete row.wallet_balance;
                    delete row.boot_balance;
                    delete row.referral_code;
                    delete row.referred_by;
                    delete row.password_hash;
                    delete row.verification_token;
                    delete row.verification_token_expires;
                    delete row.created_at;
                }

                if (table === 'devices') {
                    row.userId = row.user_id;
                    row.lastUsed = new Date(row.last_used).getTime();
                    delete row.user_id;
                    delete row.last_used;
                }

                if (table === 'subscriptions') {
                    row.baseCost = row.base_cost;
                    row.isActive = row.is_active === 1;
                    delete row.base_cost;
                    delete row.is_active;
                }

                if (table === 'slot_types') {
                    row.subscriptionId = row.subscription_id;
                    row.deviceLimit = row.device_limit;
                    row.downloadsEnabled = row.downloads_enabled === 1;
                    row.minQScore = row.min_q_score;
                    delete row.subscription_id;
                    delete row.device_limit;
                    delete row.downloads_enabled;
                    delete row.min_q_score;
                }

                if (table === 'groups') {
                    row.subscriptionId = row.subscription_id;
                    row.billingCycleStart = row.billing_cycle_start;
                    delete row.subscription_id;
                    delete row.billing_cycle_start;
                }

                if (table === 'slots') {
                    row.groupId = row.group_id;
                    row.slotTypeId = row.slot_type_id;
                    row.userId = row.user_id || undefined;
                    row.renewalDate = row.renewal_date;
                    delete row.group_id;
                    delete row.slot_type_id;
                    delete row.user_id;
                    delete row.renewal_date;
                }

                if (table === 'messages') {
                    row.senderId = row.sender_id;
                    row.receiverId = row.receiver_id || undefined;
                    row.imageData = row.image_data || undefined;
                    row.isFromAdmin = row.is_from_admin === 1;
                    row.createdAt = new Date(row.created_at).getTime();
                    delete row.sender_id;
                    delete row.receiver_id;
                    delete row.image_data;
                    delete row.is_from_admin;
                    delete row.created_at;
                }

                if (table === 'lunar_memories') {
                    row.addedBy = row.added_by;
                    row.createdAt = new Date(row.created_at).getTime();
                    delete row.added_by;
                    delete row.created_at;
                }

                if (table === 'lunar_subscriptions') {
                    row.userId = row.user_id;
                    row.expiryDate = row.expiry_date;
                    row.createdAt = new Date(row.created_at).getTime();
                    delete row.user_id;
                    delete row.expiry_date;
                    delete row.created_at;
                }

                if (table === 'transactions' || table === 'boot_transactions') {
                    row.userId = row.user_id;
                    row.createdAt = new Date(row.created_at).getTime();
                    delete row.user_id;
                    delete row.created_at;
                }

                // Keep 'id' for cross-referencing but Convex will auto-generate _id.
                // We'll need a way to link them back or just import and re-link if IDs change.
                // Convex usually generates _id strings. 
                jsonl += JSON.stringify(row) + '\n';
            }
            writeFileSync(`migration_data/${table}.jsonl`, jsonl);
            console.log(`Exported ${rows.length} rows from ${table}`);
        } catch (e) {
            console.log(`Error exporting ${table}: ${e.message}`);
        }
    });

    db.close();
}

migrate();
