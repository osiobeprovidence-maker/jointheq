import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import {
  LayoutDashboard, Megaphone, Users, PiggyBank, Trophy,
  BarChart3, Settings, Search, Plus, Eye, Edit3, Trash2,
  CheckCircle, XCircle, Banknote, Percent, Award, RefreshCw,
  Copy, Filter, MoreVertical, Clock, Wallet, DollarSign,
  Target, Activity, UserCheck, UserX, Download, ChevronDown,
  Check, X, Shield, Star, Zap, Flame, Medal, Crown,
  Gift, ArrowUpRight, ExternalLink, AlertCircle, Ban,
  ShieldCheck, UserPlus, UserMinus, Calendar
} from "lucide-react";
import toast from "react-hot-toast";

type AdminPartnershipTab =
  | "overview"
  | "campaigns"
  | "partners"
  | "payout_requests"
  | "achievements"
  | "referral_tracking"
  | "commission_rules"
  | "analytics"
  | "settings"
  | "partner_profile"
  | "bank_details";

const TABS: { id: AdminPartnershipTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
  { id: "campaigns", label: "Campaigns", icon: <Megaphone size={14} /> },
  { id: "partners", label: "Partners", icon: <Users size={14} /> },
  { id: "bank_details", label: "Bank Details", icon: <Banknote size={14} /> },
  { id: "payout_requests", label: "Payout Requests", icon: <PiggyBank size={14} /> },
  { id: "achievements", label: "Achievements", icon: <Trophy size={14} /> },
  { id: "referral_tracking", label: "Referral Tracking", icon: <Activity size={14} /> },
  { id: "commission_rules", label: "Commission Rules", icon: <Percent size={14} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
  { id: "settings", label: "Settings", icon: <Settings size={14} /> },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700", approved: "bg-emerald-100 text-emerald-700",
    verified: "bg-emerald-100 text-emerald-700", completed: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700", processing: "bg-indigo-100 text-indigo-700",
    rejected: "bg-red-100 text-red-700", disabled: "bg-zinc-100 text-zinc-500",
    draft: "bg-zinc-100 text-zinc-500", suspended: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-700", failed: "bg-red-100 text-red-700",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${styles[status?.toLowerCase()] || "bg-zinc-100 text-zinc-600"}`}>{status}</span>;
}

export function PartnershipAdmin() {
  const [tab, setTab] = useState<AdminPartnershipTab>("overview");
  const [selectedPartnerId, setSelectedPartnerId] = useState<Id<"partners"> | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Partnership Management</h2>
        <p className="text-sm font-medium text-zinc-500 mt-1">Full control over partners, campaigns, payouts, achievements, and settings.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-black/5 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedPartnerId(null); }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[10px] font-black transition-all whitespace-nowrap ${tab === t.id ? "bg-zinc-900 text-white shadow-lg shadow-black/10" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && <OverviewTab onViewPartner={(id) => { setSelectedPartnerId(id); setTab("partner_profile"); }} />}
        {tab === "campaigns" && <CampaignsTab />}
        {tab === "partners" && <PartnersTab onViewPartner={(id) => { setSelectedPartnerId(id); setTab("partner_profile"); }} />}
        {tab === "bank_details" && <BankDetailsTab />}
        {tab === "payout_requests" && <PayoutRequestsTab />}
        {tab === "achievements" && <AchievementsTab />}
        {tab === "referral_tracking" && <ReferralTrackingTab />}
        {tab === "commission_rules" && <CommissionRulesTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "partner_profile" && selectedPartnerId && <PartnerProfileTab partnerId={selectedPartnerId} onBack={() => setTab("partners")} />}
      </AnimatePresence>
    </div>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────

function OverviewTab({ onViewPartner }: { onViewPartner: (id: Id<"partners">) => void }) {
  const analytics = useQuery(api.partnership.getAdminAnalytics);
  const partners = useQuery(api.partners.listPartners) || [];

  if (!analytics) return <div className="h-64 rounded-2xl bg-white animate-pulse" />;

  const cards = [
    { icon: <Users size={20} />, label: "Total Partners", value: fmtNum(analytics.totalPartners), color: "text-blue-600", bg: "bg-blue-50" },
    { icon: <UserCheck size={20} />, label: "Active", value: fmtNum(analytics.activePartners), color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: <UserX size={20} />, label: "Inactive", value: fmtNum(analytics.inactivePartners), color: "text-red-600", bg: "bg-red-50" },
    { icon: <Activity size={20} />, label: "New This Month", value: fmtNum(analytics.newThisMonth), color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: <Target size={20} />, label: "Total Referrals", value: fmtNum(analytics.totalReferrals), color: "text-amber-600", bg: "bg-amber-50" },
    { icon: <CheckCircle size={20} />, label: "Qualified", value: fmtNum(analytics.qualifiedReferrals), color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: <DollarSign size={20} />, label: "Revenue", value: fmt(analytics.totalRevenue), color: "text-green-600", bg: "bg-green-50" },
    { icon: <Wallet size={20} />, label: "Pending Payouts", value: fmt(analytics.pendingPayoutsAmount), color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.color}`}>{c.icon}</div>
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{c.label}</div>
                <div className="text-lg font-black text-zinc-900">{c.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Partners */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h3 className="text-base font-black text-zinc-900">Top Partners by Earnings</h3>
        </div>
        <div className="divide-y divide-black/5">
          {analytics.topPartners.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm font-bold text-zinc-400">No partners yet</div>
          ) : analytics.topPartners.map((p: any, i: number) => (
            <div key={p._id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-500">{i + 1}</span>
                <div>
                  <button onClick={() => onViewPartner(p._id)} className="text-sm font-bold text-zinc-900 hover:text-blue-600 transition-colors">{p.fullName || "Unknown"}</button>
                  <div className="text-[10px] font-semibold text-zinc-400">{p.qualifiedReferrals} qualified</div>
                </div>
              </div>
              <div className="text-sm font-black text-emerald-600">{fmt(p.totalEarnings)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CAMPAIGNS ────────────────────────────────────────

function CampaignsTab() {
  const user = auth.getCurrentUser();
  const campaigns = useQuery(api.campaigns.listAdmin) || [];
  const createCampaign = useMutation(api.campaigns.create);
  const updateCampaign = useMutation(api.campaigns.update);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    name: "", description: "", status: "draft", campaign_type: "referral",
    reward_amount: 0, reward_type: "cash", start_date: "", end_date: "",
    banner_url: "", visibility: "public",
  });

  const filtered = useMemo(() => {
    let list = campaigns;
    if (statusFilter !== "all") list = list.filter((c: any) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: any) => c.name?.toLowerCase().includes(q) || c.campaign_type?.toLowerCase().includes(q));
    }
    return list;
  }, [campaigns, search, statusFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", description: "", status: "draft", campaign_type: "referral", reward_amount: 0, reward_type: "cash", start_date: "", end_date: "", banner_url: "", visibility: "public" });
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditId(c._id);
    setForm({
      name: c.name || "", description: c.description || "", status: c.status || "draft",
      campaign_type: c.campaign_type || "referral", reward_amount: c.reward_amount || 0,
      reward_type: c.reward_type || "cash",
      start_date: c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : "",
      end_date: c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : "",
      banner_url: c.banner_url || "", visibility: c.visibility || "public",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    try {
      const payload = {
        ...form,
        start_date: form.start_date ? new Date(form.start_date).getTime() : undefined,
        end_date: form.end_date ? new Date(form.end_date).getTime() : undefined,
        reward_amount: form.reward_amount,
      };
      if (editId) {
        await updateCampaign({ id: editId as any, adminId: user._id as any, ...payload });
        toast.success("Campaign updated");
      } else {
        await createCampaign({ ...payload, created_by: user._id as any });
        toast.success("Campaign created");
      }
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try { await deleteCampaign({ id: id as any }); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {["all", "active", "draft", "completed", "archived"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-2 text-[10px] font-black transition-colors ${statusFilter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-48 rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-xs font-semibold outline-none focus:border-zinc-900" />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[10px] font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95">
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-zinc-400">No campaigns found</div>
        ) : (
          <div className="divide-y divide-black/5">
            {filtered.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  {c.banner_url ? <img src={c.banner_url} alt="" className="h-12 w-20 rounded-xl object-cover shrink-0" /> : <div className="h-12 w-20 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0"><Megaphone size={20} className="text-zinc-300" /></div>}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-zinc-900 truncate">{c.name}</h4>
                      {statusBadge(c.status)}
                    </div>
                    <p className="text-xs font-semibold text-zinc-400 capitalize">{c.campaign_type} · {c.visibility} · {c.participant_count || 0} participants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(c)} className="rounded-xl bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 transition-colors"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(c._id)} className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="bg-white w-full sm:max-w-lg sm:rounded-[2rem] rounded-t-[2rem] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-black/5 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">{editId ? "Edit Campaign" : "Create Campaign"}</h3>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-zinc-100"><X size={18} /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Type</label>
                    <select value={form.campaign_type} onChange={(e) => setForm({ ...form, campaign_type: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900">
                      <option value="referral">Referral</option>
                      <option value="sales">Sales</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="bonus">Bonus</option>
                      <option value="social_media">Social Media</option>
                      <option value="limited_time">Limited Time</option>
                      <option value="q_raffle">Raffle</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reward Type</label>
                    <select value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900">
                      <option value="cash">Cash</option>
                      <option value="boots">Boots</option>
                      <option value="commission_bonus">Commission Bonus</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reward Amount</label>
                    <input type="number" value={form.reward_amount} onChange={(e) => setForm({ ...form, reward_amount: Number(e.target.value) })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Start Date</label>
                    <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">End Date</label>
                    <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Banner URL</label>
                  <input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visibility</label>
                  <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900">
                    <option value="public">Public</option>
                    <option value="invite_only">Invite Only</option>
                    <option value="partner_only">Partners Only</option>
                  </select>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-black/5">
                <button onClick={handleSave} className="w-full rounded-xl bg-zinc-900 py-4 text-sm font-black text-white transition-all hover:bg-zinc-800 active:scale-[0.99]">
                  {editId ? "Update Campaign" : "Create Campaign"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PARTNERS ──────────────────────────────────────────

function PartnersTab({ onViewPartner }: { onViewPartner: (id: Id<"partners">) => void }) {
  const partners = useQuery(api.partners.listPartners) || [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = partners;
    if (statusFilter !== "all") list = list.filter((p: any) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.fullName?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.referralCode?.toLowerCase().includes(q));
    }
    return list;
  }, [partners, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {["all", "active", "pending", "suspended"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-2 text-[10px] font-black transition-colors ${statusFilter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners..." className="w-56 rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-xs font-semibold outline-none focus:border-zinc-900" />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-black/5 bg-zinc-50 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400">
          <div className="col-span-3">Partner</div>
          <div className="col-span-2">Code</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-right">Earnings</div>
          <div className="col-span-1 text-center">Refs</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1" />
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-zinc-400">No partners found</div>
        ) : filtered.map((p: any) => (
          <div key={p._id} className="grid grid-cols-12 gap-2 items-center px-5 py-4 hover:bg-zinc-50 transition-colors border-b border-black/5 last:border-0">
            <div className="col-span-3">
              <button onClick={() => onViewPartner(p._id)} className="text-sm font-bold text-zinc-900 hover:text-blue-600 transition-colors text-left">{p.fullName || "Unnamed"}</button>
              <div className="text-[10px] font-semibold text-zinc-400">{p.email || ""}</div>
            </div>
            <div className="col-span-2">
              <code className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-700">{p.referralCode}</code>
            </div>
            <div className="col-span-2 text-xs font-bold text-zinc-700 capitalize">{p.partnerType}</div>
            <div className="col-span-2 text-right text-sm font-black text-emerald-600">{fmt(p.totalEarnings || 0)}</div>
            <div className="col-span-1 text-center text-xs font-bold text-zinc-700">{p.qualifiedReferrals || 0}</div>
            <div className="col-span-1 text-center">{statusBadge(p.status)}</div>
            <div className="col-span-1 text-right">
              <button onClick={() => onViewPartner(p._id)} className="rounded-xl bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 transition-colors"><Eye size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BANK DETAILS ─────────────────────────────────────

function BankDetailsTab() {
  const user = auth.getCurrentUser();
  const bankDetails = useQuery(api.partnership.adminListBankDetails) || [];
  const verifyBank = useMutation(api.partnership.adminVerifyBankDetail);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? bankDetails : bankDetails.filter((d: any) => d.verification_status === filter);

  const handleVerify = async (id: Id<"partner_bank_details">, status: "verified" | "rejected" | "disabled") => {
    if (!user?._id) return;
    try { await verifyBank({ detailId: id, status, adminNote: prompt("Admin note (optional):") || undefined }); toast.success(`Bank ${status}`); } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["all", "pending", "verified", "rejected", "disabled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-xl px-3.5 py-2 text-[10px] font-black transition-colors ${filter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-zinc-400">No bank details found</div>
        ) : (
          <div className="divide-y divide-black/5">
            {filtered.map((d: any) => (
              <div key={d._id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">{d.user?.full_name || "Unknown"}</span>
                    {statusBadge(d.verification_status)}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-zinc-500">{d.bank_name} · {d.account_number} · {d.account_name}</div>
                  {d.admin_note && <div className="mt-0.5 text-[10px] font-medium text-zinc-400">Note: {d.admin_note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {d.verification_status !== "verified" && (
                    <button onClick={() => handleVerify(d._id, "verified")} className="rounded-xl bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 transition-colors"><Check size={14} /></button>
                  )}
                  {d.verification_status !== "rejected" && (
                    <button onClick={() => handleVerify(d._id, "rejected")} className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-colors"><X size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAYOUT REQUESTS ──────────────────────────────────

function PayoutRequestsTab() {
  const user = auth.getCurrentUser();
  const requests = useQuery(api.partnership.adminListPayoutRequests) || [];
  const processRequest = useMutation(api.partnership.adminProcessPayoutRequest);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? requests : requests.filter((r: any) => r.status === filter);

  const handleProcess = async (id: Id<"partner_payout_requests">, status: "approved" | "processing" | "completed" | "rejected") => {
    if (!user?._id) return;
    try {
      await processRequest({
        requestId: id, status,
        adminNote: prompt("Admin note (optional):") || undefined,
        transactionReference: status === "completed" ? prompt("Transaction reference:") || undefined : undefined,
      });
      toast.success(`Request ${status}`);
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["all", "pending", "approved", "processing", "completed", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-xl px-3.5 py-2 text-[10px] font-black transition-colors ${filter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-zinc-400">No payout requests</div>
        ) : (
          <div className="divide-y divide-black/5">
            {filtered.map((r: any) => (
              <div key={r._id} className="px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-zinc-900">{fmt(r.amount)}</span>
                      {statusBadge(r.status)}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-zinc-500">
                      {r.user?.full_name || "Unknown"} · {r.bank_name} · {r.account_number}
                    </div>
                    <div className="text-[10px] font-medium text-zinc-400">
                      {new Date(r.created_at).toLocaleDateString()} {r.admin_note && `· Note: ${r.admin_note}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => handleProcess(r._id, "approved")} className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-600 hover:bg-emerald-100 transition-colors">Approve</button>
                        <button onClick={() => handleProcess(r._id, "rejected")} className="rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black text-red-500 hover:bg-red-100 transition-colors">Reject</button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => handleProcess(r._id, "completed")} className="rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-600 hover:bg-blue-100 transition-colors">Mark Paid</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ACHIEVEMENTS ─────────────────────────────────────

function AchievementsTab() {
  const user = auth.getCurrentUser();
  const achievements = useQuery(api.partnership.adminListAllAchievements) || [];
  const createAchievement = useMutation(api.partnership.adminCreateAchievement);
  const updateAchievement = useMutation(api.partnership.adminUpdateAchievement);
  const deleteAchievement = useMutation(api.partnership.adminDeleteAchievement);
  const awardAchievement = useMutation(api.partnership.adminAwardAchievement);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Id<"partnership_achievements"> | null>(null);
  const [awardModal, setAwardModal] = useState<{ achievementId: Id<"partnership_achievements">; userId: string } | null>(null);

  const [form, setForm] = useState({
    name: "", description: "", icon: "trophy", badge_color: "amber",
    criteria_type: "", criteria_value: 0, reward_boots: 0, reward_commission_bonus: 0,
    is_active: true, display_order: 0,
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", description: "", icon: "trophy", badge_color: "amber", criteria_type: "", criteria_value: 0, reward_boots: 0, reward_commission_bonus: 0, is_active: true, display_order: 0 });
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditId(a._id);
    setForm({ name: a.name, description: a.description || "", icon: a.icon || "trophy", badge_color: a.badge_color || "amber", criteria_type: a.criteria_type || "", criteria_value: a.criteria_value || 0, reward_boots: a.reward_boots || 0, reward_commission_bonus: a.reward_commission_bonus || 0, is_active: a.is_active ?? true, display_order: a.display_order || 0 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    try {
      if (editId) { await updateAchievement({ achievementId: editId, ...form }); toast.success("Updated"); }
      else { await createAchievement({ ...form }); toast.success("Created"); }
      setShowForm(false);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleDelete = async (id: Id<"partnership_achievements">) => {
    if (!confirm("Delete?")) return;
    try { await deleteAchievement({ achievementId: id }); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  const handleAward = async () => {
    if (!awardModal || !user?._id) return;
    try { await awardAchievement({ userId: awardModal.userId as any, achievementId: awardModal.achievementId }); toast.success("Awarded!"); setAwardModal(null); } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[10px] font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95">
          <Plus size={14} /> Create Achievement
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm font-bold text-zinc-400">No achievements created yet</div>
        ) : achievements.map((a: any) => (
          <div key={a._id} className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${!a.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${a.badge_color || "amber"}-100 text-${a.badge_color || "amber"}-600`}>
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-900">{a.name}</h4>
                  {a.description && <p className="text-xs font-semibold text-zinc-400">{a.description}</p>}
                </div>
              </div>
              {statusBadge(a.is_active ? "active" : "disabled")}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-zinc-500">
              {a.criteria_type && <span className="rounded-lg bg-zinc-100 px-2 py-1">{a.criteria_type}: {a.criteria_value}</span>}
              {a.reward_boots > 0 && <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">{a.reward_boots} Boots</span>}
              {a.reward_commission_bonus > 0 && <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">+{a.reward_commission_bonus}% Bonus</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(a)} className="rounded-xl bg-zinc-100 px-3 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-200 transition-colors">Edit</button>
              <button onClick={() => setAwardModal({ achievementId: a._id, userId: "" })} className="rounded-xl bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-600 hover:bg-amber-100 transition-colors">Award</button>
              <button onClick={() => handleDelete(a._id)} className="rounded-xl bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-100 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full sm:max-w-lg sm:rounded-[2rem] rounded-t-[2rem] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-black/5 z-10">
                <div className="flex items-center justify-between"><h3 className="text-lg font-black">{editId ? "Edit Achievement" : "Create Achievement"}</h3><button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-zinc-100"><X size={18} /></button></div>
              </div>
              <div className="p-6 space-y-4">
                <InputField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <InputField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} options={["trophy", "star", "zap", "flame", "medal", "crown", "gift", "shield"]} />
                  <SelectField label="Badge Color" value={form.badge_color} onChange={(v) => setForm({ ...form, badge_color: v })} options={["amber", "emerald", "blue", "purple", "red", "orange", "pink"]} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Criteria Type" value={form.criteria_type} onChange={(v) => setForm({ ...form, criteria_type: v })} options={["", "referrals", "earnings", "subscriptions", "clicks", "manual"]} />
                  <InputField label="Criteria Value" type="number" value={String(form.criteria_value)} onChange={(v) => setForm({ ...form, criteria_value: Number(v) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Reward Boots" type="number" value={String(form.reward_boots)} onChange={(v) => setForm({ ...form, reward_boots: Number(v) })} />
                  <InputField label="Commission Bonus %" type="number" value={String(form.reward_commission_bonus)} onChange={(v) => setForm({ ...form, reward_commission_bonus: Number(v) })} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">Active</label>
                  <button onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-zinc-300"} relative`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.is_active ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-black/5">
                <button onClick={handleSave} className="w-full rounded-xl bg-zinc-900 py-4 text-sm font-black text-white transition-all hover:bg-zinc-800 active:scale-[0.99]">{editId ? "Update" : "Create"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Award Modal */}
      <AnimatePresence>
        {awardModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-black mb-2">Award Achievement</h3>
              <p className="text-xs font-semibold text-zinc-500 mb-4">Enter the user ID to award this achievement to.</p>
              <input value={awardModal.userId} onChange={(e) => setAwardModal({ ...awardModal, userId: e.target.value })} placeholder="User ID..." className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900 mb-4" />
              <div className="flex gap-2">
                <button onClick={() => setAwardModal(null)} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
                <button onClick={handleAward} className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-black text-white transition-all hover:bg-zinc-800">Award</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── REFERRAL TRACKING ────────────────────────────────

function ReferralTrackingTab() {
  const partners = useQuery(api.partners.listPartners) || [];
  const [search, setSearch] = useState("");

  const withStats = useMemo(() => {
    let list = partners.map((p: any) => ({
      ...p,
      conversionRate: p.totalRegistrations > 0 ? Math.round((p.qualifiedReferrals / p.totalRegistrations) * 100) : 0,
    }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.fullName?.toLowerCase().includes(q) || p.referralCode?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.totalRegistrations - a.totalRegistrations);
  }, [partners, search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-black text-zinc-900">Partner Referral Analytics</h3>
        <div className="relative">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-56 rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-xs font-semibold outline-none focus:border-zinc-900" />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/5 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              <th className="text-left px-4 py-3">Partner</th>
              <th className="text-center px-3 py-3">Code</th>
              <th className="text-center px-3 py-3">Clicks</th>
              <th className="text-center px-3 py-3">Signups</th>
              <th className="text-center px-3 py-3">Qualified</th>
              <th className="text-center px-3 py-3">Active Subs</th>
              <th className="text-center px-3 py-3">Commissions</th>
              <th className="text-center px-3 py-3">Conv. Rate</th>
              <th className="text-center px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {withStats.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-sm font-bold text-zinc-400">No data</td></tr>
            ) : withStats.map((p: any) => (
              <tr key={p._id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-zinc-900">{p.fullName || "N/A"}</div>
                  <div className="text-[10px] font-semibold text-zinc-400">{p.email}</div>
                </td>
                <td className="text-center px-3 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold">{p.referralCode}</code></td>
                <td className="text-center px-3 py-3 font-bold">{p.totalClicks || 0}</td>
                <td className="text-center px-3 py-3 font-bold">{p.totalRegistrations || 0}</td>
                <td className="text-center px-3 py-3 font-bold text-emerald-600">{p.qualifiedReferrals || 0}</td>
                <td className="text-center px-3 py-3 font-bold">{p.activeSubscribers || 0}</td>
                <td className="text-center px-3 py-3 font-black text-emerald-600">{fmt(p.totalEarnings || 0)}</td>
                <td className="text-center px-3 py-3"><span className="font-bold">{p.conversionRate}%</span></td>
                <td className="text-center px-3 py-3">{statusBadge(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── COMMISSION RULES ─────────────────────────────────

function CommissionRulesTab() {
  const user = auth.getCurrentUser();
  const rules = useQuery(api.partnership.listCommissionRules) || [];
  const saveRule = useMutation(api.partnership.adminSaveCommissionRule);
  const deleteRule = useMutation(api.partnership.adminDeleteCommissionRule);
  const catalogs = useQuery(api.subscriptions.getCatalog) || [];
  const [editId, setEditId] = useState<Id<"partnership_commission_rules"> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    subscription_catalog_id: "", commission_type: "fixed", commission_value: 0,
    recurring_months: 0, max_commission: 0, min_purchase: 0, bonus_campaign_multiplier: 1, is_active: true,
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ subscription_catalog_id: catalogs[0]?._id || "", commission_type: "fixed", commission_value: 0, recurring_months: 0, max_commission: 0, min_purchase: 0, bonus_campaign_multiplier: 1, is_active: true });
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setEditId(r._id);
    setForm({ subscription_catalog_id: r.subscription_catalog_id, commission_type: r.commission_type, commission_value: r.commission_value, recurring_months: r.recurring_months || 0, max_commission: r.max_commission || 0, min_purchase: r.min_purchase || 0, bonus_campaign_multiplier: r.bonus_campaign_multiplier || 1, is_active: r.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    try {
      await saveRule({ ruleId: editId || undefined, ...form, subscription_catalog_id: form.subscription_catalog_id as any });
      toast.success(editId ? "Updated" : "Created"); setShowForm(false);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[10px] font-black text-white shadow-lg shadow-black/10 active:scale-95"><Plus size={14} /> Add Rule</button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-zinc-400">No commission rules configured</div>
        ) : (
          <div className="divide-y divide-black/5">
            {rules.map((r: any) => (
              <div key={r._id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">{r.catalog?.name || "Unknown Service"}</span>
                    {statusBadge(r.is_active ? "active" : "disabled")}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-zinc-500">
                    {r.commission_type}: {r.commission_type === "percentage" ? `${r.commission_value}%` : fmt(r.commission_value)}
                    {r.recurring_months > 0 && ` · ${r.recurring_months} months recurring`}
                    {r.max_commission > 0 && ` · Max ${fmt(r.max_commission)}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(r)} className="rounded-xl bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200"><Edit3 size={14} /></button>
                  <button onClick={async () => { if (confirm("Delete?")) { try { await deleteRule({ ruleId: r._id }); toast.success("Deleted"); } catch {} } }} className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full sm:max-w-lg sm:rounded-[2rem] rounded-t-[2rem] max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-black/5 z-10">
                <div className="flex items-center justify-between"><h3 className="text-lg font-black">{editId ? "Edit Rule" : "Add Commission Rule"}</h3><button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-zinc-100"><X size={18} /></button></div>
              </div>
              <div className="p-6 space-y-4">
                <SelectField label="Service" value={form.subscription_catalog_id} onChange={(v) => setForm({ ...form, subscription_catalog_id: v })} options={catalogs.map((c: any) => ({ value: c._id, label: c.name }))} />
                <SelectField label="Commission Type" value={form.commission_type} onChange={(v) => setForm({ ...form, commission_type: v })} options={["fixed", "percentage", "recurring", "first_payment_only"]} />
                <InputField label="Commission Value" type="number" value={String(form.commission_value)} onChange={(v) => setForm({ ...form, commission_value: Number(v) })} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Recurring Months" type="number" value={String(form.recurring_months)} onChange={(v) => setForm({ ...form, recurring_months: Number(v) })} />
                  <InputField label="Max Commission" type="number" value={String(form.max_commission)} onChange={(v) => setForm({ ...form, max_commission: Number(v) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Min Purchase" type="number" value={String(form.min_purchase)} onChange={(v) => setForm({ ...form, min_purchase: Number(v) })} />
                  <InputField label="Bonus Multiplier" type="number" value={String(form.bonus_campaign_multiplier)} onChange={(v) => setForm({ ...form, bonus_campaign_multiplier: Number(v) })} />
                </div>
              </div>
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-black/5">
                <button onClick={handleSave} className="w-full rounded-xl bg-zinc-900 py-4 text-sm font-black text-white transition-all hover:bg-zinc-800 active:scale-[0.99]">Save Rule</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────

function AnalyticsTab() {
  const analytics = useQuery(api.partnership.getAdminAnalytics);

  if (!analytics) return <div className="h-64 rounded-2xl bg-white animate-pulse" />;

  const metrics = [
    { label: "Total Partners", value: fmtNum(analytics.totalPartners), sub: `${analytics.activePartners} active` },
    { label: "Total Referrals", value: fmtNum(analytics.totalReferrals), sub: `${analytics.qualifiedReferrals} qualified` },
    { label: "Conversion Rate", value: `${analytics.conversionRate}%`, sub: `${analytics.payingUsers} paying users` },
    { label: "Revenue Generated", value: fmt(analytics.totalRevenue), sub: "All time" },
    { label: "Commission Paid", value: fmt(analytics.paidCommissions), sub: `${analytics.outstandingCommissions} outstanding` },
    { label: "Pending Payouts", value: fmt(analytics.pendingPayoutsAmount), sub: `${analytics.pendingPayouts} requests` },
    { label: "Bank Verifications", value: String(analytics.pendingBankVerifications), sub: "Pending review" },
    { label: "Achievements Awarded", value: String(analytics.totalAchievementsAwarded), sub: "Total badges" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{m.label}</div>
            <div className="mt-1 text-xl font-black text-zinc-900">{m.value}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-zinc-400">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-zinc-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Average Earnings Per Partner", value: analytics.totalPartners > 0 ? fmt(Math.round(analytics.totalRevenue / analytics.totalPartners)) : "₦0" },
            { label: "Referral-to-Qualified Rate", value: analytics.totalReferrals > 0 ? `${Math.round((analytics.qualifiedReferrals / analytics.totalReferrals) * 100)}%` : "0%" },
            { label: "Active Partner Ratio", value: analytics.totalPartners > 0 ? `${Math.round((analytics.activePartners / analytics.totalPartners) * 100)}%` : "0%" },
            { label: "Outstanding Commission Ratio", value: analytics.totalRevenue > 0 ? `${Math.round((analytics.outstandingCommissions / analytics.totalRevenue) * 100)}%` : "0%" },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl bg-zinc-50 px-4 py-3">
              <div className="text-xs font-semibold text-zinc-400">{kpi.label}</div>
              <div className="text-lg font-black text-zinc-900">{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────

function SettingsTab() {
  const user = auth.getCurrentUser();
  const settings = useQuery(api.partnership.getSettings) || {};
  const saveSetting = useMutation(api.partnership.adminSaveSetting);
  const [local, setLocal] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const fields = [
    { key: "minimum_withdrawal", label: "Minimum Withdrawal Amount", type: "number", default: 5000 },
    { key: "default_commission_percentage", label: "Default Commission %", type: "number", default: 10 },
    { key: "cookie_duration_days", label: "Cookie Duration (days)", type: "number", default: 30 },
    { key: "referral_validity_days", label: "Referral Validity (days)", type: "number", default: 90 },
    { key: "auto_qualify_on_first_payment", label: "Auto-Qualify on First Payment", type: "boolean", default: true },
    { key: "require_admin_approval", label: "Require Admin Approval for Payouts", type: "boolean", default: true },
    { key: "leaderboard_visible", label: "Leaderboard Visible to Partners", type: "boolean", default: true },
    { key: "new_partner_auto_activate", label: "Auto-Activate New Partners", type: "boolean", default: false },
    { key: "max_referral_expiry_months", label: "Max Referral Commission Months", type: "number", default: 12 },
  ];

  const loaded = Object.keys(local).length > 0;
  if (!loaded && Object.keys(settings).length > 0) {
    const init: Record<string, any> = {};
    fields.forEach((f) => { init[f.key] = settings[f.key] ?? f.default; });
    setLocal(init);
  }

  const handleSave = async () => {
    if (!user?._id) return;
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(local)) {
        await saveSetting({ key, value });
      }
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-zinc-900 mb-1">Partnership Settings</h3>
      <p className="text-sm font-semibold text-zinc-400 mb-6">Configure global partnership program values.</p>
      <div className="space-y-4 max-w-lg">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{f.label}</label>
            {f.type === "boolean" ? (
              <button onClick={() => setLocal({ ...local, [f.key]: !local[f.key] })}
                className={`w-12 h-6 rounded-full transition-colors ${local[f.key] ? "bg-emerald-500" : "bg-zinc-300"} relative`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${local[f.key] ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            ) : (
              <input type="number" value={local[f.key] ?? f.default} onChange={(e) => setLocal({ ...local, [f.key]: Number(e.target.value) })}
                className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
            )}
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="mt-6 w-full max-w-lg rounded-xl bg-zinc-900 py-4 text-sm font-black text-white transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50">
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

// ─── PARTNER PROFILE ──────────────────────────────────

function PartnerProfileTab({ partnerId, onBack }: { partnerId: Id<"partners">; onBack: () => void }) {
  const profile = useQuery(api.partnership.adminGetPartnerProfile, { partnerId });

  if (!profile) return <div className="h-96 rounded-2xl bg-white animate-pulse" />;

  const { partner, user, referrals, payments, earnings, bankDetails, achievements, payoutRequests, referredUsers } = profile;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 px-4 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
        ← Back to Partners
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900">{partner.fullName || "Unnamed Partner"}</h2>
            <p className="text-sm font-semibold text-zinc-500 mt-1">{partner.email} · {partner.partnerType} · {statusBadge(partner.status)}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-zinc-500">
              <span>Code: <code className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-800">{partner.referralCode}</code></span>
              <span>Partner ID: <code className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-800">{partner.partnerId}</code></span>
              <span>Since: {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl bg-zinc-900 px-4 py-2 text-[10px] font-black text-white transition-all hover:bg-zinc-800"><UserPlus size={12} className="inline" /> Assign User</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", value: String(partner.totalRegistrations || 0) },
          { label: "Qualified", value: String(partner.qualifiedReferrals || 0) },
          { label: "Active Subscribers", value: String(partner.activeSubscribers || 0) },
          { label: "Total Clicks", value: String(partner.totalClicks || 0) },
          { label: "Total Earnings", value: fmt(partner.totalEarnings || 0) },
          { label: "Pending Earnings", value: fmt(partner.pendingEarnings || 0) },
          { label: "Paid Earnings", value: fmt(partner.paidEarnings || 0) },
          { label: "Commission Rate", value: `₦${partner.commissionPerQualified || 500}` },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{s.label}</div>
            <div className="text-lg font-black text-zinc-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrals */}
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4"><h3 className="text-base font-black">Referrals ({referrals.length})</h3></div>
          <div className="divide-y divide-black/5 max-h-80 overflow-y-auto">
            {referrals.length === 0 ? <div className="p-8 text-center text-sm font-bold text-zinc-400">No referrals</div> : referrals.map((r: any) => (
              <div key={r._id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                <div>
                  <div className="text-sm font-bold text-zinc-900">{r.userEmail || "Unknown"}</div>
                  <div className="text-[10px] font-semibold text-zinc-400">{r.status} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600">{r.commission ? fmt(r.commission) : "—"}</div>
                  {statusBadge(r.qualified ? "qualified" : "pending")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout History */}
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4"><h3 className="text-base font-black">Payout History ({payments.length})</h3></div>
          <div className="divide-y divide-black/5 max-h-80 overflow-y-auto">
            {payments.length === 0 ? <div className="p-8 text-center text-sm font-bold text-zinc-400">No payouts</div> : payments.map((p: any) => (
              <div key={p._id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                <div>
                  <div className="text-sm font-bold text-zinc-900">{fmt(p.amount)}</div>
                  <div className="text-[10px] font-semibold text-zinc-400">{p.period} {p.transactionReference && `· ${p.transactionReference}`}</div>
                </div>
                {statusBadge(p.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details */}
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4"><h3 className="text-base font-black">Bank Details ({bankDetails.length})</h3></div>
          <div className="divide-y divide-black/5">
            {bankDetails.length === 0 ? <div className="p-8 text-center text-sm font-bold text-zinc-400">No bank details</div> : bankDetails.map((b: any) => (
              <div key={b._id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-zinc-900">{b.bank_name}</div>
                    <div className="text-xs font-semibold text-zinc-500">{b.account_name} · {b.account_number}</div>
                  </div>
                  {statusBadge(b.verification_status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4"><h3 className="text-base font-black">Achievements ({achievements.length})</h3></div>
          <div className="p-5">
            {achievements.length === 0 ? <p className="text-sm font-bold text-zinc-400 text-center py-4">No achievements</p> : (
              <div className="grid grid-cols-3 gap-3">
                {(achievements as any[]).map((a) => (
                  <div key={a._id} className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                    <Trophy size={20} className="mx-auto text-amber-500" />
                    <p className="text-[10px] font-bold text-zinc-700 mt-1">{a.name}</p>
                    <p className="text-[8px] font-semibold text-zinc-400">{new Date(a.unlocked_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED UI HELPERS ───────────────────────────────

function InputField({ label, value, onChange, type = "text", textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900" />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[] }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-zinc-900">
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lbl = typeof o === "string" ? o.charAt(0).toUpperCase() + o.slice(1).replace(/_/g, " ") : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}
