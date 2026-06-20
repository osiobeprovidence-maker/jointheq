import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { Gift, Users, Trophy, Copy, Share2, ChevronLeft, Clock, Medal, Crown, Target, CheckCircle2, Timer, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function Countdown({ endDate }: { endDate: number }) {
    const [now, setNow] = useState(Date.now());
    React.useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const diff = Math.max(0, endDate - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return (
        <div className="flex gap-3">
            {[
                { label: "Days", value: days }, { label: "Hrs", value: hours },
                { label: "Min", value: mins }, { label: "Sec", value: secs },
            ].map(u => (
                <div key={u.label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 bg-white rounded-2xl px-3 py-2 min-w-[56px] shadow-sm">{String(u.value).padStart(2, "0")}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{u.label}</div>
                </div>
            ))}
        </div>
    );
}

export default function CampaignPage() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const currentUser = auth.getCurrentUser();
    const [copied, setCopied] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const campaign = useQuery(api.referrals.getCampaign, campaignId ? { campaignId: campaignId as Id<"referral_campaigns"> } : "skip");
    const leaderboard = useQuery(api.referrals.getCampaignLeaderboard, campaignId ? { campaignId: campaignId as Id<"referral_campaigns">, limit: 50 } : "skip");
    const winners = useQuery(api.referrals.getCampaignWinners, campaignId ? { campaignId: campaignId as Id<"referral_campaigns"> } : "skip");
    const userReferrals = useQuery(api.referrals.getUserReferrals, currentUser && campaignId ? { userId: currentUser._id as Id<"users">, campaignId: campaignId as Id<"referral_campaigns"> } : "skip");

    const referralLink = currentUser ? `${window.location.origin}/campaigns/${campaignId}?ref=${currentUser._id}` : "";

    const completed = (userReferrals || []).filter(r => r.status === "completed").length;
    const pending = (userReferrals || []).filter(r => r.status === "pending").length;
    const target = campaign?.target_referral_count ?? 1;
    const progress = Math.min(100, Math.round((completed / target) * 100));

    const myRank = leaderboard?.find(e => e.userId === currentUser?._id);

    const sharePlatforms = [
        { name: "WhatsApp", url: `https://wa.me/?text=${encodeURIComponent(`Join me on Q! ${referralLink}`)}`, color: "bg-emerald-500" },
        { name: "Telegram", url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Q!")}`, color: "bg-sky-500" },
        { name: "X", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Q and earn rewards! ${referralLink}`)}`, color: "bg-zinc-900" },
        { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, color: "bg-blue-600" },
    ];

    if (!campaign) {
        return (
            <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f5f8]">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Back */}
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-zinc-900 transition-colors">
                    <ChevronLeft size={16} /> Back to Dashboard
                </Link>

                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 sm:p-8 text-white">
                    {campaign.banner_url && (
                        <img src={campaign.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                    )}
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                            <Gift size={12} /> Active Campaign
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">{campaign.name}</h1>
                        <p className="text-sm text-white/70 max-w-xl">{campaign.description}</p>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2">
                                <Gift size={16} className="text-amber-400" />
                                <span className="text-sm font-bold">{campaign.reward_name}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2">
                                <Target size={16} className="text-emerald-400" />
                                <span className="text-sm font-bold">{campaign.target_referral_count} referrals needed</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Time Remaining</p>
                            <Countdown endDate={campaign.end_date} />
                        </div>
                    </div>
                </div>

                {/* My Progress */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                    <h2 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <Target size={18} /> My Progress
                    </h2>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl sm:text-3xl font-black text-zinc-900">{completed}<span className="text-base text-gray-400">/{target}</span></span>
                        <span className="text-sm font-black text-zinc-500">{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs font-bold text-gray-500 mb-4">
                        {pending > 0 ? `${pending} pending referral(s) awaiting completion` : completed >= target ? "Target reached! An admin will review your reward." : "Share your link to get more referrals"}
                    </p>

                    {/* Referral link */}
                    <div className="bg-zinc-50 rounded-2xl p-3 flex items-center gap-3 mb-3">
                        <input readOnly value={referralLink} className="flex-1 bg-transparent text-xs font-bold text-zinc-700 outline-none truncate" />
                        <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Link copied!"); }}
                            className="shrink-0 h-9 px-4 rounded-xl bg-zinc-900 text-white text-[10px] font-black hover:bg-black transition-colors flex items-center gap-1.5">
                            <Copy size={13} /> {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>

                    {/* Share buttons */}
                    <div className="flex flex-wrap gap-2">
                        {sharePlatforms.map(p => (
                            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl ${p.color} text-white text-[10px] font-black hover:scale-105 transition-transform`}>
                                <Share2 size={12} /> {p.name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                    <h2 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" /> Leaderboard
                    </h2>
                    <div className="space-y-1">
                        {(leaderboard || []).slice(0, 20).map((entry) => {
                            const isMe = entry.userId === currentUser?._id;
                            const medal = entry.rank === 1 ? "text-amber-400" : entry.rank === 2 ? "text-gray-400" : entry.rank === 3 ? "text-amber-700" : "text-zinc-400";
                            return (
                                <div key={entry.userId} className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-colors ${isMe ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}>
                                    <span className={`w-8 text-center text-sm font-black ${medal}`}>
                                        {entry.rank <= 3 ? <Crown size={16} className={`inline ${medal}`} /> : entry.rank}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-black shrink-0">
                                        {entry.image ? <img src={entry.image} className="w-8 h-8 rounded-full object-cover" /> : entry.full_name[0] || "?"}
                                    </div>
                                    <span className="flex-1 text-sm font-bold truncate">{entry.full_name}{isMe ? " (You)" : ""}</span>
                                    <span className="text-xs font-black">{entry.referralCount} ref</span>
                                </div>
                            );
                        })}
                        {(leaderboard || []).length === 0 && (
                            <p className="text-center py-8 text-sm text-gray-400 font-bold">No referrals yet. Be the first!</p>
                        )}
                    </div>
                </div>

                {/* Recent Winners */}
                {winners && winners.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
                        <h2 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <Medal size={18} className="text-amber-500" /> Recent Winners
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {winners.map((w, i) => (
                                <div key={i} className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-black shrink-0">
                                        {w.image ? <img src={w.image} className="w-10 h-10 rounded-full object-cover" /> : w.full_name[0] || "?"}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-black truncate text-zinc-900">{w.full_name}</div>
                                        <div className="text-xs font-bold text-emerald-600">won {w.reward_name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
