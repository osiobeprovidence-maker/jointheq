import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft, Trophy, Share2, Copy, MessageCircle, Users,
    Zap, DollarSign, CheckCircle2, Clock, Target, ChevronRight,
    Star, Gift, Send, X, Wallet, AlertCircle, ExternalLink, Link,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import toast from "react-hot-toast";

// ─── Commission table for Campus Q ──────────────────────────────────────────
const COMMISSIONS = [
    { name: "Netflix Premium", commission: 308 },
    { name: "Spotify", commission: 90 },
    { name: "Apple Music", commission: 90 },
    { name: "Prime Video", commission: 120 },
    { name: "YouTube Premium", commission: 96 },
    { name: "YouTube Music", commission: 90 },
    { name: "Crunchyroll", commission: 100 },
    { name: "Canva", commission: 240 },
    { name: "CapCut", commission: 500 },
    { name: "ChatGPT Go", commission: 200 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${active ? "bg-zinc-900 text-white shadow-lg shadow-black/10" : "bg-white text-gray-500 border border-black/5 hover:text-black"}`}>
            {children}
        </button>
    );
}

export default function CampaignDetailPage() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get("ref");
    const navigate = useNavigate();
    const user = auth.getCurrentUser();

    const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "friends" | "earnings">("overview");
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ amount: 5000, bank_name: "", account_number: "", account_name: "" });
    const [copied, setCopied] = useState(false);

    // ─── Queries ───────────────────────────────────────────────────────────
    const campaign = useQuery(
        api.campaigns.getById,
        campaignId ? { id: campaignId as Id<"campaigns"> } : "skip"
    );
    const participant = useQuery(
        api.campaigns.getParticipant,
        campaignId && user?._id ? { campaign_id: campaignId as Id<"campaigns">, user_id: user._id } : "skip"
    );
    const myStats = useQuery(
        api.campaigns.getMyStats,
        campaignId && user?._id ? { campaign_id: campaignId as Id<"campaigns">, user_id: user._id as Id<"users"> } : "skip"
    );
    const leaderboard = useQuery(
        api.campaigns.getLeaderboard,
        campaignId ? { campaign_id: campaignId as Id<"campaigns"> } : "skip"
    ) || [];
    const myReferrals = useQuery(
        api.campaigns.getMyReferrals,
        campaignId && user?._id ? { campaign_id: campaignId as Id<"campaigns">, user_id: user._id as Id<"users"> } : "skip"
    ) || [];
    const myWithdrawals = useQuery(
        api.campaigns.getMyWithdrawals,
        user?._id ? { user_id: user._id as Id<"users"> } : "skip"
    ) || [];

    // ─── Mutations ─────────────────────────────────────────────────────────
    const participateMut = useMutation(api.campaigns.participate);
    const requestWithdrawalMut = useMutation(api.campaigns.requestWithdrawal);

    const isJoined = !!participant;
    const referralLink = `${window.location.origin}/campaigns/${campaignId}?ref=${user?._id ?? ""}`;

    const handleJoin = async () => {
        if (!user?._id || !campaignId) return toast.error("Please log in first");
        try {
            await participateMut({
                campaign_id: campaignId as Id<"campaigns">,
                user_id: user._id as Id<"users">,
                referrer_id: (referrerId as Id<"users">) || undefined,
            });
            toast.success("🎉 You've joined the campaign!", { duration: 3000 });
        } catch (e: any) { toast.error(e.message); }
    };

    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2500);
    };

    const shareWhatsApp = () => {
        const text = encodeURIComponent(`🔥 Join me on JoinTheQ! Use my referral link to join the "${campaign?.name}" campaign and start earning. ${referralLink}`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const shareTelegram = () => {
        const text = encodeURIComponent(`🔥 Join me on JoinTheQ! "${campaign?.name}" campaign. ${referralLink}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
    };

    const handleWithdraw = async () => {
        if (!user?._id || !campaignId) return;
        try {
            await requestWithdrawalMut({
                user_id: user._id as Id<"users">,
                campaign_id: campaignId as Id<"campaigns">,
                amount: withdrawForm.amount,
                bank_name: withdrawForm.bank_name,
                account_number: withdrawForm.account_number,
                account_name: withdrawForm.account_name,
            });
            toast.success("Withdrawal request submitted! Processed within 2 business days.");
            setShowWithdrawModal(false);
        } catch (e: any) { toast.error(e.message); }
    };

    if (!campaign) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-bold text-gray-400">Loading campaign...</p>
                </div>
            </div>
        );
    }

    const daysLeft = Math.max(0, Math.ceil((campaign.end_date - Date.now()) / 86400000));
    const fillPct = campaign.target_goal ? Math.min(100, Math.round(((campaign.current_progress ?? 0) / campaign.target_goal) * 100)) : 0;
    const isCampus = campaign.type === "campus";

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-['Inter',sans-serif]">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-xl border-b border-black/5 px-4 sm:px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate("/dashboard?tab=campaigns")} className="flex items-center gap-2 text-sm font-bold hover:text-black text-gray-500 transition-colors">
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${campaign.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {campaign.status}
                        </span>
                        {isJoined && (
                            <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-blue-100 text-blue-700">Joined</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${isCampus ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-blue-500 to-purple-600"}`}>
                        {isCampus ? <Gift size={32} className="text-white" /> : <Zap size={32} className="text-white" />}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3">{campaign.name}</h1>
                    <p className="text-gray-500 text-base leading-relaxed mb-6">{campaign.description}</p>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white rounded-2xl p-4 text-center border border-black/5">
                            <div className="text-xl font-black">{campaign.participant_count ?? 0}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Joined</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 text-center border border-black/5">
                            <div className="text-xl font-black">{daysLeft}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Days Left</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 text-center border border-black/5">
                            <div className="text-xl font-black">{fillPct}%</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Progress</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-white rounded-2xl p-4 border border-black/5 mb-6">
                        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                            <span>Campaign Progress</span>
                            <span>{campaign.current_progress ?? 0} / {campaign.target_goal} goal</span>
                        </div>
                        <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${fillPct}%` }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className={`h-full rounded-full ${fillPct > 80 ? "bg-emerald-500" : fillPct > 40 ? "bg-blue-500" : "bg-purple-500"}`}
                            />
                        </div>
                    </div>

                    {/* Join / Share CTA */}
                    {!isJoined ? (
                        <motion.button onClick={handleJoin} whileTap={{ scale: 0.97 }}
                            className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-lg shadow-2xl shadow-black/20 hover:shadow-black/30 transition-shadow">
                            🚀 Join Campaign
                        </motion.button>
                    ) : (
                        <div className="space-y-3">
                            {/* My mini stats */}
                            {myStats && (
                                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-5 text-white">
                                    <div className="text-xs text-white/40 font-bold uppercase mb-3">Your Performance</div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="text-center">
                                            <div className="text-xl font-black">#{myStats.rank}</div>
                                            <div className="text-[10px] text-white/40">Rank</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black">{myStats.referral_count ?? 0}</div>
                                            <div className="text-[10px] text-white/40">Referrals</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black">{myStats.boots_earned ?? 0}</div>
                                            <div className="text-[10px] text-white/40">BOOTS</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black">₦{(myStats.cash_earned ?? 0).toLocaleString()}</div>
                                            <div className="text-[10px] text-white/40">Earned</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Share section */}
                            <div className="bg-white rounded-2xl p-5 border border-black/5">
                                <div className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Your Referral Link</div>
                                <div className="flex items-center gap-2 bg-[#f8f9fa] rounded-xl p-3 mb-4">
                                    <Link size={14} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-xs font-mono text-gray-600 flex-1 truncate">{referralLink}</span>
                                    <button onClick={copyReferralLink} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? "bg-emerald-100 text-emerald-700" : "bg-zinc-900 text-white"}`}>
                                        {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={shareWhatsApp} className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                                        <MessageCircle size={16} /> WhatsApp
                                    </button>
                                    <button onClick={shareTelegram} className="flex items-center justify-center gap-2 py-3 bg-[#2CA5E0] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                                        <Send size={16} /> Telegram
                                    </button>
                                </div>
                            </div>

                            {/* Withdraw (campus only) */}
                            {isCampus && (myStats?.cash_earned ?? 0) >= 5000 && (
                                <button onClick={() => setShowWithdrawModal(true)} className="w-full py-4 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
                                    <Wallet size={18} /> Withdraw Earnings (₦{(myStats?.cash_earned ?? 0).toLocaleString()})
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
                    <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
                    <TabButton active={activeTab === "leaderboard"} onClick={() => setActiveTab("leaderboard")}>🏆 Leaderboard</TabButton>
                    {isJoined && <TabButton active={activeTab === "friends"} onClick={() => setActiveTab("friends")}>Friends ({myReferrals.length})</TabButton>}
                    {isJoined && <TabButton active={activeTab === "earnings"} onClick={() => setActiveTab("earnings")}>Earnings</TabButton>}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── OVERVIEW ── */}
                    {activeTab === "overview" && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {campaign.about && (
                                <div className="bg-white rounded-2xl p-6 border border-black/5">
                                    <h3 className="font-black mb-3">About this Campaign</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{campaign.about}</p>
                                </div>
                            )}

                            {campaign.reward_structure && (
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Gift size={18} className="text-orange-500" />
                                        <h3 className="font-black">Reward Structure</h3>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{campaign.reward_structure}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Zap size={14} className="text-yellow-500" />
                                        <span className="text-xs font-bold text-gray-500">{campaign.referral_boots ?? 5} BOOTS earned per referral</span>
                                    </div>
                                </div>
                            )}

                            {/* Campus Q commission table */}
                            {isCampus && (
                                <div className="bg-white rounded-2xl p-6 border border-black/5">
                                    <h3 className="font-black mb-1">Campus Q Commission Rates</h3>
                                    <p className="text-xs text-gray-400 mb-4">2% of slot price per referral, for {campaign.commission_months ?? 3} months</p>
                                    <div className="space-y-2">
                                        {COMMISSIONS.map(c => (
                                            <div key={c.name} className="flex items-center justify-between py-2 border-b border-black/3">
                                                <span className="text-sm font-bold">{c.name}</span>
                                                <span className="text-sm font-black text-emerald-600">₦{c.commission}/referral</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {campaign.how_it_works && campaign.how_it_works.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 border border-black/5">
                                    <h3 className="font-black mb-4">How It Works</h3>
                                    <div className="space-y-3">
                                        {campaign.how_it_works.map((step: string, i: number) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-7 h-7 flex-shrink-0 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-black">{i + 1}</div>
                                                <p className="text-sm text-gray-600 pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {campaign.rules && campaign.rules.length > 0 && (
                                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle size={16} className="text-red-500" />
                                        <h3 className="font-black text-red-700">Campaign Rules</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {campaign.rules.map((rule: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-sm text-red-800">
                                                <span className="text-red-400 mt-0.5">•</span> {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── LEADERBOARD ── */}
                    {activeTab === "leaderboard" && (
                        <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {/* Top 3 podium */}
                            {leaderboard.length >= 3 && (
                                <div className="bg-white rounded-2xl p-6 border border-black/5">
                                    <div className="flex items-end justify-center gap-3 mb-4">
                                        {/* 2nd */}
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-2">{leaderboard[1]?.avatar}</div>
                                            <div className="text-xs font-bold truncate max-w-[70px]">{leaderboard[1]?.full_name?.split(' ')[0]}</div>
                                            <div className="h-12 bg-gray-200 rounded-t-xl flex items-center justify-center mt-2">
                                                <span className="text-gray-600 font-black text-xs">2nd</span>
                                            </div>
                                        </div>
                                        {/* 1st */}
                                        <div className="text-center -mt-4">
                                            <div className="text-2xl mb-1">👑</div>
                                            <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-2">{leaderboard[0]?.avatar}</div>
                                            <div className="text-xs font-bold truncate max-w-[80px]">{leaderboard[0]?.full_name?.split(' ')[0]}</div>
                                            <div className="h-16 bg-yellow-400 rounded-t-xl flex items-center justify-center mt-2">
                                                <span className="text-yellow-900 font-black text-xs">1st</span>
                                            </div>
                                        </div>
                                        {/* 3rd */}
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-2">{leaderboard[2]?.avatar}</div>
                                            <div className="text-xs font-bold truncate max-w-[70px]">{leaderboard[2]?.full_name?.split(' ')[0]}</div>
                                            <div className="h-8 bg-orange-200 rounded-t-xl flex items-center justify-center mt-2">
                                                <span className="text-orange-700 font-black text-xs">3rd</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Full list */}
                            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                                <div className="p-4 border-b border-black/5">
                                    <h3 className="font-black">Full Rankings</h3>
                                </div>
                                {leaderboard.map((entry: any, i: number) => {
                                    const isMe = entry.user_id === user?._id;
                                    return (
                                        <div key={entry._id} className={`flex items-center justify-between p-4 border-b border-black/3 ${isMe ? "bg-blue-50" : ""}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-200 text-gray-700" : i === 2 ? "bg-orange-200 text-orange-700" : "bg-zinc-100 text-zinc-500"}`}>
                                                    {i + 1}
                                                </div>
                                                <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-sm">{entry.avatar}</div>
                                                <div>
                                                    <div className="font-bold text-sm">{entry.full_name} {isMe && <span className="text-[10px] text-blue-600 font-black ml-1">(You)</span>}</div>
                                                    {entry.username && <div className="text-[10px] text-gray-400">@{entry.username}</div>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-sm">{entry.referral_count ?? 0} refs</div>
                                                <div className="text-[10px] text-yellow-600 font-bold">{entry.boots_earned ?? 0} BOOTS</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {leaderboard.length === 0 && (
                                    <div className="p-12 text-center text-gray-400">
                                        <Trophy size={32} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">No participants yet</p>
                                        <p className="text-xs mt-1">Be the first to join and top the leaderboard!</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── FRIENDS (referred users) ── */}
                    {activeTab === "friends" && isJoined && (
                        <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
                                <Share2 size={18} className="text-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-800">Share your referral link to grow your team</p>
                                    <p className="text-xs text-blue-600 mt-0.5">You earn {campaign.referral_boots ?? 5} BOOTS for every friend who joins</p>
                                </div>
                            </div>

                            {myReferrals.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 border border-black/5 text-center text-gray-400">
                                    <Users size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-bold">No referrals yet</p>
                                    <p className="text-xs mt-1">Share your referral link to start building your team</p>
                                    <button onClick={copyReferralLink} className="mt-4 px-6 py-2.5 bg-zinc-900 text-white rounded-full text-xs font-bold">
                                        Copy Referral Link
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                                    <div className="p-4 border-b border-black/5">
                                        <h3 className="font-black">Your Team ({myReferrals.length})</h3>
                                    </div>
                                    {myReferrals.map((ref: any) => (
                                        <div key={ref._id} className="flex items-center justify-between p-4 border-b border-black/3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold">{ref.full_name?.[0]}</div>
                                                <div>
                                                    <div className="font-bold text-sm">{ref.full_name}</div>
                                                    {ref.username && <div className="text-[10px] text-gray-400">@{ref.username}</div>}
                                                    <div className="text-[10px] text-gray-400">{ref.referral_count ?? 0} referrals made</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${ref.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {ref.status}
                                                </span>
                                                {isCampus && ref.months_remaining !== undefined && (
                                                    <div className="text-[10px] text-gray-400 mt-1">{ref.months_remaining}mo commission left</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── EARNINGS ── */}
                    {activeTab === "earnings" && isJoined && (
                        <motion.div key="earnings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-2xl p-5 border border-black/5 text-center">
                                    <Zap size={20} className="text-yellow-500 mx-auto mb-2" />
                                    <div className="text-2xl font-black">{myStats?.boots_earned ?? 0}</div>
                                    <div className="text-xs text-gray-400 font-bold">BOOTS Earned</div>
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-black/5 text-center">
                                    <DollarSign size={20} className="text-emerald-500 mx-auto mb-2" />
                                    <div className="text-2xl font-black">₦{(myStats?.cash_earned ?? 0).toLocaleString()}</div>
                                    <div className="text-xs text-gray-400 font-bold">Cash Earned</div>
                                </div>
                            </div>

                            {/* Withdrawal rules */}
                            {isCampus && (
                                <div className="bg-white rounded-2xl p-6 border border-black/5">
                                    <h3 className="font-black mb-3">Withdrawal Rules</h3>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex gap-2"><span className="text-emerald-500">•</span> Minimum withdrawal: <span className="font-bold">₦5,000</span></li>
                                        <li className="flex gap-2"><span className="text-emerald-500">•</span> Maximum per request: <span className="font-bold">₦20,000</span></li>
                                        <li className="flex gap-2"><span className="text-emerald-500">•</span> Max 8 withdrawals per month</li>
                                        <li className="flex gap-2"><span className="text-emerald-500">•</span> Processed within 2 business days</li>
                                    </ul>
                                    {(myStats?.cash_earned ?? 0) >= 5000 ? (
                                        <button onClick={() => setShowWithdrawModal(true)} className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors">
                                            Request Withdrawal
                                        </button>
                                    ) : (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
                                            Earn at least ₦5,000 before you can withdraw. You have ₦{(myStats?.cash_earned ?? 0).toLocaleString()}.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Past withdrawals */}
                            {myWithdrawals.length > 0 && (
                                <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                                    <div className="p-4 border-b border-black/5"><h3 className="font-black">Withdrawal History</h3></div>
                                    {(myWithdrawals as any[]).map((w: any) => (
                                        <div key={w._id} className="flex items-center justify-between p-4 border-b border-black/3">
                                            <div>
                                                <div className="font-bold text-sm">₦{w.amount.toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${w.status === "approved" ? "bg-emerald-100 text-emerald-700" : w.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                                                {w.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Withdrawal Modal ── */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="bg-[#f5f5f7] w-full max-w-lg rounded-t-[3rem] p-8 space-y-5"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-black">Request Withdrawal</h2>
                                <button onClick={() => setShowWithdrawModal(false)} className="p-2 bg-white rounded-full shadow-sm"><X size={18} /></button>
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-sm text-emerald-700 font-bold">
                                Available: ₦{(myStats?.cash_earned ?? 0).toLocaleString()} — Min ₦5,000 | Max ₦20,000
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Bank Name", key: "bank_name", placeholder: "e.g. GTBank" },
                                    { label: "Account Number", key: "account_number", placeholder: "0123456789" },
                                    { label: "Account Name", key: "account_name", placeholder: "Full name on account" },
                                ].map(f => (
                                    <div key={f.key} className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</label>
                                        <input
                                            value={(withdrawForm as any)[f.key]}
                                            onChange={e => setWithdrawForm({ ...withdrawForm, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            className="w-full p-4 bg-white rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm border border-black/5"
                                        />
                                    </div>
                                ))}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount (₦)</label>
                                    <input
                                        type="number"
                                        min={5000}
                                        max={Math.min(20000, myStats?.cash_earned ?? 0)}
                                        value={withdrawForm.amount}
                                        onChange={e => setWithdrawForm({ ...withdrawForm, amount: Number(e.target.value) })}
                                        className="w-full p-4 bg-white rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm border border-black/5"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleWithdraw}
                                disabled={!withdrawForm.bank_name || !withdrawForm.account_number || !withdrawForm.account_name || withdrawForm.amount < 5000}
                                className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:scale-[1.01] transition-transform"
                            >
                                Submit Withdrawal Request
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
