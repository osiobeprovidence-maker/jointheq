import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { Link } from "react-router-dom";
import { Id } from "../../convex/_generated/dataModel";
import { Users, Search, ChevronLeft, CheckCircle2, Clock, XCircle, Filter } from "lucide-react";

const STATUS_STYLES: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200/50", label: "Pending", icon: <Clock size={12} /> },
    completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/50", label: "Completed", icon: <CheckCircle2 size={12} /> },
    rejected: { color: "bg-red-50 text-red-600 border-red-200/50", label: "Rejected", icon: <XCircle size={12} /> },
};

export default function ReferralsPage() {
    const currentUser = auth.getCurrentUser();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const referrals = useQuery(api.referrals.getUserReferrals, currentUser ? { userId: currentUser._id as Id<"users"> } : "skip");

    const filtered = useMemo(() => {
        if (!referrals) return [];
        let f = referrals;
        if (statusFilter !== "all") f = f.filter(r => r.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            f = f.filter(r => r.referred_user_name?.toLowerCase().includes(q) || r.subscription_joined?.toLowerCase().includes(q));
        }
        return f.sort((a, b) => b.created_at - a.created_at);
    }, [referrals, statusFilter, search]);

    const counts = useMemo(() => ({
        all: referrals?.length ?? 0,
        pending: referrals?.filter(r => r.status === "pending").length ?? 0,
        completed: referrals?.filter(r => r.status === "completed").length ?? 0,
        rejected: referrals?.filter(r => r.status === "rejected").length ?? 0,
    }), [referrals]);

    return (
        <div className="min-h-screen bg-[#f4f5f8]">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-zinc-900 transition-colors">
                    <ChevronLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center gap-3">
                    <Users size={24} className="text-zinc-900" />
                    <h1 className="text-xl font-black text-zinc-900">My Referrals</h1>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total", value: counts.all, color: "bg-zinc-900 text-white" },
                        { label: "Completed", value: counts.completed, color: "bg-emerald-500 text-white" },
                        { label: "Pending", value: counts.pending, color: "bg-amber-500 text-white" },
                        { label: "Rejected", value: counts.rejected, color: "bg-red-500 text-white" },
                    ].map(s => (
                        <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                            <div className="text-2xl font-black">{s.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <label className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or subscription..."
                            className="w-full h-10 rounded-2xl border border-black/5 bg-white pl-9 pr-3 text-xs font-bold outline-none focus:border-zinc-900" />
                    </label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="h-10 rounded-2xl border border-black/5 bg-white px-3 text-xs font-bold outline-none focus:border-zinc-900">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-black/5">
                                    {["Referred User", "Subscription", "Status", "Date"].map(h => (
                                        <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-400 font-bold">No referrals found</td></tr>
                                ) : filtered.map(r => {
                                    const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                                    return (
                                        <tr key={r._id} className="border-b border-black/5 last:border-0 hover:bg-zinc-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-black shrink-0">
                                                        {r.referred_user_name?.[0] || "?"}
                                                    </div>
                                                    <span className="text-sm font-bold text-zinc-900">{r.referred_user_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-zinc-700">{r.subscription_joined || "—"}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black ${st.color}`}>
                                                    {st.icon} {st.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
