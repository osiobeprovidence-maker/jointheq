import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Award, Ticket, Users, Gift, Sparkles,
  CheckCircle2, XCircle, Clock, Search, Edit3,
  Eye, Loader2, Copy, ChevronDown,
  Music, Ban, RefreshCw,
  AlertCircle, X, ChevronRight, Palette, Image,
  ListOrdered, DollarSign, BarChart3, Medal
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
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
                  <ChevronRight size={18} className={`text-zinc-300 mt-1 transition-transform ${
                    selectedRaffleId === raffle._id ? "rotate-90" : ""
                  }`} />
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
  const conversionRate = entries.length > 0 ? ((entries.length / Math.max(entries.length + completedRefs, 1)) * 100).toFixed(1) : "0";
  const avgTicketsPerUser = entries.length > 0 ? (totalTickets / entries.length).toFixed(1) : "0";

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
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Draw Date</div>
          <div className="text-lg font-black">{new Date(raffle.drawDate).toLocaleDateString()}</div>
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Entries</div>
          <div className="text-lg font-black">{entries.length}</div>
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Tickets</div>
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
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Avg Tickets/User</div>
            <div className="text-base font-black">{avgTicketsPerUser}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Days Remaining</div>
            <div className="text-base font-black">{stats?.daysRemaining ?? "-"}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Conversion</div>
            <div className="text-base font-black">-</div>
          </div>
        </div>
      </div>

      {/* Top 5 Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="border-t border-black/5 pt-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
            <Medal size={14} /> Top Referrers
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

      {winners.length > 0 && (
        <div className="border-t border-black/5 pt-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Winners</h4>
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
  const [drawDate, setDrawDate] = useState("");
  const [referralReward, setReferralReward] = useState("2");
  const [eligibilityType, setEligibilityType] = useState("spotify_subscription");
  const [bannerUrl, setBannerUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#1DB954");
  const [prizes, setPrizes] = useState<{ amount: string; label: string }[]>([]);
  const [publishAfterCreate, setPublishAfterCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createRaffleFn = useMutation(api.raffle.createRaffle);
  const updateStatusFn = useMutation(api.raffle.updateRaffleStatus);

  const handleSlugFromTitle = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const addPrizeTier = () => {
    setPrizes(prev => [...prev, { amount: "", label: "" }]);
  };

  const removePrizeTier = (i: number) => {
    setPrizes(prev => prev.filter((_, idx) => idx !== i));
  };

  const updatePrize = (i: number, field: "amount" | "label", value: string) => {
    setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !prizeAmount || !drawDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const formattedPrizes = prizes
        .filter(p => p.amount && p.label)
        .map(p => ({ amount: Number(p.amount), label: p.label }));

      const result = await createRaffleFn({
        adminId,
        title: title.trim(),
        slug: slug.trim(),
        banner: bannerUrl.trim() || undefined,
        accentColor: accentColor || undefined,
        description: description.trim(),
        prizeAmount: Number(prizeAmount),
        prizes: formattedPrizes.length > 0 ? formattedPrizes : undefined,
        drawDate: new Date(drawDate).getTime(),
        eligibilityType,
        referralReward: Number(referralReward) || 2,
      });
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
  }, [title, slug, bannerUrl, accentColor, description, prizeAmount, prizes, drawDate, eligibilityType, referralReward, publishAfterCreate, adminId, createRaffleFn, updateStatusFn, onCreated]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black">Create Raffle</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title *</label>
            <input value={title} onChange={e => handleSlugFromTitle(e.target.value)}
              placeholder="Spotify Premium Raffle"
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug *</label>
            <input value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="spotify-premium-raffle"
              className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-mono font-bold outline-none focus:border-zinc-900 mt-1" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Win big with Spotify Premium..."
              rows={2}
              className="w-full rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 mt-1 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Prize Pool (₦) *</label>
              <input value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)}
                type="number" min="1"
                placeholder="5000"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Draw Date *</label>
              <input value={drawDate} onChange={e => setDrawDate(e.target.value)}
                type="datetime-local"
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
                    className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Banner Image URL (optional)</label>
            <div className="flex items-center gap-2 mt-1">
              <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900" />
              <Image size={18} className="text-zinc-300 shrink-0" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Accent Color</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-black/5 cursor-pointer" />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setAccentColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${accentColor === c ? "border-zinc-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Referral Reward (tickets)</label>
              <input value={referralReward} onChange={e => setReferralReward(e.target.value)}
                type="number" min="1"
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Eligibility</label>
              <select value={eligibilityType} onChange={e => setEligibilityType(e.target.value)}
                className="w-full h-11 rounded-2xl border border-black/5 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1">
                <option value="spotify_subscription">Spotify Subscription</option>
                <option value="any_subscription">Any Subscription</option>
                <option value="all">All Users</option>
              </select>
            </div>
          </div>

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
