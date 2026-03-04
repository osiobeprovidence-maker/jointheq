"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendEmail = action({
    args: { email: v.string(), token: v.string() },

    handler: async (ctx, args) => {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: "Q <hello@jointheq.sbs>",
            to: args.email,
            subject: "Verify your Q account",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome to Q 🎉</h2>
                    <p>Click the button below to verify your account and start your journey.</p>
                    <a href="https://jointheq.sbs/?token=${args.token}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                        Verify Account
                    </a>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        https://jointheq.sbs/?token=${args.token}
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        console.log("Email sent successfully:", data?.id);
        return { success: true, id: data?.id };
    },
});
