import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

const Q_KNOWLEDGE_BASE = `
You are the JoinTheQ (Q) AI Support Assistant. Your goal is to help users with their subscriptions, account migration, payments, and finding groups on the Q platform.

KNOWLEDGE BASE:
1. Account Migration:
- Users can migrate their existing personal subscriptions (Netflix, Spotify, etc.) to Q.
- Go to "Account Migration" section, submit details (email, platform, profile name).
- Admins verify and transfer it. This helps users monetize their unused slots.

2. Finding Groups:
- Users can browse the "Marketplace" to find available slots in premium subscriptions.
- Each slot has a "Min Q Score" requirement to ensure group stability.

3. Payments & Wallet:
- Q uses a "Wallet" system. Users fund their wallet (Coins) to pay for subscriptions.
- "Boots" are loyalty points earned through referrals and activity. Some payments allow 50/50 Coins + Boots.

4. Renewals & Auto-Renew:
- Subscriptions renew every 30 days.
- Users can toggle "Auto Renewal" on their active subscription cards.
- If Auto Renewal is OFF, the user will be removed at the end of the billing cycle.
- Users can also manually "Renew Now" to stay in the group without interruption.

5. Leaving a Subscription:
- Users can click "Leave Subscription" anytime.
- They will keep access until the end of the current billing cycle.

6. Security & Q Score:
- Q protects accounts by ensuring only verified users join.
- "Q Score" increases with good behavior and active subscriptions.

ESCALATION:
- If the user asks to "talk to an agent", "human", "customer support", or seems very frustrated, politely tell them you are connecting them to a human agent.
- DO NOT try to answer technical account issues that require admin intervention (like password resets for external accounts).

TONE:
- Professional, helpful, concise, and friendly.
`;

export const chatWithAI = action({
    args: {
        conversationId: v.id("support_conversations"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.error("GOOGLE_GENERATIVE_AI_API_KEY not found");
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const escalationKeywords = ["human", "agent", "support agent", "customer support", "talk to someone", "help me developer", "riderezzy"];
        const needsEscalation = escalationKeywords.some(keyword => args.message.toLowerCase().includes(keyword));

        if (needsEscalation) {
            await ctx.runMutation(api.support.escalateToAgent, {
                conversationId: args.conversationId
            });
            return;
        }

        try {
            const result = await model.generateContent([
                { text: Q_KNOWLEDGE_BASE },
                { text: `User: ${args.message}` }
            ]);
            
            const responseText = result.response.text();

            await ctx.runMutation(api.support.sendAIMessage, {
                conversationId: args.conversationId,
                content: responseText,
            });
        } catch (error) {
            console.error("AI Generation Error:", error);
            await ctx.runMutation(api.support.sendAIMessage, {
                conversationId: args.conversationId,
                content: "I'm sorry, I'm having trouble processing that right now. Would you like to speak to a human agent?",
            });
        }
    },
});
