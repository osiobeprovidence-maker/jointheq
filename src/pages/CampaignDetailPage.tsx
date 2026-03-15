import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft, Trophy, Share2, Copy, MessageCircle, Users,
    Zap, DollarSign, CheckCircle2, Clock, Target, ChevronRight,
    Star, Gift, Send, X, Wallet, AlertCircle, ExternalLink, Link,
    Activity
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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${active ? "bg-zinc-900 text-white shadow-lg shadow-black/10" : "bg-white text-gray-500 border border-black/5 hover:text-black"}`}>
            {children}
        </button>
    );
}

function TaskStep({ number, title, text }: { number: number; title: string; text: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-xs flex-shrink-0">{number}</div>
            <div>
                <div className="font-bold text-sm mb-0.5">{title}</div>
                <div className="text-xs text-white/40">{text}</div>
            </div>
        </div>
    );
}

export default function CampaignDetailPage() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get("ref");
    const navigate = useNavigate();
    const user = auth.getCurrentUser();

    const [activeTab, setActiveTab] = useState<"overview" | "activity" | "leaderboard" | "friends" | "earnings">("overview");
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
    const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as Id<"users"> } : "skip");
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
    const buyRaffleTicketMut = useMutation(api.campaigns.buyRaffleTicket);

    const isJoined = !!participant;
    const referralLink = `${window.location.host}/campaigns/${campaignId}?ref=${user?._id ?? ""}`;

    const handleJoin = async () => {
        if (!user?._id || !campaignId) return toast.error("Please log in first");
        try {
            await participateMut({
                campaign_id: campaignId as Id<"campaigns">,
                user_id: user._id as Id<"users">,
                referrer_id: (referrerId as Id<"users">) || undefined,
            });
            toast.success("🎉 You've joined the campaign!", { duration: 3000 });
            setActiveTab("activity");
        } catch (e: any) { toast.error(e.message); }
    };

    const copyReferralLink = () => {
        navigator.clipboard.writeText(`https://${referralLink}`);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2500);
    };

    const shareWhatsApp = () => {
        const text = encodeURIComponent(`🔥 Join me on JoinTheQ! Use my referral link to join the "${campaign?.name}" campaign and start earning. https://${referralLink}`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const shareTelegram = () => {
        const text = encodeURIComponent(`🔥 Join me on JoinTheQ! "${campaign?.name}" campaign. https://${referralLink}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(`https://${referralLink}`)}&text=${text}`, "_blank");
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

    const handleBuyTicket = async (count: number) => {
        if (!user?._id || !campaignId) return;
        const cost = 100; // Example cost per ticket
        if ((currentUser?.wallet_balance || 0) < count * cost) {
            return toast.error("Insufficient wallet balance. Top up to continue.");
        }

        try {
            await buyRaffleTicketMut({
                user_id: user._id as Id<"users">,
                campaign_id: campaignId as Id<"campaigns">,
                ticket_count: count,
                cost_per_ticket: cost,
            });
            toast.success(`🎟️ Successfully bought ${count} ticket(s)!`);
        } catch (e: any) {
            toast.error(e.message);
        }
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

    const getEndDate = () => {
        if (!campaign.end_date) return Date.now();
        if (typeof campaign.end_date === "number") return campaign.end_date;
        return new Date(campaign.end_date).getTime();
    };
    const daysLeft = Math.max(0, Math.ceil((getEndDate() - Date.now()) / 86400000));
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

                            {/* Activity Shortcut for members */}
                            <button onClick={() => setActiveTab("activity")} className="w-full py-4 bg-white border border-black/5 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors">
                                <Activity size={18} className="text-blue-500" /> Go to Campaign Task
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
                    <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
                    <TabButton active={activeTab === "activity"} onClick={() => setActiveTab("activity")}>⚡ Activity</TabButton>
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

                    {/* ── ACTIVITY ── */}
                    {activeTab === "activity" && (
                        <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            {!isJoined && (
                                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex flex-col items-center text-center">
                                    <AlertCircle className="text-amber-500 mb-3" size={32} />
                                    <h3 className="font-bold text-amber-900 mb-1">Participation Required</h3>
                                    <p className="text-xs text-amber-700 mb-6">You need to join the campaign before you can carry out activities.</p>
                                    <button onClick={handleJoin} className="bg-zinc-900 text-white px-8 py-3 rounded-full text-xs font-bold">Join Now</button>
                                </div>
                            )}

                            {isJoined && campaign.type === "raffle" && (
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                                <Trophy size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black">Raffle Tickets</h3>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Your Entries: {participant?.entries || 0}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => handleBuyTicket(1)} className="p-6 bg-[#f8f9fa] border border-black/5 rounded-[2rem] hover:border-black transition-colors text-center group">
                                                <div className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform">1</div>
                                                <div className="text-[10px] font-black uppercase text-gray-400">Ticket (₦100)</div>
                                            </button>
                                            <button onClick={() => handleBuyTicket(5)} className="p-6 bg-zinc-900 border border-black/5 rounded-[2rem] text-white text-center group relative overflow-hidden">
                                                <div className="absolute top-2 right-4 bg-blue-500 text-[8px] font-black px-2 py-0.5 rounded-full">POPULAR</div>
                                                <div className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform">5</div>
                                                <div className="text-[10px] font-black uppercase text-white/40">Tickets (₦500)</div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isJoined && (campaign.type === "jar" || campaign.type === "referral" || campaign.type === "campus") && (
                                <div className="space-y-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black">Spread the Word</h3>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fill the Jar by Inviting</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-[#f4f5f8] p-4 rounded-xl border border-black/5 mb-4">
                                            <div className="flex-1 truncate text-xs font-mono text-gray-400">https://{referralLink}</div>
                                            <button onClick={copyReferralLink} className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Copy</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={shareWhatsApp} className="py-3.5 bg-[#25D366] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                                <MessageCircle size={14} /> WhatsApp
                                            </button>
                                            <button onClick={shareTelegram} className="py-3.5 bg-[#2CA5E0] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20">
                                                <Send size={14} /> Telegram
                                            </button>
                                        </div>
                                    </div>

                                    {/* Task Steps */}
                                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white">
                                        <h3 className="text-lg font-black mb-6">Execution Steps</h3>
                                        <div className="space-y-6">
                                            <TaskStep number={1} title="Copy Link" text="Get your unique referral link above." />
                                            <TaskStep number={2} title="Share to Groups" text="Post in your WhatsApp status and student groups." />
                                            <TaskStep number={3} title="Follow Up" text="Remind your friends to complete their subscription slot join." />
                                            <TaskStep number={4} title="Earn Rewards" text="Watch your BOOTS and jar progress grow automatically." />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── LEADERBOARD ── */}
                    {activeTab === "leaderboard" && (
                        <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                                <div className="p-4 border-b border-black/5"><h3 className="font-black">Full Rankings</h3></div>
                                {leaderboard.map((entry: any, i: number) => (
                                    <div key={entry._id} className="flex items-center justify-between p-4 border-b border-black/3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-black text-xs">{i + 1}</div>
                                            <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-sm">{entry.avatar}</div>
                                            <div className="font-bold text-sm">{entry.full_name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-sm">{entry.referral_count ?? 0} refs</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── FRIENDS ── */}
                    {activeTab === "friends" && (
                        <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden p-12 text-center text-gray-400 italic">
                                {myReferrals.length > 0 ? "Friends list coming soon..." : "No referrals yet."}
                            </div>
                        </motion.div>
                    )}

                    {/* ── EARNINGS ── */}
                    {activeTab === "earnings" && (
                        <motion.div key="earnings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Withdrawal Modal logic can be added/restored as needed */}
        </div>
    );
}
