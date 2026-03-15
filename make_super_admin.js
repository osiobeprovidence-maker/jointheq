// Script to make riderezzy@gmail.com a super admin
// Run with: npx tsx make_super_admin.js

import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
    console.error("Error: CONVEX_URL environment variable not set");
    console.error("Please create a .env file with:");
    console.error("  CONVEX_URL=https://your-deployment.convex.cloud");
    process.exit(1);
}

async function initializeSuperAdmin() {
    try {
        console.log(`Convex deployment: ${CONVEX_URL}`);
        console.log("Running initializeSuperAdmin mutation...\n");

        // Use Convex CLI to run the mutation
        const result = execSync(
            `npx convex run users:initializeSuperAdmin '{}' --env-file .env`,
            { encoding: 'utf-8', stdio: 'inherit' }
        );

        console.log("\n✅ Result:", result);
        console.log("\n🎉 riderezzy@gmail.com is now a SUPER ADMIN!");
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    }
}

initializeSuperAdmin();
