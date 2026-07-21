import React from "react";
import { motion } from "motion/react";
import { Sparkles, Check, Zap } from "lucide-react";
import { fmtCurrency } from "../../lib/utils";

const DEFAULT_BUNDLE_TOOLS = [
    { name: "ChatGPT", icon: "💬" },
    { name: "Gemini", icon: "✨" },
    { name: "Claude", icon: "🧠" },
    { name: "Perplexity", icon: "🔍" },
    { name: "Notion AI", icon: "📝" },
    { name: "Copilot", icon: "🤖" },
];

const DEFAULT_FEATURES = [
    "All 6 AI tools in one subscription",
    "ChatGPT Plus (GPT-4o, DALL-E)",
    "Gemini Advanced (Google AI)",
    "Claude Pro (Anthropic)",
    "Perplexity Pro (Research)",
    "Notion AI (Writing & Docs)",
    "Microsoft Copilot (Office AI)",
    "Priority support & early access",
];

interface PremiumMarketplaceCardProps {
    price: number;
    originalPrice?: number;
    launchBadge?: string;
    tagline?: string;
    bundleTools?: { name: string; icon?: string }[];
    features?: string[];
    onSubscribe: () => void;
    disabled?: boolean;
    disabledReason?: string;
}

export default function PremiumMarketplaceCard({
    price,
    originalPrice,
    launchBadge,
    tagline,
    bundleTools,
    features,
    onSubscribe,
    disabled,
    disabledReason,
}: PremiumMarketplaceCardProps) {
    const tools = bundleTools && bundleTools.length > 0 ? bundleTools : DEFAULT_BUNDLE_TOOLS;
    const displayFeatures = features && features.length > 0 ? features : DEFAULT_FEATURES;
    const badge = launchBadge || "🔥 Launch Offer";
    const displayTagline = tagline || "All your favorite AI tools. One subscription.";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-[1px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
            {/* Inner gradient border glow */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-amber-400/30 via-purple-500/30 to-cyan-400/30 opacity-60" />

            <div className="relative rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 sm:p-8 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/20">
                                    <Sparkles size={12} /> {badge}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-400/20 to-purple-500/20 text-purple-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-400/20">
                                    <Zap size={12} /> Most Popular
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Q AI Pack
                            </h2>
                            <p className="text-sm text-zinc-400 font-medium max-w-lg">
                                {displayTagline}
                            </p>
                        </div>

                        {/* Pricing */}
                        <div className="text-right shrink-0">
                            <div className="text-sm text-zinc-500 font-bold mb-1">from</div>
                            <div className="flex items-baseline justify-end gap-2">
                                {originalPrice && originalPrice > price && (
                                    <span className="text-lg text-zinc-500 line-through font-bold">
                                        {fmtCurrency(originalPrice)}
                                    </span>
                                )}
                                <span className="text-3xl sm:text-4xl font-black text-white">
                                    {fmtCurrency(price)}
                                </span>
                                <span className="text-sm text-zinc-400 font-bold">/mo</span>
                            </div>
                        </div>
                    </div>

                    {/* Tool logos grid */}
                    <div className="mb-8">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Included Tools</div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {tools.map((tool, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-lg shadow-inner">
                                        {tool.icon || "✨"}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-300 text-center leading-tight">
                                        {tool.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mb-8">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">What's Included</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {displayFeatures.slice(0, 6).map((feature, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={12} className="text-emerald-400" />
                                    </div>
                                    <span className="text-xs text-zinc-300 font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onSubscribe}
                        disabled={disabled}
                        className="w-full py-4 sm:py-5 rounded-[2rem] font-black text-sm transition-all active:scale-[0.98] bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-900 shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {disabled ? (disabledReason || "Unavailable") : `Subscribe Now — ${fmtCurrency(price)}/mo`}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
