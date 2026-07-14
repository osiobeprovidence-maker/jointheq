import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  UserPlus, Wallet, CreditCard, Music, Gift, Users,
  Trophy, Shield, Activity, Search, Filter, Calendar,
  CheckCircle2, AlertCircle, Clock, XCircle, Loader2,
  ChevronDown, ArrowUpDown, Ticket, Award, DollarSign,
  LogIn, LogOut, ShoppingBag, RefreshCw, Star,
} from "lucide-react";

interface ActivityTimelineProps {
  userId: Id<"users">;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  account: { label: "Account", icon: <UserPlus size={14} />, color: "bg-blue-500" },
  wallet: { label: "Wallet", icon: <Wallet size={14} />, color: "bg-emerald-500" },
  payment: { label: "Payment", icon: <CreditCard size={14} />, color: "bg-violet-500" },
  subscription: { label: "Subscription", icon: <Music size={14} />, color: "bg-rose-500" },
  referral: { label: "Referral", icon: <Users size={14} />, color: "bg-amber-500" },
  raffle: { label: "Raffle", icon: <Trophy size={14} />, color: "bg-orange-500" },
  rewards: { label: "Rewards", icon: <Gift size={14} />, color: "bg-purple-500" },
  admin: { label: "Admin", icon: <Shield size={14} />, color: "bg-zinc-700" },
  support: { label: "Support", icon: <Activity size={14} />, color: "bg-cyan-500" },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  success: { icon: <CheckCircle2 size={14} />, bg: "bg-emerald-100", text: "text-emerald-600" },
  failed: { icon: <AlertCircle size={14} />, bg: "bg-red-100", text: "text-red-600" },
  pending: { icon: <Clock size={14} />, bg: "bg-amber-100", text: "text-amber-600" },
  cancelled: { icon: <XCircle size={14} />, bg: "bg-zinc-100", text: "text-zinc-500" },
};

function getRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ActivityTimeline({ userId }: ActivityTimelineProps) {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);

  const timelineQuery = useQuery(
    api.activities.getUserActivityTimeline,
    { userId, category: category || undefined, status: status || undefined, search: search || undefined, cursor: cursor ?? undefined }
  );

  const summaryQuery = useQuery(api.activities.getUserActivitySummary, { userId });

  const timeline = timelineQuery ?? { activities: [], hasMore: false, cursor: null, total: 0 };

  const handleLoadMore = () => {
    if (timeline.cursor) {
      setCursor(timeline.cursor);
    }
  };

  const handleResetFilters = () => {
    setCategory("");
    setStatus("");
    setSearch("");
    setCursor(null);
  };

  const hasActiveFilters = category || status || search;

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof timeline.activities> = {};
    for (const a of timeline.activities) {
      const dateKey = new Date(a.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    }
    return groups;
  }, [timeline.activities]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      {summaryQuery && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { label: "Total", value: summaryQuery.totalTransactions, icon: <Activity size={13} />, color: "bg-zinc-900" },
            { label: "Wallet Funded", value: `₦${(summaryQuery.totalWalletFunding || 0).toLocaleString()}`, icon: <TrendingUp size={13} />, color: "bg-emerald-500" },
            { label: "Purchases", value: summaryQuery.totalPurchases, icon: <ShoppingBag size={13} />, color: "bg-blue-500" },
            { label: "Failed", value: summaryQuery.failedPayments, icon: <AlertCircle size={13} />, color: "bg-red-500" },
            { label: "Active Subs", value: summaryQuery.activeSubscriptions, icon: <RefreshCw size={13} />, color: "bg-purple-500" },
            { label: "Last Activity", value: summaryQuery.lastActivityDate ? new Date(summaryQuery.lastActivityDate).toLocaleDateString() : "N/A", icon: <Clock size={13} />, color: "bg-amber-500" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-black/5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-5 h-5 rounded-lg ${card.color} flex items-center justify-center text-white`}>{card.icon}</div>
              </div>
              <div className="text-base font-black">{card.value}</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            placeholder="Search activities..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCursor(null); }}
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-black/10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>
        <div className="relative">
          <select value={category} onChange={e => { setCategory(e.target.value); setCursor(null); }}
            className="h-9 pl-3 pr-8 rounded-xl border border-black/10 text-[10px] font-black uppercase tracking-wider bg-white appearance-none cursor-pointer">
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>
        <div className="relative">
          <select value={status} onChange={e => { setStatus(e.target.value); setCursor(null); }}
            className="h-9 pl-3 pr-8 rounded-xl border border-black/10 text-[10px] font-black uppercase tracking-wider bg-white appearance-none cursor-pointer">
            <option value="">All Statuses</option>
            {["success", "failed", "pending", "cancelled"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>
        {hasActiveFilters && (
          <button onClick={handleResetFilters}
            className="h-9 px-3 rounded-xl border border-black/10 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 transition-colors">
            Clear
          </button>
        )}
        <div className="text-[10px] font-bold text-zinc-400 ml-auto">
          {timeline.total} event{timeline.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {!timelineQuery ? (
          <div className="bg-white border border-black/5 rounded-[1.5rem] p-12 text-center">
            <Loader2 size={28} className="mx-auto mb-3 text-zinc-300 animate-spin" />
            <p className="font-bold text-zinc-500">Loading activities...</p>
          </div>
        ) : timeline.activities.length === 0 ? (
          <div className="bg-white border border-black/5 rounded-[1.5rem] p-12 text-center">
            <Activity size={36} className="mx-auto mb-3 text-zinc-300" />
            <p className="font-bold text-zinc-500">No activity found</p>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="mt-2 text-xs font-bold text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-zinc-100 hidden sm:block" />

            {Object.entries(groupedByDate).map(([dateKey, activities]) => (
              <div key={dateKey}>
                {/* Date header */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm py-2.5 mb-1 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-zinc-400 shrink-0" />
                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">{dateKey}</span>
                    <span className="text-[10px] text-zinc-300 font-bold ml-auto">{activities.length} event{activities.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pb-4">
                  {activities.map((a) => {
                    const catCfg = CATEGORY_CONFIG[a.category] || { label: a.category, icon: <Activity size={14} />, color: "bg-zinc-500" };
                    const statCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.success;

                    return (
                      <div key={a.id} className="relative flex items-start gap-3 group">
                        {/* Timeline dot */}
                        <div className="hidden sm:flex flex-col items-center shrink-0 pt-1.5">
                          <div className={`w-[10px] h-[10px] rounded-full ${catCfg.color} ring-2 ring-white z-10`} />
                        </div>

                        {/* Content card */}
                        <div className="flex-1 min-w-0 bg-white border border-black/5 hover:border-black/10 rounded-xl p-3.5 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-7 h-7 rounded-lg ${catCfg.color}/10 flex items-center justify-center shrink-0`}>
                                <span className={catCfg.color.replace("bg-", "text-")}>{catCfg.icon}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black">{a.action}</span>
                                  {a.status !== "success" && (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${statCfg.bg} ${statCfg.text}`}>
                                      {statCfg.icon}
                                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                    </span>
                                  )}
                                </div>
                                {a.description && (
                                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{a.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">
                                {formatDate(a.created_at).split(" • ")[1]}
                              </div>
                              <div className="text-[9px] text-zinc-300 font-semibold">
                                {getRelativeTime(a.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Bottom metadata row */}
                          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-1.5 py-0.5 rounded">
                              {catCfg.label}
                            </span>
                            {a.amount != null && (
                              <span className={`text-[10px] font-black ${a.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {a.amount >= 0 ? "+" : ""}₦{Math.abs(a.amount).toLocaleString()}
                              </span>
                            )}
                            {a.reference && (
                              <span className="text-[9px] font-mono text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">
                                Ref: {a.reference.length > 20 ? a.reference.slice(0, 20) + "..." : a.reference}
                              </span>
                            )}
                            {a.metadata?.admin_name && (
                              <span className="text-[9px] text-zinc-400">
                                by {a.metadata.admin_name}
                              </span>
                            )}
                            {a.metadata?.ticketCount && (
                              <span className="text-[9px] text-zinc-400">
                                {a.metadata.ticketCount} ticket{a.metadata.ticketCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {a.metadata?.rewardTickets && (
                              <span className="text-[9px] text-amber-600 font-bold">
                                +{a.metadata.rewardTickets} ticket{a.metadata.rewardTickets !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More */}
            {timeline.hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  className="h-9 px-5 rounded-xl bg-zinc-100 text-[10px] font-black text-zinc-600 hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <Loader2 size={12} className="animate-spin" /> Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingUp({ size }: { size?: number }) {
  return (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
