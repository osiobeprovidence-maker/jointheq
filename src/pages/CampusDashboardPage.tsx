
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    GraduationCap,
    TrendingUp,
    Users,
    Zap,
    Calendar,
    Share2,
    ExternalLink,
    Trophy,
    Award,
    Clock
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function CampusDashboardPage() {
    const navigate = useNavigate();
    const { user } = useUser();

    // Auth Check: Find existing user in Convex
    const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as Id<"users"> } : "skip");
    const repInfo = useQuery(api.users.getCampusRep, currentUser ? { userId: currentUser._id } : "skip");
    const invitations = useQuery(api.users.getInvitedUsers, currentUser ? { userId: currentUser._id } : "skip") || [];
    const events = useQuery(api.campus.getEvents, {}) || [];

    // Filter events for their campus
    const myCampusEvents = events.filter(e => e.campus_name === repInfo?.campus_name);

    if (!repInfo && currentUser) {
        return (
            <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ChevronLeft size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Unauthorized</h1>
                    <p className="text-gray-500">This dashboard is only available to verified Campus Ambassadors.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-black text-white px-8 py-3 rounded-full font-bold"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc]">
            {/* Header / Nav */}
            <div className="bg-white border-b border-black/[0.03] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-bold text-sm"
                    >
                        <ChevronLeft size={16} /> Back to Hub
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center">
                            <GraduationCap size={16} className="text-white" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-wider italic">Campus Ambassador</span>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-6 space-y-10 pb-20">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full -mr-20 -mt-20 blur-3xl opacity-20" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold mb-4">
                                <Trophy size={14} className="text-amber-400" />
                                Official Rep for {repInfo?.campus_name}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Welcome Back, {currentUser?.full_name?.split(' ')[0]} 👋</h1>
                            <p className="text-white/60 text-lg">Your campus network has grown by {invitations.length} users this month.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Total Earned</div>
                            <div className="text-3xl font-black">₦{repInfo?.total_earned?.toLocaleString() || '0'}</div>
                            <div className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-tight">Active Payout Stage</div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Referrals"
                        value={invitations.length.toString()}
                        subValue="+3 this week"
                        icon={<Users size={24} />}
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        title="Active Subscriptions"
                        value="12"
                        subValue="4 new starts"
                        icon={<Zap size={24} />}
                        color="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        title="Commission Rate"
                        value={`${(repInfo?.commission_rate || 0.02) * 100}%`}
                        subValue="Performance Level: Silver"
                        icon={<Award size={24} />}
                        color="bg-purple-100 text-purple-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Referral Link & Tooling */}
                        <section className="bg-white p-8 rounded-[3rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Share2 size={20} className="text-blue-500" /> Your Ambassador Link
                            </h2>
                            <div className="space-y-6">
                                <div className="p-6 bg-[#f4f5f8] rounded-[2rem] border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="font-mono text-sm font-bold text-black/60 break-all">
                                        jointheq.sbs/r/{currentUser?.referral_code}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button className="flex-1 sm:flex-none py-3 px-6 bg-zinc-900 text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-all">
                                            Copy Link
                                        </button>
                                        <button className="p-3 bg-white text-black border border-black/5 rounded-full shadow-sm">
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 border border-black/5 rounded-[2rem] hover:bg-black group transition-colors cursor-pointer">
                                        <div className="text-xs font-bold text-gray-400 group-hover:text-white/40 mb-1">DOWNLOAD</div>
                                        <div className="font-black group-hover:text-white">Campus Poster Card</div>
                                    </div>
                                    <div className="p-5 border border-black/5 rounded-[2rem] hover:bg-black group transition-colors cursor-pointer">
                                        <div className="text-xs font-bold text-gray-400 group-hover:text-white/40 mb-1">DOWNLOAD</div>
                                        <div className="font-black group-hover:text-white">QR Code Asset</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Recent Referrals List */}
                        <section className="bg-white p-8 rounded-[3rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" /> Recent Campus Signups
                            </h2>
                            <div className="space-y-3">
                                {invitations.slice(0, 5).map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-[#fdfdfd] border border-black/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                                {u.full_name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">{u.full_name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{u.q_rank}</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400">{new Date(u.created_at).toLocaleDateString()}</div>
                                    </div>
                                ))}
                                {invitations.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 italic text-sm">No referrals yet. Start sharing your link!</div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Campus Events */}
                        <section className="bg-white p-8 rounded-[3rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Calendar size={18} className="text-zinc-400" /> Events
                                </h2>
                                <button className="text-[10px] font-black uppercase text-blue-500">Plan New</button>
                            </div>
                            <div className="space-y-4">
                                {myCampusEvents.map((ev, i) => (
                                    <div key={i} className="p-5 bg-zinc-50 rounded-[2rem] border border-black/5">
                                        <div className="text-[10px] font-black uppercase text-zinc-400 mb-1">{ev.type}</div>
                                        <div className="font-bold text-sm mb-2">{ev.name}</div>
                                        <div className="flex items-center gap-2 text-xs text-black/40 font-bold">
                                            <Calendar size={12} /> {new Date(ev.event_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {myCampusEvents.length === 0 && (
                                    <div className="p-10 bg-[#fdfdfd] rounded-[2.5rem] border border-dashed border-black/10 text-center">
                                        <div className="text-xs text-gray-400 mb-4 italic">No upcoming events planned for your campus.</div>
                                        <button className="text-xs font-bold py-2 px-6 bg-zinc-100 rounded-full">Request Host Kit</button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Leaderboard Suggestion */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-8 text-white relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <TrendingUp size={48} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
                            <h3 className="text-lg font-black mb-2 tracking-tight">University Ranking</h3>
                            <p className="text-white/60 text-xs mb-6">Your campus is currently #4 across the country.</p>
                            <button className="w-full py-3 bg-white text-blue-600 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">View Leaderboard</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, subValue, icon, color }: { title: string, value: string, subValue: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-8 rounded-[3rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
            <div className={`w-14 h-14 ${color} rounded-[2rem] flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <div className="text-[10px] uppercase font-black tracking-widest text-black/30 mb-1">{title}</div>
            <div className="text-3xl font-black mb-1">{value}</div>
            <div className="text-[10px] font-bold text-gray-400">{subValue}</div>
        </div>
    );
}
