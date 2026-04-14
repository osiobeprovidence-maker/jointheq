import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

export const sendVerificationEmail = action({
    args: {
        email: v.string(),
        name: v.string(),
        token: v.string(),
        baseUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const verificationLink = `${args.baseUrl}/?token=${args.token}`;

        const { error } = await resend.emails.send({
            from: 'Q Platform <hello@jointheq.sbs>',
            to: args.email,
            subject: 'Verify your Q Account',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #141414;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to Q, ${args.name}!</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #666;">You're almost there. Tap the button below to verify your account and start your journey with Q.</p>
          <a href="${verificationLink}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 30px 0;">Verify Account</a>
          <p style="font-size: 14px; color: #999;">If you didn't create this account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #bbb;">© 2026 jointheq. All rights reserved.</p>
        </div>
      `
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error };
        }

        return { success: true };
    },
});

export const sendPasswordResetEmail = action({
    args: {
        email: v.string(),
        name: v.string(),
        token: v.string(),
        baseUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resetLink = `${args.baseUrl}/?reset=${encodeURIComponent(args.token)}`;

        const { error } = await resend.emails.send({
            from: 'Q Platform <hello@jointheq.sbs>',
            to: args.email,
            subject: 'Reset your Q password',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #141414;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Reset your password, ${args.name}</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #666;">We received a request to reset your Q account password. Use the button below to choose a new password.</p>
          <a href="${resetLink}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 30px 0;">Reset Password</a>
          <p style="font-size: 14px; color: #999;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #bbb;">© 2026 jointheq. All rights reserved.</p>
        </div>
      `
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error };
        }

        return { success: true };
    },
});
