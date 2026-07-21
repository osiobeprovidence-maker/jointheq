import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles, Check, Zap, Shield, Clock, CreditCard, HelpCircle, ChevronDown } from "lucide-react";
import { fmtCurrency } from "../lib/utils";

export default function BundleDetailPage() {
    const { bundleId } = useParams();
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const bundles = useQuery(api.subscriptions.getBundleListings) || [];
    const bundle = bundles.find((b: any) => b.catalog_id === bundleId);
    const currentUser = useQuery(api.users.getCurrentUser);

    if (!bundle) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles size={24} className="text-zinc-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400">Bundle not found</p>
                    <button onClick={() => navigate("/dashboard?tab=marketplace")} className="text-sm font-bold text-black underline">
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const tools = bundle.bundle_tools || [];
    const savingsPercent = bundle.original_price && bundle.original_price > bundle.price
        ? Math.round((1 - bundle.price / bundle.original_price) * 100)
        : 0;

    const faqs = [
        { q: "How does billing work?", a: "You are billed monthly at the start of each billing cycle. You can cancel anytime before the next billing date." },
        { q: "Can I switch tools mid-cycle?", a: "Yes! You can switch between the included tools at any time. Each slot gives you access to all tools in the pack." },
        { q: "Is there a minimum commitment?", a: "No minimum commitment. You can subscribe month-to-month and cancel anytime with no penalties." },
        { q: "How do I access the tools?", a: "After subscribing, you will receive login credentials and setup instructions via email and in your Q dashboard." },
        { q: "Can I share my account?", a: "Each subscription is for one user only. Sharing accounts violates our terms of service." },
    ];

    const handleSubscribe = async () => {
        navigate("/dashboard?tab=marketplace");
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7]">
            {/* Top Bar */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-black/5">
                <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate("/dashboard?tab=marketplace")} className="flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-black transition-colors">
                        <ArrowLeft size={18} /> Marketplace
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Bundle Details</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-10">
                {/* Hero Banner */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-[1px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-amber-400/30 via-purple-500/30 to-cyan-400/30 opacity-60" />
                    <div className="relative rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 sm:p-12 overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                            <div className="space-y-4 max-w-xl">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {bundle.launch_badge && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/20">
                                            <Sparkles size={12} /> {bundle.launch_badge}
                                        </span>
                                    )}
                                    {savingsPercent > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/20">
                                            <Zap size={12} /> Save {savingsPercent}%
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-400/20 to-purple-500/20 text-purple-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-400/20">
                                        <Zap size={12} /> Most Popular
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">{bundle.name}</h1>
                                <p className="text-base sm:text-lg text-zinc-400 font-medium">{bundle.tagline || bundle.description}</p>
                                {bundle.pack_description && (
                                    <p className="text-sm text-zinc-500">{bundle.pack_description}</p>
                                )}
                            </div>

                            <div className="shrink-0 bg-white/5 border border-white/10 rounded-[2rem] p-6 sm:p-8 text-center lg:text-right space-y-4">
                                <div className="text-sm text-zinc-500 font-bold">Starting from</div>
                                <div className="flex items-baseline justify-center lg:justify-end gap-3">
                                    {bundle.original_price && bundle.original_price > bundle.price && (
                                        <span className="text-2xl text-zinc-500 line-through font-bold">
                                            {fmtCurrency(bundle.original_price)}
                                        </span>
                                    )}
                                    <span className="text-4xl sm:text-5xl font-black text-white">
                                        {fmtCurrency(bundle.price)}
                                    </span>
                                    <span className="text-base text-zinc-400 font-bold">/mo</span>
                                </div>
                                {savingsPercent > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 rounded-xl text-emerald-400 text-xs font-black uppercase tracking-widest">
                                        Save {fmtCurrency(bundle.original_price - bundle.price)}/month
                                    </div>
                                )}
                                <button
                                    onClick={handleSubscribe}
                                    className="w-full py-4 rounded-[2rem] font-black text-sm transition-all active:scale-[0.98] bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-900 shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400"
                                >
                                    Subscribe Now
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Included Tools Grid */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-2 h-8 bg-purple-500 rounded-full" />
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Everything Included</h2>
                            <p className="text-sm text-zinc-400 font-medium">All tools are unlocked with your subscription</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {tools.map((tool: any, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-2xl shadow-inner">
                                    {tool.icon || "✨"}
                                </div>
                                <span className="text-xs font-bold text-zinc-700 text-center leading-tight">{tool.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Pricing & Savings */}
                {savingsPercent > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-[2.5rem] p-8 sm:p-10 border border-emerald-200/50">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-200 rounded-full flex items-center justify-center shrink-0">
                                <Zap size={28} className="text-emerald-600" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-black text-emerald-900">Save {fmtCurrency(bundle.original_price - bundle.price)} Monthly</h3>
                                <p className="text-sm text-emerald-700 font-medium mt-1">
                                    Bundled value: {fmtCurrency(bundle.original_price)} — you pay only {fmtCurrency(bundle.price)}. That's {savingsPercent}% in savings!
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Key Features */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: <Shield size={20} />, title: "Instant Access", desc: "Get your login credentials immediately after payment." },
                        { icon: <Clock size={20} />, title: "Cancel Anytime", desc: "No long-term contracts. Month-to-month with no penalties." },
                        { icon: <CreditCard size={20} />, title: "Secure Payment", desc: "Pay securely via card or bank transfer with Q's payment system." },
                    ].map((feat, i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex items-start gap-4">
                            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 text-zinc-600">{feat.icon}</div>
                            <div>
                                <h4 className="font-black text-sm">{feat.title}</h4>
                                <p className="text-xs text-zinc-400 font-medium mt-1">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* FAQs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-2 h-8 bg-zinc-900 rounded-full" />
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Frequently Asked Questions</h2>
                            <p className="text-sm text-zinc-400 font-medium">Everything you need to know</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-zinc-100 rounded-2xl overflow-hidden">
                                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full px-6 py-5 flex items-center justify-between text-left bg-white hover:bg-zinc-50 transition-colors">
                                    <span className="font-bold text-sm">{faq.q}</span>
                                    <ChevronDown size={16} className={`text-zinc-400 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedFaq === i && (
                                    <div className="px-6 pb-5">
                                        <p className="text-sm text-zinc-500 font-medium">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center pb-10">
                    <button
                        onClick={handleSubscribe}
                        className="inline-flex items-center gap-2 px-10 py-5 rounded-[2rem] font-black text-base bg-zinc-900 text-white shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform hover:bg-black"
                    >
                        Subscribe to {bundle.name} — {fmtCurrency(bundle.price)}/mo
                    </button>
                    <p className="text-xs text-zinc-400 font-medium mt-3">Cancel anytime. No questions asked.</p>
                </motion.div>
            </div>
        </div>
    );
}
