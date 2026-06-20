import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { Link } from "react-router-dom";
import { Id } from "../../convex/_generated/dataModel";
import { Gift, ChevronLeft, Clock, CheckCircle2, XCircle, Truck, Medal, Loader2 } from "lucide-react";

const STATUS_STYLES: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending_review: { color: "bg-amber-50 text-amber-700", label: "Pending Review", icon: <Clock size={14} /> },
    approved: { color: "bg-blue-50 text-blue-700", label: "Approved", icon: <CheckCircle2 size={14} /> },
    delivered: { color: "bg-emerald-50 text-emerald-700", label: "Delivered", icon: <Truck size={14} /> },
    rejected: { color: "bg-red-50 text-red-600", label: "Rejected", icon: <XCircle size={14} /> },
};

export default function RewardsPage() {
    const currentUser = auth.getCurrentUser();
    const rewards = useQuery(api.referrals.getUserRewards, currentUser ? { userId: currentUser._id as Id<"users"> } : "skip");
    const badges = useQuery(api.referrals.getUserBadges, currentUser ? { userId: currentUser._id as Id<"users"> } : "skip");

    if (!rewards || !badges) {
        return (
            <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-zinc-400" />
            </div>
        );
    }

    const grouped = {
        pending_review: rewards.filter(r => r.status === "pending_review"),
        approved: rewards.filter(r => r.status === "approved"),
        delivered: rewards.filter(r => r.status === "delivered"),
        rejected: rewards.filter(r => r.status === "rejected"),
    };

    return (
        <div className="min-h-screen bg-[#f4f5f8]">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-zinc-900 transition-colors">
                    <ChevronLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center gap-3">
                    <Gift size={24} className="text-zinc-900" />
                    <h1 className="text-xl font-black text-zinc-900">My Rewards</h1>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                        <h2 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <Medal size={18} className="text-amber-500" /> Achievement Badges
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {badges.map(b => (
                                <div key={b._id} className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-2xl px-4 py-2">
                                    <Medal size={18} className="text-amber-500" />
                                    <span className="text-sm font-black text-zinc-900">{b.badge_name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rewards by status */}
                {Object.entries(grouped).map(([status, items]) => {
                    if (items.length === 0) return null;
                    const st = STATUS_STYLES[status] || STATUS_STYLES.pending_review;
                    return (
                        <div key={status} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                            <h2 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                                {st.icon} {st.label} ({items.length})
                            </h2>
                            <div className="space-y-3">
                                {items.map(r => (
                                    <div key={r._id} className={`rounded-2xl p-4 border ${st.color.split(" ").slice(-1)[0] || "border-black/5"}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-black text-zinc-900">{r.reward_name}</div>
                                                <div className="text-xs font-bold text-gray-500 mt-0.5">{r.campaign_name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black ${st.color}`}>
                                                    {st.icon} {st.label}
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-400 mt-1">{new Date(r.awarded_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        {r.admin_note && (
                                            <p className="text-xs font-bold text-gray-500 mt-2 pt-2 border-t border-black/5">{r.admin_note}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {rewards.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 shadow-sm border border-black/5 text-center">
                        <Gift size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm font-bold text-gray-400">No rewards yet</p>
                        <p className="text-xs text-gray-400 mt-1">Participate in referral campaigns to earn rewards!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
