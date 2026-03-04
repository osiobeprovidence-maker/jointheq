import { GenericMutationCtx } from "convex/server";
import { Id } from "./_generated/dataModel";

export async function awardReputation(
    ctx: any, // Using any for simplicity as it takes MutationCtx
    userId: Id<"users">,
    { score, boots, type, description, isPenalty }: { score: number, boots: number, type: string, description: string, isPenalty?: boolean }
) {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const newScore = Math.max(0, (user.q_score || 0) + score);
    const newBoots = Math.max(0, (user.boots_balance || 0) + boots);

    // Calculate Rank
    let newRank = "Rookie";
    if (newScore >= 1000) newRank = "Elite";
    else if (newScore >= 600) newRank = "Pro";
    else if (newScore >= 300) newRank = "Trusted";
    else if (newScore >= 100) newRank = "Explorer";

    const score_history = user.score_history || [];
    const boots_history = user.boots_history || [];
    const penalty_history = user.penalty_history || [];
    const now = Date.now();

    if (score !== 0) {
        score_history.push({ amount: score, type, description, created_at: now });
    }
    if (boots !== 0) {
        boots_history.push({ amount: boots, type, description, created_at: now });
    }
    if (isPenalty) {
        penalty_history.push({
            score_penalty: Math.abs(score),
            boots_penalty: Math.abs(boots),
            type,
            description,
            created_at: now
        });
    }

    await ctx.db.patch(userId, {
        q_score: newScore,
        q_rank: newRank,
        boots_balance: newBoots,
        score_history: score_history.slice(-50),
        boots_history: boots_history.slice(-50),
        penalty_history: penalty_history.slice(-50)
    });
}
