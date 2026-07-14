import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Award, Ticket, Users, Gift, Sparkles,
  CheckCircle2, XCircle, Clock, Search, Edit3,
  Eye, Loader2, Copy, ChevronDown,
  Music, Ban, RefreshCw,
  AlertCircle, X, ChevronRight, Palette, Image,
  ListOrdered, DollarSign, BarChart3, Medal,
  Upload, ImageIcon, ToggleLeft, ToggleRight,
  Calendar, Clock as ClockIcon, Sun, Repeat2,
  HelpCircle, Trash2, ExternalLink, Globe, MessageCircle,
  Instagram, Twitter, Youtube, Smartphone, Link,
  ThumbsUp, UserCheck, Activity
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import { uploadCampaignImage, validateImage } from "../../lib/storage";
import toast from "react-hot-toast";

type RaffleStatus = "draft" | "published" | "closed" | "completed";
type Tab = "all" | "draft" | "published" | "closed" | "completed";

const PRESET_COLORS = [
  "#1DB954", "#191414", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F1948A", "#82E0AA", "#F8C471", "#AED6F1", "#D7BDE2",
  "#A3E4D7", "#FADBD8", "#D5F5E3", "#FCF3CF", "#D6EAF8",
];

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        {sub && <p className="text-sm font-medium text-zinc-500 mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100", text: "text-zinc-600", label: "Draft" },
  published: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Published" },
  closed: { bg: "bg-amber-100", text: "text-amber-600", label: "Closed" },
  completed: { bg: "bg-blue-100", text: "text-blue-600", label: "Completed" },
};

function RaffleStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export function RaffleAdmin() {
  const user = auth.getCurrentUser();
  const adminId = (user?._id || "") as Id<"users">;

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selectedRaffleId, setSelectedRaffleId] = useState<Id<"raffles"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRaffleId, setEditingRaffleId] = useState<Id<"raffles"> | null>(null);

  const allRaffles = useQuery(api.raffle.getAllRaffles);
  const selectedRaffle = useQuery(
    api.raffle.getRaffleById,
    selectedRaffleId ? { raffleId: selectedRaffleId } : "skip"
  );
  const entries = useQuery(
    api.raffle.getAllEntries,
    selectedRaffleId ? { raffleId: selectedRaffleId } : "skip"
  );
  const winners = useQuery(
    api.raffle.getRaffleWinners,
    selectedRaffleId ? { raffleId: selectedRaffleId } : "skip"
  );
  const stats = useQuery(
    api.raffle.getRaffleStats,
    selectedRaffleId ? { raffleId: selectedRaffleId } : "skip"
  );
  const leaderboard = useQuery(
    api.raffle.getLeaderboard,
    selectedRaffleId ? { raffleId: selectedRaffleId, limit: 5 } : "skip"
  );

  const dashboard = useQuery(api.raffle.getRaffleDashboard);

  const createRaffleFn = useMutation(api.raffle.createRaffle);
  const updateRaffleFn = useMutation(api.raffle.updateRaffle);
  const drawWinnerFn = useAction(api.raffle.drawWinner);
  const publishWinnerFn = useMutation(api.raffle.publishWinner);
  const updateStatusFn = useMutation(api.raffle.updateRaffleStatus);

  const filteredRaffles = (allRaffles || []).filter((r: any) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title?.toLowerCase().includes(q) || r.slug?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDrawWinner = useCallback(async (raffleId: Id<"raffles">) => {
    if (!confirm("Draw winner for this raffle? This will complete the raffle.")) return;
    try {
      const result = await drawWinnerFn({ raffleId, adminId });
      toast.success(`Winner drawn! ${result.winner.name} won ₦${result.winner.prize.toLocaleString()}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to draw winner");
    }
  }, [adminId, drawWinnerFn]);

  const handlePublishWinner = useCallback(async (raffleId: Id<"raffles">) => {
    try {
      await publishWinnerFn({ adminId, raffleId });
      toast.success("Winner published!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish winner");
    }
  }, [adminId, publishWinnerFn]);

  const handleUpdateStatus = useCallback(async (raffleId: Id<"raffles">, status: string) => {
    try {
      await updateRaffleFn({ adminId, raffleId, status });
      toast.success(`Status changed to ${status}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  }, [adminId, updateRaffleFn]);

  const handleCopyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Raffle ID copied");
  }, []);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: allRaffles?.length },
    { id: "published", label: "Published", count: allRaffles?.filter((r: any) => r.status === "published").length },
    { id: "draft", label: "Draft", count: allRaffles?.filter((r: any) => r.status === "draft").length },
    { id: "closed", label: "Closed", count: allRaffles?.filter((r: any) => r.status === "closed").length },
    { id: "completed", label: "Completed", count: allRaffles?.filter((r: any) => r.status === "completed").length },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Raffle Manager"
        sub="Create, manage, and draw winners for Spotify raffles"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all"
          >
            <Plus size={16} /> New Raffle
          </button>
        }
      />

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total Raffles", value: dashboard.totalRaffles, icon: <Award size={14} />, color: "bg-zinc-900" },
            { label: "Participants", value: dashboard.totalParticipants, icon: <Users size={14} />, color: "bg-blue-500" },
            { label: "Total Tickets", value: dashboard.totalTickets, icon: <Ticket size={14} />, color: "bg-purple-500" },
            { label: "Referral Tickets", value: dashboard.referralTickets, icon: <Gift size={14} />, color: "bg-emerald-500" },
            { label: "Winners Selected", value: dashboard.winnersSelected, icon: <Medal size={14} />, color: "bg-amber-500" },
            { label: "Prize Paid", value: `₦${dashboard.totalPrizePaid.toLocaleString()}`, icon: <DollarSign size={14} />, color: "bg-rose-500" },
            { label: "Spotify Eligible", value: dashboard.spotifyEligible, icon: <Music size={14} />, color: "bg-green-600" },
            { label: "Weekly Growth", value: dashboard.weeklyGrowth, icon: <BarChart3 size={14} />, color: "bg-cyan-500" },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-black/5 rounded-2xl p-3">
              <div className={`w-7 h-7 rounded-xl ${card.color} flex items-center justify-center text-white mb-1.5`}>{card.icon}</div>
              <div className="text-lg font-black">{card.value}</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {dashboard?.activeRaffle && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-[2rem] p-4 sm:p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Active Raffle</p>
            <p className="text-lg font-black mt-0.5">{dashboard.activeRaffle.title}</p>
            {dashboard.upcomingDraw && (
              <p className="text-xs font-bold text-white/80 mt-1">
                Next draw: {dashboard.upcomingDraw.nextDrawDate ? new Date(dashboard.upcomingDraw.nextDrawDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                {dashboard.upcomingDraw.frequency && dashboard.upcomingDraw.frequency !== "one_time" && ` (${dashboard.upcomingDraw.frequency})`}
              </p>
            )}
          </div>
          <Award size={32} className="text-white/40" />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-black transition-colors ${
              tab === t.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                tab === t.id ? "bg-white/20" : "bg-zinc-200"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search raffles..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-black/5 bg-zinc-50 text-sm font-medium outline-none focus:border-zinc-900 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          {!allRaffles ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
            </div>
          ) : filteredRaffles.length === 0 ? (
            <div className="bg-white border border-black/5 rounded-[2rem] p-12 text-center">
              <Award size={40} className="mx-auto text-zinc-300 mb-3" />
              <h3 className="text-lg font-bold mb-1">No raffles found</h3>
              <p className="text-sm text-zinc-500 mb-4">Create a new raffle to get started.</p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all">
                <Plus size={16} /> New Raffle
              </button>
            </div>
          ) : (
            filteredRaffles.map((raffle: any) => (
              <motion.div
                key={raffle._id}
                layout
                className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer hover:shadow-md ${
                  selectedRaffleId === raffle._id ? "border-zinc-900 shadow-md" : "border-black/5"
                }`}
                onClick={() => setSelectedRaffleId(raffle._id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-base truncate">{raffle.title}</h3>
                      <RaffleStatusBadge status={raffle.status} />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium truncate">/{raffle.slug}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1"><Award size={12} /> ₦{raffle.prizeAmount.toLocaleString()}</span>
                      {raffle.prizes && raffle.prizes.length > 0 && (
                        <span className="flex items-center gap-1"><ListOrdered size={12} /> {raffle.prizes.length} prize tiers</span>
                      )}
                      <span className="flex items-center gap-1"><Users size={12} /> +{raffle.referralReward} tickets/ref</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(raffle.drawDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingRaffleId(raffle._id); }}
                      className="h-8 w-8 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition-colors"
                      title="Edit raffle"
                    >
                      <Edit3 size={14} />
                    </button>
                    <ChevronRight size={18} className={`text-zinc-300 mt-1 transition-transform ${
                      selectedRaffleId === raffle._id ? "rotate-90" : ""
                    }`} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="xl:col-span-1">
          {selectedRaffleId && selectedRaffle ? (
            <RaffleDetail
              raffle={selectedRaffle}
              entries={entries || []}
              winners={winners || []}
              stats={stats || null}
              leaderboard={leaderboard || []}
              adminId={adminId}
              onDrawWinner={() => handleDrawWinner(selectedRaffleId)}
              onPublishWinner={() => handlePublishWinner(selectedRaffleId)}
              onUpdateStatus={(status) => handleUpdateStatus(selectedRaffleId, status)}
              onCopyId={() => handleCopyId(selectedRaffleId)}
              onClose={() => setSelectedRaffleId(null)}
            />
          ) : (
            <div className="bg-white border border-black/5 rounded-[2rem] p-8 text-center h-full flex flex-col items-center justify-center">
              <Award size={36} className="text-zinc-300 mb-3" />
              <p className="text-sm font-bold text-zinc-500">Select a raffle to manage</p>
              <p className="text-xs text-zinc-400 mt-1">View entries, draw winners, and more.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateRaffleModal
            adminId={adminId}
            onClose={() => setShowCreate(false)}
            onCreated={(id) => {
              setShowCreate(false);
              setSelectedRaffleId(id);
            }}
          />
        )}
        {editingRaffleId && (
          <EditRaffleModal
            key="edit"
            raffleId={editingRaffleId}
            adminId={adminId}
            allRaffles={allRaffles || []}
            onClose={() => setEditingRaffleId(null)}
            onUpdated={() => setEditingRaffleId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RaffleDetail({
  raffle, entries, winners, stats, leaderboard, adminId,
  onDrawWinner, onPublishWinner, onUpdateStatus, onCopyId, onClose,
}: {
  raffle: any;
  entries: any[];
  winners: any[];
  stats: any;
  leaderboard: any[];
  adminId: Id<"users">;
  onDrawWinner: () => void;
  onPublishWinner: () => void;
  onUpdateStatus: (status: string) => void;
  onCopyId: () => void;
  onClose: () => void;
}) {
  const totalTickets = entries.reduce((sum: number, e: any) => sum + e.ticketCount, 0);
  const isCompleted = raffle.status === "completed";
  const isPublished = raffle.status === "published";
  const completedRefs = entries.filter((e: any) => e.referralSource).length;
  const avgTicketsPerUser = entries.length > 0 ? (totalTickets / entries.length).toFixed(1) : "0";
  const referralTickets = stats?.referralTickets ?? 0;

  const activities = useQuery(
    api.raffle.getRaffleActivities,
    raffle._id ? { raffleId: raffle._id } : "skip"
  );

  const [showConfig, setShowConfig] = useState(false);
  const [showBonusTasks, setShowBonusTasks] = useState(false);
  const [showBonusTaskEditor, setShowBonusTaskEditor] = useState(false);
  const [editingBonusTask, setEditingBonusTask] = useState<any>(null);

  const bonusTasks = useQuery(
    api.raffle.getBonusTasks,
    raffle._id ? { raffleId: raffle._id, includeInactive: true } : "skip"
  );
  const bonusStats = useQuery(
    api.raffle.getRaffleBonusStats,
    raffle._id ? { raffleId: raffle._id } : "skip"
  );
  const createBonusTask = useMutation(api.raffle.createBonusTask);
  const updateBonusTask = useMutation(api.raffle.updateBonusTask);
  const deleteBonusTask = useMutation(api.raffle.deleteBonusTask);
  const reorderBonusTasks = useMutation(api.raffle.reorderBonusTasks);

  const handleCreateBonusTask = useCallback(async (data: any) => {
    try {
      await createBonusTask({ ...data, raffleId: raffle._id, createdBy: adminId });
      toast.success("Bonus task created");
      setShowBonusTaskEditor(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create bonus task");
    }
  }, [raffle._id, adminId, createBonusTask]);

  const handleUpdateBonusTask = useCallback(async (taskId: any, data: any) => {
    try {
      await updateBonusTask({ taskId, ...data });
      toast.success("Bonus task updated");
      setEditingBonusTask(null);
      setShowBonusTaskEditor(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update bonus task");
    }
  }, [updateBonusTask]);

  const handleDeleteBonusTask = useCallback(async (taskId: any) => {
    if (!confirm("Delete this bonus task? This cannot be undone.")) return;
    try {
      await deleteBonusTask({ taskId });
      toast.success("Bonus task deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete bonus task");
    }
  }, [deleteBonusTask]);

  const handleToggleTaskActive = useCallback(async (task: any) => {
    try {
      await updateBonusTask({ taskId: task._id, isActive: !task.isActive });
      toast.success(`Task ${task.isActive ? "disabled" : "enabled"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle task");
    }
  }, [updateBonusTask]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white border border-black/5 rounded-[2rem] p-6 space-y-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-black text-lg">{raffle.title}</h3>
          <p className="text-xs text-zinc-500 font-medium">/{raffle.slug}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Prize Pool</div>
          <div className="text-lg font-black">₦{raffle.prizeAmount.toLocaleString()}</div>
          {raffle.numberOfWinners > 1 && <div className="text-[10px] text-zinc-500 font-bold">{raffle.numberOfWinners} winners</div>}
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
            {raffle.frequency && raffle.frequency !== "one_time" ? "Next Draw" : "Draw Date"}
          </div>
          <div className="text-lg font-black">{new Date(raffle.nextDrawDate || raffle.drawDate).toLocaleDateString()}</div>
          {raffle.frequency && raffle.frequency !== "one_time" && (
            <div className="text-[10px] text-zinc-500 font-bold capitalize">{raffle.frequency} &middot; Round {raffle.drawRound || 0}</div>
          )}
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Participants</div>
          <div className="text-lg font-black">{entries.length}</div>
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Tickets</div>
          <div className="text-lg font-black">{totalTickets}</div>
        </div>
      </div>

      {/* Live Analytics */}
      <div className="border-t border-black/5 pt-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
          <BarChart3 size={14} /> Live Analytics
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Participants</div>
            <div className="text-base font-black">{stats?.totalParticipants ?? entries.length}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Tickets</div>
            <div className="text-base font-black">{stats?.totalTickets ?? totalTickets}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Referrals</div>
            <div className="text-base font-black">{stats?.totalReferrals ?? completedRefs}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Referral Tickets</div>
            <div className="text-base font-black">{referralTickets}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Avg Tickets/User</div>
            <div className="text-base font-black">{avgTicketsPerUser}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Days Remaining</div>
            <div className="text-base font-black">{stats?.daysRemaining ?? "-"}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Draw Round</div>
            <div className="text-base font-black">{raffle.drawRound || 0}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Frequency</div>
            <div className="text-base font-black capitalize">{raffle.frequency || "one_time"}</div>
          </div>
        </div>
      </div>

      {/* Configuration Summary (collapsible) */}
      <div className="border-t border-black/5 pt-5">
        <button onClick={() => setShowConfig(!showConfig)}
          className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 w-full">
          Settings & Configuration
          <ChevronRight size={14} className={`transition-transform ${showConfig ? "rotate-90" : ""}`} />
        </button>
        {showConfig && (
          <div className="mt-3 space-y-3">
            {/* Automation */}
            {raffle.autoDraw !== undefined && (
              <div className="bg-zinc-50 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Automation</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Auto Draw", on: raffle.autoDraw },
                    { label: "Auto Publish", on: raffle.autoPublish },
                    { label: "Auto Notify", on: raffle.autoNotify },
                    { label: "Auto Next", on: raffle.autoGenerateNext },
                    { label: "Lock Entries", on: raffle.autoLockEntries },
                  ].map(t => (
                    <span key={t.label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
                      t.on ? "bg-emerald-100 text-emerald-600" : "bg-zinc-200 text-zinc-400"
                    }`}>
                      {t.on ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Referral Settings */}
            <div className="bg-zinc-50 rounded-xl p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Referral Settings</div>
              <div className="text-xs font-bold text-zinc-600">
                {raffle.referralEnabled === false ? (
                  <span className="text-red-500">Referrals disabled</span>
                ) : (
                  <>
                    <div>+{raffle.referralReward} tickets per referral</div>
                    {raffle.maxReferralTickets && <div>Max {raffle.maxReferralTickets} referral tickets</div>}
                    {raffle.maxReferralsPerUser && <div>Max {raffle.maxReferralsPerUser} referrals/user</div>}
                  </>
                )}
              </div>
            </div>

            {/* Eligibility Rules */}
            {raffle.eligibilityRules && raffle.eligibilityRules.length > 0 && (
              <div className="bg-zinc-50 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Eligibility Rules ({raffle.eligibilityRules.length})</div>
                <div className="space-y-1">
                  {raffle.eligibilityRules.map((r: any, i: number) => (
                    <div key={i} className="text-xs font-bold text-zinc-600">
                      {r.field} {r.operator} {r.value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {raffle.notificationSettings && (
              <div className="bg-zinc-50 rounded-xl p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Notifications</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Entry", on: raffle.notificationSettings.onEntry },
                    { label: "Referral", on: raffle.notificationSettings.onReferral },
                    { label: "Winner", on: raffle.notificationSettings.onWinnerAnnounce },
                    { label: "Reminder", on: raffle.notificationSettings.onDrawReminder },
                    { label: "Claimed", on: raffle.notificationSettings.onPrizeClaimed },
                  ].map(t => (
                    <span key={t.label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
                      t.on ? "bg-blue-100 text-blue-600" : "bg-zinc-200 text-zinc-400"
                    }`}>
                      {t.on ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="border-t border-black/5 pt-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
            <Medal size={14} /> Top Leaderboard
          </h4>
          <div className="space-y-1">
            {leaderboard.map((entry: any) => (
              <div key={entry.userId} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-zinc-400 w-4">#{entry.rank}</span>
                  <span className="font-bold">@{entry.username}</span>
                </div>
                <span className="font-black text-emerald-600">{entry.ticketCount} tickets</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prize Tiers */}
      {raffle.prizes && raffle.prizes.length > 0 && (
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Prize Tiers</div>
          <div className="space-y-2">
            {raffle.prizes.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-bold">{p.label}</span>
                <span className="font-black text-emerald-600">₦{p.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <RaffleStatusBadge status={raffle.status} />
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
          Referral Reward: +{raffle.referralReward} tickets
        </span>
        {raffle.accentColor && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            <Palette size={12} /> <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: raffle.accentColor }} />
          </span>
        )}
      </div>

      {raffle.description && (
        <p className="text-sm text-zinc-600">{raffle.description}</p>
      )}

      {/* Actions */}
      <div className="border-t border-black/5 pt-5 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Actions</h4>
        <div className="flex gap-2">
          {raffle.status === "draft" && (
            <button onClick={() => onUpdateStatus("published")}
              className="flex-1 h-11 rounded-2xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 size={16} /> Publish Raffle
            </button>
          )}
          {isPublished && !isCompleted && (
            <button onClick={onDrawWinner}
              className="flex-1 h-11 rounded-2xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Sparkles size={16} /> Draw Winner
            </button>
          )}
          {raffle.status === "published" && (
            <button onClick={() => onUpdateStatus("closed")}
              className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all flex items-center justify-center">
              <Ban size={16} />
            </button>
          )}
          {raffle.status === "closed" && (
            <button onClick={() => onUpdateStatus("published")}
              className="flex-1 h-11 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5">
              <RefreshCw size={14} /> Reopen
            </button>
          )}
        </div>

        {isCompleted && !raffle.winnerAnnounced && (
          <button onClick={onPublishWinner}
            className="w-full h-11 rounded-2xl bg-blue-500 text-white text-xs font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 size={16} /> Publish Winner
          </button>
        )}

        <button onClick={onCopyId}
          className="w-full h-10 rounded-xl border border-black/5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-all flex items-center justify-center gap-1.5">
          <Copy size={14} /> Copy Raffle ID
        </button>
      </div>

      {/* Winners */}
      {winners.length > 0 && (
        <div className="border-t border-black/5 pt-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Winners ({winners.length})</h4>
          <div className="space-y-2">
            {winners.map((w: any) => (
              <div key={w._id} className="bg-zinc-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">
                  #{w.position}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">User {w.userId.slice(-8)}</p>
                  <p className="text-[10px] text-zinc-500 font-medium">{new Date(w.announcedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">₦{w.prize.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <div className="border-t border-black/5 pt-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
            Entries ({entries.length})
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {entries.map((e: any) => (
              <div key={e._id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-50 text-xs">
                <span className="font-mono font-bold text-zinc-700">{e.raffleNumber || "—"}</span>
                <span className="text-zinc-500 font-medium">{e.userId.slice(-8)}</span>
                <span className="font-black">{e.ticketCount} ticket{e.ticketCount !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="border-t border-black/5 pt-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
          Activity Timeline
        </h4>
        {!activities ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-zinc-300" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-xs text-zinc-400 font-medium text-center py-4">No activity yet</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {activities.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-zinc-50">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  act.type === "winner" ? "bg-amber-100 text-amber-600" :
                  act.type === "referral" ? "bg-purple-100 text-purple-600" :
                  "bg-blue-100 text-blue-600"
                }`}>
                  {act.type === "winner" ? <Medal size={12} /> : act.type === "referral" ? <Gift size={12} /> : <Users size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold truncate">{act.action}</p>
                    {act.user && (
                      <span className="text-[10px] text-zinc-400 font-medium truncate">@{act.user.username || act.user.full_name?.split(" ")[0]}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500">{act.description}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(act.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bonus Tasks */}
      <div className="border-t border-black/5 pt-5">
        <button onClick={() => setShowBonusTasks(!showBonusTasks)}
          className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 w-full">
          <Gift size={14} /> Bonus Tasks ({bonusTasks?.length ?? 0})
          <ChevronRight size={14} className={`transition-transform ${showBonusTasks ? "rotate-90" : ""}`} />
        </button>
        {showBonusTasks && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              {bonusStats && (
                <span className="text-[10px] text-zinc-500 font-medium">
                  {bonusStats.totalCompletions} completions &middot; {bonusStats.totalBonusTickets} bonus tickets awarded
                </span>
              )}
              <button onClick={() => { setEditingBonusTask(null); setShowBonusTaskEditor(true); }}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-zinc-900 text-white text-[10px] font-black hover:bg-zinc-800">
                <Plus size={12} /> New Task
              </button>
            </div>
            {!bonusTasks ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-zinc-300" />
              </div>
            ) : bonusTasks.length === 0 ? (
              <p className="text-xs text-zinc-400 font-medium text-center py-4">No bonus tasks created yet</p>
            ) : (
              <div className="space-y-2">
                {bonusTasks.map((task: any) => (
                  <div key={task._id} className="bg-zinc-50 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center shrink-0">
                      {PLATFORM_ICONS[task.platform] || <Gift size={14} className="text-zinc-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{task.name}</span>
                        {task.isActive ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-black">Active</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-400 font-black">Disabled</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate">{task.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-emerald-600">+{task.rewardTickets} tickets</span>
                        <span className="text-[9px] text-zinc-400">{task.verificationMethod.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleTaskActive(task)}
                        className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-600"
                        title={task.isActive ? "Disable" : "Enable"}>
                        {task.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button onClick={() => { setEditingBonusTask(task); setShowBonusTaskEditor(true); }}
                        className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-600">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => handleDeleteBonusTask(task._id)}
                        className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-red-400 hover:text-red-600">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bonus Task Editor Modal */}
      <AnimatePresence>
        {showBonusTaskEditor && (
          <BonusTaskEditor
            task={editingBonusTask}
            onSave={(data: any) => {
              if (editingBonusTask) {
                handleUpdateBonusTask(editingBonusTask._id, data);
              } else {
                handleCreateBonusTask(data);
              }
            }}
            onClose={() => { setShowBonusTaskEditor(false); setEditingBonusTask(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
      <div>
        <span className="text-xs font-bold">{label}</span>
        {desc && <p className="text-[10px] text-zinc-500 font-medium">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function BannerUpload({ currentUrl, onUpload, onRemove }: { currentUrl?: string; onUpload: (url: string) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const resolveUploadUrl = useQuery(api.storage.getUrl, currentUrl ? { storageId: currentUrl as any } : "skip");

  const hasImage = preview || currentUrl;

  const handleFile = useCallback(async (file: File | null) => {
    setError(null);
    if (!file) return;
    const validationError = validateImage(file);
    if (validationError) { setError(validationError); return; }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadCampaignImage(file, () => generateUploadUrl(), async ({ storageId }) => {
        const result = await (await import("convex/react")).useQuery(api.storage.getUrl, { storageId: storageId as any });
        return result || "";
      }, setProgress);
      onUpload(url);
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
      setUploading(false);
    }
  }, [generateUploadUrl, onUpload]);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Banner Image</label>
      {hasImage && !uploading ? (
        <div className="relative rounded-xl border border-black/10 overflow-hidden group">
          <img src={preview || currentUrl} alt="Banner" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} className="h-9 px-4 rounded-xl bg-white text-zinc-900 text-[10px] font-black">Replace</button>
            <button type="button" onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(null); onRemove(); }} className="h-9 w-9 rounded-xl bg-red-500 text-white flex items-center justify-center"><X size={14} /></button>
          </div>
        </div>
      ) : uploading ? (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-6 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin mx-auto mb-2" />
          <div className="text-xs font-bold text-zinc-700">Uploading... {progress}%</div>
          <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} className="rounded-xl border-2 border-dashed border-black/10 hover:border-black/30 bg-zinc-50 cursor-pointer p-8 text-center">
          <ImageIcon size={28} className="mx-auto mb-2 text-zinc-300" />
          <div className="text-sm font-bold text-zinc-500">Click to upload banner</div>
          <div className="text-[10px] font-semibold text-zinc-400 mt-1">JPG, PNG, WebP (max 5MB)</div>
        </div>
      )}
      {error && <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black"><AlertCircle size={12} /> {error}</div>}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => handleFile(e.target.files?.[0] ?? null)} className="hidden" />
    </div>
  );
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

function EditRaffleModal({ raffleId, adminId, allRaffles, onClose, onUpdated }: {
  raffleId: Id<"raffles">;
  adminId: Id<"users">;
  allRaffles: any[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const raffle = allRaffles.find((r: any) => r._id === raffleId);
  const updateRaffleFn = useMutation(api.raffle.updateRaffle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic info
  const [title, setTitle] = useState(raffle?.title || "");
  const [slug, setSlug] = useState(raffle?.slug || "");
  const [description, setDescription] = useState(raffle?.description || "");
  const [status, setStatus] = useState(raffle?.status || "draft");
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(raffle?.banner);
  const [accentColor, setAccentColor] = useState(raffle?.accentColor || "#1DB954");

  // Prize
  const [prizeAmount, setPrizeAmount] = useState(String(raffle?.prizeAmount || ""));
  const [numWinners, setNumWinners] = useState(String(raffle?.numberOfWinners || 1));
  const [prizes, setPrizes] = useState<{ amount: string; label: string }[]>(
    (raffle?.prizes || []).map((p: any) => ({ amount: String(p.amount), label: p.label }))
  );

  // Schedule
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "one_time">(raffle?.frequency || "one_time");
  const [drawDay, setDrawDay] = useState<number>(raffle?.drawDay ?? 6);
  const [drawTime, setDrawTime] = useState(raffle?.drawTime || "20:00");
  const [startDate, setStartDate] = useState(raffle?.startDate ? new Date(raffle.startDate).toISOString().slice(0, 10) : "");
  const [endDate, setEndDate] = useState(raffle?.endDate ? new Date(raffle.endDate).toISOString().slice(0, 10) : "");
  const [drawDate, setDrawDate] = useState(raffle?.drawDate ? new Date(raffle.drawDate).toISOString().slice(0, 16) : "");

  // Automation
  const [autoDraw, setAutoDraw] = useState(raffle?.autoDraw ?? false);
  const [autoPublish, setAutoPublish] = useState(raffle?.autoPublish ?? true);
  const [autoNotify, setAutoNotify] = useState(raffle?.autoNotify ?? true);
  const [autoGenerateNext, setAutoGenerateNext] = useState(raffle?.autoGenerateNext ?? false);
  const [autoLockEntries, setAutoLockEntries] = useState(raffle?.autoLockEntries ?? false);

  // Referral
  const [referralReward, setReferralReward] = useState(String(raffle?.referralReward || 2));
  const [referralEnabled, setReferralEnabled] = useState(raffle?.referralEnabled ?? true);
  const [maxReferralTickets, setMaxReferralTickets] = useState(String(raffle?.maxReferralTickets || ""));
  const [maxReferralsPerUser, setMaxReferralsPerUser] = useState(String(raffle?.maxReferralsPerUser || ""));

  // Eligibility rules
  const [eligibilityRules, setEligibilityRules] = useState<{ field: string; operator: string; value: string }[]>(
    raffle?.eligibilityRules || []
  );

  // Notification settings
  const [notifOnEntry, setNotifOnEntry] = useState(raffle?.notificationSettings?.onEntry ?? true);
  const [notifOnReferral, setNotifOnReferral] = useState(raffle?.notificationSettings?.onReferral ?? true);
  const [notifOnWinner, setNotifOnWinner] = useState(raffle?.notificationSettings?.onWinnerAnnounce ?? true);
  const [notifOnReminder, setNotifOnReminder] = useState(raffle?.notificationSettings?.onDrawReminder ?? true);
  const [notifOnClaimed, setNotifOnClaimed] = useState(raffle?.notificationSettings?.onPrizeClaimed ?? true);

  const addPrizeTier = () => setPrizes(prev => [...prev, { amount: "", label: "" }]);
  const removePrizeTier = (i: number) => setPrizes(prev => prev.filter((_, idx) => idx !== i));
  const updatePrize = (i: number, field: "amount" | "label", value: string) => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const addRule = () => setEligibilityRules(prev => [...prev, { field: "has_spotify", operator: "eq", value: "true" }]);
  const removeRule = (i: number) => setEligibilityRules(prev => prev.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: "field" | "operator" | "value", value: string) => setEligibilityRules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !prizeAmount) {
      setError("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formattedPrizes = prizes.filter(p => p.amount && p.label).map(p => ({ amount: Number(p.amount), label: p.label }));

      const args: any = {
        adminId,
        raffleId,
        title: title.trim(),
        slug: slug.trim(),
        banner: bannerUrl,
        accentColor,
        description: description.trim(),
        prizeAmount: Number(prizeAmount),
        prizes: formattedPrizes.length > 0 ? formattedPrizes : undefined,
        drawDate: frequency === "one_time" ? new Date(drawDate).getTime() : (raffle?.drawDate || Date.now()),
        status,
        eligibilityType: "spotify_subscription",
        referralReward: Number(referralReward) || 2,
        frequency,
        drawDay: frequency !== "one_time" ? drawDay : undefined,
        drawTime: frequency !== "one_time" ? drawTime : undefined,
        startDate: frequency !== "one_time" ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() : undefined,
        autoDraw,
        autoPublish,
        autoNotify,
        autoGenerateNext,
        autoLockEntries,
        numberOfWinners: Number(numWinners) || 1,
        prizeBreakdown: formattedPrizes.length > 0 ? formattedPrizes.map((p, i) => ({ position: i + 1, label: p.label, amount: p.amount })) : undefined,
        referralEnabled,
        maxReferralTickets: maxReferralTickets ? Number(maxReferralTickets) : undefined,
        maxReferralsPerUser: maxReferralsPerUser ? Number(maxReferralsPerUser) : undefined,
        eligibilityRules: eligibilityRules.length > 0 ? eligibilityRules : undefined,
        notificationSettings: {
          onEntry: notifOnEntry,
          onReferral: notifOnReferral,
          onWinnerAnnounce: notifOnWinner,
          onDrawReminder: notifOnReminder,
          onPrizeClaimed: notifOnClaimed,
        },
      };

      const result = await updateRaffleFn(args);
      if (result.success === false) {
        setError(result.error || "Failed to update raffle");
        return;
      }
      toast.success("Raffle updated successfully!");
      onUpdated();
    } catch (err: any) {
      setError(err?.message || "Failed to update raffle");
    } finally {
      setSubmitting(false);
    }
  }, [title, slug, bannerUrl, accentColor, description, prizeAmount, prizes, drawDate, status, frequency, drawDay, drawTime, startDate, endDate, referralReward, numWinners, autoDraw, autoPublish, autoNotify, autoGenerateNext, autoLockEntries, referralEnabled, maxReferralTickets, maxReferralsPerUser, eligibilityRules, notifOnEntry, notifOnReferral, notifOnWinner, notifOnReminder, notifOnClaimed, raffleId, adminId, updateRaffleFn, onUpdated]);

  if (!raffle) return null;

  const prizePoolTotal = prizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const prizePoolValid = !prizes.length || prizePoolTotal <= Number(prizeAmount);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl my-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black">Edit Raffle</h3>
            <p className="text-xs text-zinc-500 font-medium">/{raffle.slug}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100"><X size={20} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== BASIC INFORMATION ===== */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">Basic Information</h4>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</label>
                <input value={slug} onChange={e => setSlug(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-mono font-bold outline-none focus:border-zinc-900 mt-1" />
                <p className="text-[10px] text-zinc-400 mt-1">Leaving same slug keeps it unchanged</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 mt-1 resize-none" />
            </div>
          </div>

          {/* ===== BANNER + COLOR ===== */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <BannerUpload currentUrl={bannerUrl} onUpload={setBannerUrl} onRemove={() => setBannerUrl(undefined)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Accent Color</label>
              <div className="flex flex-col gap-1.5 mt-1">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="w-full h-10 rounded-xl border border-black/5 cursor-pointer" />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.slice(0, 8).map(c => (
                    <button key={c} type="button" onClick={() => setAccentColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${accentColor === c ? "border-zinc-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===== SCHEDULE ===== */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Calendar size={12} /> Schedule</h4>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Frequency</label>
              <div className="flex gap-2 mt-1">
                {(["one_time", "weekly", "monthly"] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={`flex-1 h-10 rounded-xl text-xs font-black transition-all ${
                      frequency === f ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                    }`}>
                    {f === "one_time" ? "One-Time" : f === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>
            {frequency === "one_time" ? (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Date</label>
                <input value={drawDate} onChange={e => setDrawDate(e.target.value)} type="datetime-local"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Start Date</label>
                  <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date"
                    className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">End Date (optional)</label>
                  <input value={endDate} onChange={e => setEndDate(e.target.value)} type="date"
                    className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Time</label>
                  <input value={drawTime} onChange={e => setDrawTime(e.target.value)} type="time"
                    className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {frequency === "weekly" ? "Draw Day" : "Draw on Day"}
                  </label>
                  {frequency === "weekly" ? (
                    <select value={drawDay} onChange={e => setDrawDay(Number(e.target.value))}
                      className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                      {DAYS_OF_WEEK.map((day, i) => <option key={i} value={i}>{day}</option>)}
                    </select>
                  ) : (
                    <select value={drawDay} onChange={e => setDrawDay(Number(e.target.value))}
                      className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                      {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}
            {raffle.nextDrawDate && (
              <p className="text-[10px] font-bold text-emerald-600">Next draw: {new Date(raffle.nextDrawDate).toLocaleString()}</p>
            )}
          </div>

          {/* ===== PRIZE CONFIGURATION ===== */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Award size={12} /> Prize Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Prize Pool (₦)</label>
                <input value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)} type="number" min="1"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Number of Winners</label>
                <input value={numWinners} onChange={e => setNumWinners(e.target.value)} type="number" min="1"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prize Tiers (optional)</label>
                <button type="button" onClick={addPrizeTier}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Plus size={12} /> Add Tier
                </button>
              </div>
              <div className="space-y-2">
                {prizes.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={p.label} onChange={e => updatePrize(i, "label", e.target.value)}
                      placeholder="1st Prize"
                      className="flex-1 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900" />
                    <input value={p.amount} onChange={e => updatePrize(i, "amount", e.target.value)}
                      type="number" min="1" placeholder="Amount"
                      className="w-28 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900" />
                    <button type="button" onClick={() => removePrizeTier(i)}
                      className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center"><X size={14} /></button>
                  </div>
                ))}
              </div>
              {prizes.length > 0 && !prizePoolValid && (
                <p className="text-[10px] font-bold text-red-500 mt-1">Tier total (₦{prizePoolTotal.toLocaleString()}) exceeds prize pool (₦{Number(prizeAmount).toLocaleString()})</p>
              )}
            </div>
          </div>

          {/* ===== REFERRAL SETTINGS ===== */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Gift size={12} /> Referral Settings</h4>
            <Toggle label="Enable Referrals" desc="Allow users to invite friends for bonus tickets" checked={referralEnabled} onChange={setReferralEnabled} />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tickets per Referral</label>
                <input value={referralReward} onChange={e => setReferralReward(e.target.value)} type="number" min="1"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" disabled={!referralEnabled} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Max Referral Tickets</label>
                <input value={maxReferralTickets} onChange={e => setMaxReferralTickets(e.target.value)} type="number" min="1" placeholder="Unlimited"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" disabled={!referralEnabled} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Max Referrals/User</label>
                <input value={maxReferralsPerUser} onChange={e => setMaxReferralsPerUser(e.target.value)} type="number" min="1" placeholder="Unlimited"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" disabled={!referralEnabled} />
              </div>
            </div>
            {referralEnabled && (
              <div className="bg-zinc-50 rounded-2xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Preview</p>
                <div className="text-xs font-bold text-zinc-600 space-y-0.5">
                  <div>Purchase Spotify = <span className="text-emerald-600">1 Ticket</span></div>
                  <div>Refer Friend = <span className="text-emerald-600">+{referralReward} Tickets</span></div>
                  {maxReferralTickets && <div>Max Referral Tickets = <span className="text-amber-600">{maxReferralTickets}</span></div>}
                  {maxReferralsPerUser && <div>Max Referrals/User = <span className="text-amber-600">{maxReferralsPerUser}</span></div>}
                </div>
              </div>
            )}
          </div>

          {/* ===== ELIGIBILITY RULES ===== */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><CheckCircle2 size={12} /> Eligibility Rules</h4>
            {eligibilityRules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={rule.field} onChange={e => updateRule(i, "field", e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900">
                  <option value="has_spotify">Has Spotify Subscription</option>
                  <option value="min_subscription_age">Min Subscription Age</option>
                  <option value="account_status">Account Status</option>
                  <option value="not_disqualified">Not Disqualified</option>
                  <option value="country">Country / Region</option>
                </select>
                <select value={rule.operator} onChange={e => updateRule(i, "operator", e.target.value)}
                  className="w-20 h-10 rounded-xl border border-black/5 bg-zinc-50 px-2 text-xs font-bold outline-none focus:border-zinc-900">
                  <option value="eq">=</option>
                  <option value="neq">≠</option>
                  <option value="gte">≥</option>
                  <option value="lt">&lt;</option>
                </select>
                {rule.field === "min_subscription_age" ? (
                  <div className="flex items-center gap-1">
                    <input value={rule.value} onChange={e => updateRule(i, "value", e.target.value)} type="number" min="1" placeholder="Days"
                      className="w-20 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900" />
                    <span className="text-[10px] font-bold text-zinc-400">days</span>
                  </div>
                ) : rule.field === "country" ? (
                  <input value={rule.value} onChange={e => updateRule(i, "value", e.target.value)} placeholder="e.g. NG"
                    className="w-20 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900" />
                ) : (
                  <select value={rule.value} onChange={e => updateRule(i, "value", e.target.value)}
                    className="flex-1 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
                <button type="button" onClick={() => removeRule(i)}
                  className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center"><X size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={addRule}
              className="w-full h-10 rounded-xl border-2 border-dashed border-black/10 text-xs font-bold text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-all flex items-center justify-center gap-1">
              <Plus size={14} /> Add Rule
            </button>
          </div>

          {/* ===== NOTIFICATIONS ===== */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">Notifications</h4>
            <Toggle label="On User Entry" desc="Notify user when they enter the raffle" checked={notifOnEntry} onChange={setNotifOnEntry} />
            <Toggle label="On Referral Earned" desc="Notify user when a referral completes" checked={notifOnReferral} onChange={setNotifOnReferral} />
            <Toggle label="On Winner Announce" desc="Notify winners when announced" checked={notifOnWinner} onChange={setNotifOnWinner} />
            <Toggle label="On Draw Reminder" desc="Send reminder before draw" checked={notifOnReminder} onChange={setNotifOnReminder} />
            <Toggle label="On Prize Claimed" desc="Notify when winner claims prize" checked={notifOnClaimed} onChange={setNotifOnClaimed} />
          </div>

          {/* ===== AUTOMATION ===== */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Repeat2 size={12} /> Automation</h4>
            <Toggle label="Auto Draw Winner" desc="Select winner(s) when draw time arrives" checked={autoDraw} onChange={setAutoDraw} />
            <Toggle label="Auto Publish Winners" desc="Announce winners publicly" checked={autoPublish} onChange={setAutoPublish} />
            <Toggle label="Auto Notify Winners" desc="Send notifications to winners" checked={autoNotify} onChange={setAutoNotify} />
            {frequency !== "one_time" && (
              <Toggle label="Auto Generate Next Draw" desc="Schedule next round after draw completes" checked={autoGenerateNext} onChange={setAutoGenerateNext} />
            )}
            <Toggle label="Lock Entries Before Draw" desc="Prevent new entries before draw time" checked={autoLockEntries} onChange={setAutoLockEntries} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CreateRaffleModal({
  adminId, onClose, onCreated,
}: {
  adminId: Id<"users">;
  onClose: () => void;
  onCreated: (id: Id<"raffles">) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [referralReward, setReferralReward] = useState("2");
  const [accentColor, setAccentColor] = useState("#1DB954");
  const [publishAfterCreate, setPublishAfterCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();

  // Schedule
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "one_time">("one_time");
  const [drawDay, setDrawDay] = useState<number>(6);
  const [drawTime, setDrawTime] = useState("20:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drawDate, setDrawDate] = useState("");

  // Prize
  const [numWinners, setNumWinners] = useState("1");
  const [prizes, setPrizes] = useState<{ amount: string; label: string }[]>([]);

  // Automation
  const [autoDraw, setAutoDraw] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const [autoNotify, setAutoNotify] = useState(true);
  const [autoGenerateNext, setAutoGenerateNext] = useState(false);
  const [autoLockEntries, setAutoLockEntries] = useState(false);

  const createRaffleFn = useMutation(api.raffle.createRaffle);
  const updateStatusFn = useMutation(api.raffle.updateRaffleStatus);

  const handleSlugFromTitle = (val: string) => {
    setTitle(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) {
      setSlug(autoSlug);
    }
  };

  const addPrizeTier = () => setPrizes(prev => [...prev, { amount: "", label: "" }]);
  const removePrizeTier = (i: number) => setPrizes(prev => prev.filter((_, idx) => idx !== i));
  const updatePrize = (i: number, field: "amount" | "label", value: string) => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !prizeAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (frequency === "one_time" && !drawDate) {
      toast.error("Please select a draw date");
      return;
    }
    if (frequency !== "one_time" && !startDate) {
      toast.error("Please select a start date");
      return;
    }
    setSubmitting(true);
    try {
      const formattedPrizes = prizes.filter(p => p.amount && p.label).map(p => ({ amount: Number(p.amount), label: p.label }));

      // Build create args
      const args: any = {
        adminId,
        title: title.trim(),
        slug: slug.trim(),
        banner: bannerUrl,
        accentColor,
        description: description.trim(),
        prizeAmount: Number(prizeAmount),
        prizes: formattedPrizes.length > 0 ? formattedPrizes : undefined,
        drawDate: frequency === "one_time" ? new Date(drawDate).getTime() : new Date(startDate).getTime(),
        eligibilityType: "spotify_subscription",
        referralReward: Number(referralReward) || 2,
        frequency,
        drawDay: frequency !== "one_time" ? drawDay : undefined,
        drawTime: frequency !== "one_time" ? drawTime : undefined,
        startDate: frequency !== "one_time" ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() : undefined,
        autoDraw,
        autoPublish,
        autoNotify,
        autoGenerateNext,
        autoLockEntries,
        numberOfWinners: Number(numWinners) || 1,
        prizeBreakdown: formattedPrizes.length > 0 ? formattedPrizes.map((p, i) => ({ position: i + 1, label: p.label, amount: p.amount })) : undefined,
      };

      const result = await createRaffleFn(args);

      if (result.success === false) {
        toast.error(result.error || "Failed to create raffle");
        return;
      }

      toast.success("Raffle created!");

      if (publishAfterCreate) {
        await updateStatusFn({ raffleId: result.raffleId, status: "published" });
        toast.success("Raffle published!");
      }

      onCreated(result.raffleId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create raffle");
    } finally {
      setSubmitting(false);
    }
  }, [title, slug, bannerUrl, accentColor, description, prizeAmount, prizes, drawDate, startDate, endDate, frequency, drawDay, drawTime, referralReward, numWinners, autoDraw, autoPublish, autoNotify, autoGenerateNext, autoLockEntries, publishAfterCreate, adminId, createRaffleFn, updateStatusFn, onCreated]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black">Create Raffle</h3>
            <p className="text-xs text-zinc-500 font-medium">Configure your Spotify raffle campaign</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Info size={12} /> Basic Information</h4>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title *</label>
              <input value={title} onChange={e => handleSlugFromTitle(e.target.value)}
                placeholder="Spin the Beat"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug *</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                placeholder="spin-the-beat"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-mono font-bold outline-none focus:border-zinc-900 mt-1" />
              <p className="text-[10px] text-zinc-400 mt-1">If slug is taken, a unique version will be generated automatically.</p>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Win amazing prizes with Spotify Premium..."
                rows={2}
                className="w-full rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 mt-1 resize-none" />
            </div>
          </div>

          {/* Banner + Color */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <BannerUpload currentUrl={bannerUrl} onUpload={setBannerUrl} onRemove={() => setBannerUrl(undefined)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Accent Color</label>
              <div className="flex flex-col gap-1.5 mt-1">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="w-full h-10 rounded-xl border border-black/5 cursor-pointer" />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.slice(0, 8).map(c => (
                    <button key={c} type="button" onClick={() => setAccentColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${accentColor === c ? "border-zinc-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Calendar size={12} /> Schedule</h4>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Frequency</label>
              <div className="flex gap-2 mt-1">
                {(["one_time", "weekly", "monthly"] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={`flex-1 h-10 rounded-xl text-xs font-black transition-all ${
                      frequency === f ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                    }`}>
                    {f === "one_time" ? "One-Time" : f === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            {frequency === "one_time" ? (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Date *</label>
                <input value={drawDate} onChange={e => setDrawDate(e.target.value)} type="datetime-local"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Start Date *</label>
                  <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date"
                    className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">End Date (optional)</label>
                  <input value={endDate} onChange={e => setEndDate(e.target.value)} type="date"
                    className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Time</label>
                  <input value={drawTime} onChange={e => setDrawTime(e.target.value)} type="time"
                    className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {frequency === "weekly" ? "Draw Day" : "Draw on Day"}
                  </label>
                  {frequency === "weekly" ? (
                    <select value={drawDay} onChange={e => setDrawDay(Number(e.target.value))}
                      className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                      {DAYS_OF_WEEK.map((day, i) => <option key={i} value={i}>{day}</option>)}
                    </select>
                  ) : (
                    <select value={drawDay} onChange={e => setDrawDay(Number(e.target.value))}
                      className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                      {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Prize Configuration */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Award size={12} /> Prize Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Prize Pool (₦) *</label>
                <input value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)} type="number" min="1" placeholder="5000"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Number of Winners</label>
                <input value={numWinners} onChange={e => setNumWinners(e.target.value)} type="number" min="1" placeholder="1"
                  className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prize Tiers (optional)</label>
                <button type="button" onClick={addPrizeTier}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Plus size={12} /> Add Tier
                </button>
              </div>
              <div className="space-y-2">
                {prizes.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={p.label} onChange={e => updatePrize(i, "label", e.target.value)}
                      placeholder="1st Prize"
                      className="flex-1 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900" />
                    <input value={p.amount} onChange={e => updatePrize(i, "amount", e.target.value)}
                      type="number" min="1" placeholder="Amount"
                      className="w-28 h-10 rounded-xl border border-black/5 bg-zinc-50 px-3 text-xs font-bold outline-none focus:border-zinc-900" />
                    <button type="button" onClick={() => removePrizeTier(i)}
                      className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">If not specified, prize pool is split proportionally among winners.</p>
            </div>
          </div>

          {/* Automation */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Repeat2 size={12} /> Automation</h4>
            <Toggle label="Automatically Draw Winner" desc="Select winner(s) when draw time arrives" checked={autoDraw} onChange={setAutoDraw} />
            <Toggle label="Automatically Publish Winners" desc="Announce winners publicly" checked={autoPublish} onChange={setAutoPublish} />
            <Toggle label="Automatically Notify Winners" desc="Send notifications to winners" checked={autoNotify} onChange={setAutoNotify} />
            {frequency !== "one_time" && (
              <Toggle label="Automatically Generate Next Draw" desc="Schedule next round after draw completes" checked={autoGenerateNext} onChange={setAutoGenerateNext} />
            )}
            <Toggle label="Lock Entries Before Draw" desc="Prevent new entries before draw time" checked={autoLockEntries} onChange={setAutoLockEntries} />
          </div>

          {/* Referral + Eligibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Referral Reward (tickets)</label>
              <input value={referralReward} onChange={e => setReferralReward(e.target.value)} type="number" min="1"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 cursor-pointer">
            <input type="checkbox" checked={publishAfterCreate} onChange={e => setPublishAfterCreate(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
            <div>
              <span className="text-sm font-bold">Publish immediately</span>
              <p className="text-[10px] text-zinc-500 font-medium">Raffle will be visible to users after creation</p>
            </div>
          </label>

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {submitting ? "Creating..." : publishAfterCreate ? "Create & Publish Raffle" : "Create Raffle"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  X: <Twitter size={14} />,
  Instagram: <Instagram size={14} />,
  TikTok: <Music size={14} />,
  Facebook: <Users size={14} />,
  YouTube: <Youtube size={14} />,
  WhatsApp: <MessageCircle size={14} />,
  Telegram: <SendIcon size={14} />,
  Discord: <Smartphone size={14} />,
  Spotify: <Music size={14} />,
  Website: <Globe size={14} />,
  Custom: <Link size={14} />,
};

const PLATFORMS = ["X", "Instagram", "TikTok", "Facebook", "YouTube", "WhatsApp", "Telegram", "Discord", "Spotify", "Website", "Custom"];
const VERIFICATION_METHODS = ["button_click", "link_visit", "profile_completion", "referral_completion", "manual_approval", "admin_approval", "api"];

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BonusTaskEditor({ task, onSave, onClose }: {
  task: any;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(task?.name || "");
  const [description, setDescription] = useState(task?.description || "");
  const [platform, setPlatform] = useState(task?.platform || "X");
  const [icon, setIcon] = useState(task?.icon || "");
  const [rewardTickets, setRewardTickets] = useState(String(task?.rewardTickets || ""));
  const [verificationMethod, setVerificationMethod] = useState(task?.verificationMethod || "button_click");
  const [destinationUrl, setDestinationUrl] = useState(task?.destinationUrl || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rewardTickets) {
      setError("Name and reward tickets are required");
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      platform,
      icon: icon || undefined,
      rewardTickets: Number(rewardTickets),
      verificationMethod,
      destinationUrl: destinationUrl.trim() || undefined,
    });
  }, [name, description, platform, icon, rewardTickets, verificationMethod, destinationUrl, onSave]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black">{task ? "Edit Bonus Task" : "Create Bonus Task"}</h3>
            <p className="text-xs text-zinc-500 font-medium">Configure a bonus ticket challenge</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100"><X size={20} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Task Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Follow us on X"
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Follow our X account and earn bonus tickets"
              rows={2}
              className="w-full rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 mt-1 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reward Tickets *</label>
              <input value={rewardTickets} onChange={e => setRewardTickets(e.target.value)} type="number" min="1"
                placeholder="2"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verification Method</label>
            <select value={verificationMethod} onChange={e => setVerificationMethod(e.target.value)}
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
              {VERIFICATION_METHODS.map(v => <option key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Destination URL (optional)</label>
            <input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)}
              placeholder="https://x.com/jointheq"
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
          </div>

          <button type="submit"
            className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            {task ? "Save Changes" : "Create Task"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
