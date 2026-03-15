// Setup super admin using Convex HTTP client
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import crypto from "crypto";

const CONVEX_URL = "https://wry-dragon-903.eu-west-1.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

async function setupSuperAdmin() {
    try {
        console.log("=== Q Platform Super Admin Setup ===\n");
        console.log(`Convex URL: ${CONVEX_URL}\n`);

        // Step 1: Check if user exists
        console.log("Step 1: Checking if user exists...");
        const existingUser = await client.query(api.users.getByEmail, { email: "riderezzy@gmail.com" });

        if (existingUser) {
            console.log(`✅ User found: ${existingUser.email}`);
            console.log(`   User ID: ${existingUser._id}`);
            console.log(`   Is Admin: ${existingUser.is_admin}`);
            console.log(`   Admin Role: ${existingUser.admin_role || 'none'}`);

            if (existingUser.admin_role === "super") {
                console.log("\n🎉 User is already a SUPER ADMIN!");
                return;
            }

            // Make existing user super admin
            console.log("\nStep 2: Upgrading to super admin...");
            await client.mutation(api.users.initializeSuperAdmin, {});
            console.log("✅ Upgraded to super admin!");
        } else {
            console.log("User does not exist. Creating...\n");

            // Step 2: Create user
            console.log("Step 2: Creating user...");
            const token = crypto.randomUUID();
            const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const password = "SuperSecretAdmin123!";

            const userId = await client.mutation(api.users.createUser, {
                email: "riderezzy@gmail.com",
                full_name: "Super Admin",
                username: "superadmin",
                password_hash: password,
                verification_token: token,
                verification_token_expires: tokenExpires
            });

            console.log("✅ User created!");
            console.log(`   User ID: ${userId}`);

            // Step 3: Make super admin
            console.log("\nStep 3: Granting super admin role...");
            await client.mutation(api.users.initializeSuperAdmin, {});
            console.log("✅ Super admin role granted!");
        }

        console.log("\n🎉 SUCCESS! riderezzy@gmail.com is now a SUPER ADMIN!");
        console.log("\n=== Login Credentials ===");
        console.log("Email: riderezzy@gmail.com");
        console.log("Password: SuperSecretAdmin123!");
        console.log("\n⚠️  IMPORTANT: Change the password after first login!");

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    }
}

setupSuperAdmin();
