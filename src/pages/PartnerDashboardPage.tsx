import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import {
  Handshake, Copy, Share2, ExternalLink, TrendingUp, Wallet,
  Calendar, Target, QrCode, Download, MessageCircle,
  Twitter, Send, Instagram, Facebook, ChevronRight,
  Gift, Award, Star, Crown, Zap, BookOpen, Image,
  FileText, HelpCircle, Bell, Clock, BarChart3,
  Users, DollarSign, CheckCircle, Search,
  AlertCircle, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, Megaphone, PiggyBank, Trophy, Settings,
  UserPlus, Eye, ChevronLeft, Medal, Flame, Sparkles,
  Globe, Lock, Timer, RefreshCw, List,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const partnerTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  creator: { label: "Creator", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  influencer: { label: "Influencer", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  student: { label: "Student", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  ambassador: { label: "Ambassador", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  affiliate: { label: "Affiliate", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
};

function partnerTypeBadge(type: string) {
  const cfg = partnerTypeConfig[type?.toLowerCase()] || { label: type, color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200" };
  return <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-black ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-red-100 text-red-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    paid: "bg-blue-100 text-blue-700",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${styles[status?.toLowerCase()] || "bg-zinc-100 text-zinc-600"}`}>{status}</span>;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

const performanceData = [
  { label: "Mon", value: 3 }, { label: "Tue", value: 7 }, { label: "Wed", value: 5 },
  { label: "Thu", value: 12 }, { label: "Fri", value: 8 }, { label: "Sat", value: 15 }, { label: "Sun", value: 10 },
];

function AchievementBadge({ icon, label, unlocked }: { icon: React.ReactNode; label: string; unlocked: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${unlocked ? "border-amber-200 bg-amber-50" : "border-black/5 bg-zinc-50 opacity-40"}`}>
      <div className={unlocked ? "text-amber-500" : "text-gray-300"}>{icon}</div>
      <span className="text-[10px] font-bold leading-tight text-zinc-600">{label}</span>
    </div>
  );
}

function NotificationItem({ icon, text, time }: { icon: React.ReactNode; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-zinc-700">{text}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-gray-400">{time}</p>
      </div>
    </div>
  );
}

function ResourceCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/5 px-4 py-3 transition-colors hover:bg-zinc-50">
      <div className="shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-zinc-700">{title}</p>
        <p className="text-xs font-semibold text-gray-400">{desc}</p>
      </div>
      <ChevronRight size={14} className="shrink-0 text-gray-300" />
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: any }) {
  const currentUser = auth.getCurrentUser();
  const joinCampaign = useMutation(api.campaigns.participate);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!currentUser?._id) return;
    setJoining(true);
    try {
      await joinCampaign({ campaign_id: campaign._id, user_id: currentUser._id as any });
      toast.success("Joined campaign!");
    } catch (e: any) {
      toast.error(e.message || "Failed to join");
    }
    setJoining(false);
  };

  const daysLeft = campaign.time_remaining ? Math.ceil(campaign.time_remaining / 86400000) : 0;
  const isRaffle = campaign.campaign_type === "q_raffle" || campaign.type === "raffle";
  const rewardLabel = campaign.reward_type === "cash" ? fmt(campaign.reward_amount) : campaign.reward_type === "boots" ? `${campaign.reward_amount} BOOTS` : campaign.reward_structure?.slice(0, 40);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:shadow-md">
      {campaign.banner_url && (
        <div className="h-28 w-full overflow-hidden bg-zinc-100">
          <img src={campaign.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-zinc-900 truncate">{campaign.name}</h3>
              {campaign.visibility === "invite_only" && <Lock size={12} className="shrink-0 text-amber-500" />}
            </div>
            <p className="mt-0.5 text-xs font-bold text-gray-400 capitalize">{campaign.campaign_type || campaign.type}</p>
          </div>
          <div className="shrink-0">
            {isRaffle ? <Trophy size={18} className="text-amber-500" /> : <Megaphone size={18} className="text-blue-500" />}
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-xs font-semibold text-zinc-500">{campaign.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-400">
          <span className="inline-flex items-center gap-1"><Users size={12} /> {campaign.participant_count}</span>
          {daysLeft > 0 && <span className="inline-flex items-center gap-1"><Timer size={12} /> {daysLeft}d left</span>}
          {campaign.visibility === "invite_only" && <span className="inline-flex items-center gap-1 text-amber-500"><Lock size={12} /> Invite Only</span>}
        </div>

        {rewardLabel && (
          <div className="mt-2 rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100 px-3 py-2 text-xs font-black text-zinc-800">
            {rewardLabel}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {campaign.has_joined ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600">
              <CheckCircle size={14} /> Joined
            </span>
          ) : campaign.visibility === "invite_only" ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-600">
              <Lock size={14} /> Invitation Required
            </span>
          ) : (
            <button onClick={handleJoin} disabled={joining}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50">
              {joining ? "Joining..." : "Join Campaign"}
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 px-4 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
            <Eye size={14} /> View
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const partnerTabs = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "campaigns", label: "Campaigns", icon: <Megaphone size={16} /> },
  { id: "payouts", label: "Payouts", icon: <PiggyBank size={16} /> },
  { id: "achievements", label: "Achievements", icon: <Trophy size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export default function PartnerDashboardPage({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const currentUser = auth.getCurrentUser();
  const userId = currentUser?._id;

  const [partnerTab, setPartnerTab] = useState("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const storedPartnerId = typeof window !== "undefined" ? localStorage.getItem("partner_id") : null;
  const partnerByUser = useQuery(api.partners.getPartnerByUserId, userId ? { userId: userId as any } : "skip");
  const partnerByIdObj = useQuery(api.partners.getPartnerDashboard, storedPartnerId && !partnerByUser ? { partnerId: storedPartnerId as any } : "skip");
  const partner = partnerByUser ?? partnerByIdObj?.partner ?? null;
  const dashboard = useQuery(api.partners.getPartnerDashboard, partner?._id ? { partnerId: partner._id as any } : "skip");
  const announcements = useQuery(api.partners.getAnnouncements);
  const assets = useQuery(api.partners.getMarketingAssets);
  const catalogCommissions = useQuery(api.partners.listCatalogCommissions);

  const campaigns = useQuery(api.campaigns.getAvailableCampaigns, userId ? { user_id: userId as any } : "skip") || [];
  const myCampaigns = useQuery(api.campaigns.getMyCampaigns, userId ? { user_id: userId as any } : "skip") || [];

  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(7);
  const [refSearch, setRefSearch] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [refPage, setRefPage] = useState(0);
  const [payoutPage, setPayoutPage] = useState(0);
  const pageSize = 5;

  const loading = partner === undefined;

  const referrals = dashboard?.referrals || [];
  const payments = dashboard?.payments || [];

  const filteredReferrals = useMemo(() => {
    const q = refSearch.trim().toLowerCase();
    if (!q) return referrals;
    return referrals.filter((r: any) => r.userEmail?.toLowerCase().includes(q));
  }, [referrals, refSearch]);

  const paginatedReferrals = filteredReferrals.slice(refPage * pageSize, (refPage + 1) * pageSize);
  const refTotalPages = Math.max(1, Math.ceil(filteredReferrals.length / pageSize));

  const filteredPayouts = useMemo(() => {
    const q = payoutSearch.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p: any) => p.transactionReference?.toLowerCase().includes(q) || p.period?.toLowerCase().includes(q));
  }, [payments, payoutSearch]);

  const paginatedPayouts = filteredPayouts.slice(payoutPage * pageSize, (payoutPage + 1) * pageSize);
  const payoutTotalPages = Math.max(1, Math.ceil(filteredPayouts.length / pageSize));

  const chartData = useMemo(() => {
    const now = Date.now();
    const ms = chartPeriod * 86400000;
    const cutoff = now - ms;
    const periodRefs = referrals.filter((r: any) => r.createdAt >= cutoff);
    return Array.from({ length: chartPeriod }, (_, i) => {
      const d = new Date(now - (chartPeriod - 1 - i) * 86400000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const count = periodRefs.filter((r: any) => r.createdAt >= dayStart && r.createdAt < dayEnd).length;
      const label = chartPeriod === 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : `${d.getDate()}/${d.getMonth() + 1}`;
      return { label, value: count };
    });
  }, [referrals, chartPeriod]);

  const copyToClipboard = async (text: string, label = "Copied!") => {
    try { await navigator.clipboard.writeText(text); toast.success(label); }
    catch { toast.error("Failed to copy"); }
  };

  const referralUrl = partner?.referralCode ? `https://jointheq.sbs/r/${partner.referralCode}` : "";
  const partnerSince = partner?.createdAt ? new Date(partner.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
  const nextPaymentDate = partner?.paymentSchedule === "weekly"
    ? new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : partner?.paymentSchedule === "monthly"
      ? new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : "Quarterly";

  const achievements = [
    { icon: <Gift size={18} />, label: "First Referral", unlocked: (partner?.totalRegistrations || 0) >= 1 },
    { icon: <Users size={18} />, label: "10 Referrals", unlocked: (partner?.totalRegistrations || 0) >= 10 },
    { icon: <Award size={18} />, label: "50 Referrals", unlocked: (partner?.totalRegistrations || 0) >= 50 },
    { icon: <DollarSign size={18} />, label: "₦10k Earned", unlocked: (partner?.totalEarnings || 0) >= 10000 },
    { icon: <Crown size={18} />, label: "Top Creator", unlocked: (partner?.qualifiedReferrals || 0) >= 20 },
    { icon: <Star size={18} />, label: "Monthly Champ", unlocked: (partner?.totalEarnings || 0) >= 50000 },
  ];

  const campaignAchievements = [
    { icon: <Flame size={18} />, label: "First Campaign", unlocked: myCampaigns.length >= 1 },
    { icon: <Medal size={18} />, label: "Top Performer", unlocked: myCampaigns.some((c: any) => c.rank && c.rank <= 3) },
    { icon: <Trophy size={18} />, label: "Campaign Win", unlocked: false },
    { icon: <Star size={18} />, label: "10 Campaigns", unlocked: myCampaigns.length >= 10 },
  ];

  const resources = [
    { icon: <BookOpen size={18} />, title: "Creator Guide", desc: "Learn how to maximize your earnings" },
    { icon: <Image size={18} />, title: "Marketing Assets", desc: "Logos, flyers & social images" },
    { icon: <FileText size={18} />, title: "Content Templates", desc: "Pre-made posts & captions" },
    { icon: <HelpCircle size={18} />, title: "Affiliate Rules", desc: "Program terms & guidelines" },
  ];

  const notifications = [
    { icon: <DollarSign size={14} />, text: "You earned ₦250 from John's Spotify subscription.", time: "2 hours ago" },
    { icon: <CheckCircle size={14} />, text: "Your payout of ₦12,000 has been sent.", time: "3 days ago" },
    { icon: <Zap size={14} />, text: "New campaign available: CapCut Premium.", time: "1 week ago" },
  ];

  if (loading) {
    const skeleton = (
      <>
        <div className="h-8 w-48 rounded-lg bg-zinc-200 animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-zinc-100 animate-pulse" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-48 rounded-2xl bg-zinc-200 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-200 animate-pulse" />)}
          </div>
        </div>
      </>
    );
    if (compact) return skeleton;
    return <div className="min-h-screen bg-[#f4f5f8]"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{skeleton}</div></div>;
  }

  if (!partner) {
    const nonPartnerContent = (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-black/5 bg-white p-8 sm:p-12 shadow-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
          <Handshake size={40} className="text-orange-500" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-zinc-900 sm:text-3xl">Become a JoinTheQ Partner</h1>
        <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-gray-500">
          Invite friends to JoinTheQ and earn commissions whenever they subscribe. Turn your network into income.
        </p>
        <div className="mx-auto mt-8 grid max-w-sm gap-3 text-left">
          {[
            { icon: <TrendingUp size={16} />, text: "Flexible earnings — no cap" },
            { icon: <Wallet size={16} />, text: "Weekly payouts directly to your bank" },
            { icon: <Zap size={16} />, text: "Personal referral code & tracking" },
            { icon: <Target size={16} />, text: "Real-time performance dashboard" },
            { icon: <Gift size={16} />, text: "Exclusive campaigns & bonuses" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3">
              <div className="shrink-0 text-orange-500">{item.icon}</div>
              <span className="text-sm font-bold text-zinc-700">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95">
            Apply Now <ArrowUpRight size={16} />
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-6 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
            Learn More
          </button>
        </div>
        {!compact && (
          <p className="mt-4 text-xs font-semibold text-gray-400">
            Already a partner? <button onClick={() => navigate("/dashboard")} className="text-orange-500 underline hover:text-orange-600">Go to Dashboard</button>
          </p>
        )}
      </motion.div>
    );
    if (compact) return nonPartnerContent;
    return <div className="min-h-screen bg-[#f4f5f8]"><div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">{nonPartnerContent}</div></div>;
  }

  const partnerContent = (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Partnership</h1>
            {partner.partnerType && partnerTypeBadge(partner.partnerType)}
          </div>
          <p className="mt-1 text-sm font-bold text-gray-500">Earn commissions by helping more people discover JoinTheQ.</p>
        </div>
        {!compact && (
          <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 px-4 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
            Main Dashboard
          </button>
        )}
      </motion.div>

      {/* Sub-tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
        {partnerTabs.map((t) => (
          <button key={t.id} onClick={() => { setPartnerTab(t.id); setSelectedCampaign(null); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all whitespace-nowrap ${partnerTab === t.id ? "bg-zinc-900 text-white shadow-lg shadow-black/10" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── OVERVIEW TAB ─── */}
        {partnerTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Welcome Card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-zinc-900">Welcome back, {currentUser?.full_name || "Partner"}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {partner.partnerType && partnerTypeBadge(partner.partnerType)}
                        {statusBadge(partner.status)}
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                          <Calendar size={12} /> Partner since {partnerSince}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-xl border border-black/5 bg-zinc-50 px-5 py-3 text-center">
                      <div className="text-xs font-black uppercase tracking-widest text-gray-400">Referral Code</div>
                      <div className="mt-1 text-lg font-black tracking-wider text-zinc-900">{partner.referralCode}</div>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button onClick={() => copyToClipboard(partner.referralCode, "Code copied!")} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-black text-white transition-all hover:bg-zinc-800 active:scale-95">
                          <Copy size={12} className="inline" /> Copy
                        </button>
                        <button onClick={() => copyToClipboard(referralUrl, "Link copied!")} className="rounded-lg border border-black/10 px-3 py-1.5 text-[10px] font-black text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95">
                          <Share2 size={12} className="inline" /> Link
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Performance Chart */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-zinc-900">Referral Activity</h3>
                    <div className="flex gap-1 rounded-lg border border-black/5 p-0.5">
                      {([7, 30, 90] as const).map(p => (
                        <button key={p} onClick={() => setChartPeriod(p)}
                          className={`rounded-lg px-3 py-1 text-[10px] font-black transition-all ${chartPeriod === p ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"}`}>{p}d</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5" style={{ height: 120 }}>
                    {chartData.map((d, i) => {
                      const max = Math.max(...chartData.map(x => x.value), 1);
                      const h = (d.value / max) * 100;
                      return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <span className="text-[9px] font-bold text-zinc-400">{d.value}</span>
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-orange-300 transition-all" style={{ height: `${Math.max(h, 2)}%` }} />
                          <span className="text-[9px] font-bold text-zinc-400">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Recent Referrals */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                    <h3 className="text-base font-black text-zinc-900">Recent Referrals</h3>
                    <div className="relative">
                      <input value={refSearch} onChange={e => { setRefSearch(e.target.value); setRefPage(0); }}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-sm font-semibold text-zinc-900 outline-none placeholder:text-gray-300 focus:border-zinc-900 sm:w-56"
                        placeholder="Search..." />
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div className="divide-y divide-black/5">
                    {paginatedReferrals.length === 0 && (
                      <div className="px-5 py-12 text-center">
                        <Users size={24} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-bold text-gray-400">{refSearch ? "No matches" : "No referrals yet. Share your link!"}</p>
                      </div>
                    )}
                    {paginatedReferrals.map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-zinc-50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-500">
                            {r.userEmail?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-900">{r.userEmail || "Unknown"}</div>
                            <div className="text-[10px] font-semibold text-gray-400">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-zinc-900">{r.commission ? fmt(r.commission) : "—"}</div>
                          {statusBadge(r.qualified ? "qualified" : "pending")}
                        </div>
                      </div>
                    ))}
                  </div>
                  {refTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-black/5 px-5 py-3">
                      <button disabled={refPage === 0} onClick={() => setRefPage(p => p - 1)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30">Previous</button>
                      <span className="text-xs font-bold text-gray-400">Page {refPage + 1} of {refTotalPages}</span>
                      <button disabled={refPage >= refTotalPages - 1} onClick={() => setRefPage(p => p + 1)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30">Next</button>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Stats Cards */}
                {[
                  { icon: <Users size={20} />, label: "Total Referrals", value: fmtNum(partner.totalRegistrations || 0), color: "text-blue-600", bg: "bg-blue-50" },
                  { icon: <CheckCircle size={20} />, label: "Qualified", value: fmtNum(partner.qualifiedReferrals || 0), color: "text-emerald-600", bg: "bg-emerald-50" },
                  { icon: <DollarSign size={20} />, label: "Total Earnings", value: fmt(partner.totalEarnings || 0), color: "text-amber-600", bg: "bg-amber-50" },
                  { icon: <TrendingUp size={20} />, label: "Active Subs", value: fmtNum(partner.activeSubscribers || 0), color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                        <div className="text-xl font-black text-zinc-900">{stat.value}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Available Balance */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-sm">
                  <Wallet size={24} className="text-orange-400" />
                  <div className="mt-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Available Balance</div>
                    <div className="mt-1 text-3xl font-black text-white">{fmt(partner.pendingEarnings || 0)}</div>
                  </div>
                  {partner.pendingEarnings >= 5000 ? (
                    <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95">
                      <Wallet size={16} /> Withdraw Funds
                    </button>
                  ) : (
                    <div className="mt-4">
                      <button disabled className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-700 px-5 py-3 text-sm font-black text-zinc-500 cursor-not-allowed">
                        <Wallet size={16} /> Withdraw Funds
                      </button>
                      <p className="mt-2 text-xs font-semibold text-zinc-400 text-center">
                        You need ₦{Math.max(0, 5000 - (partner.pendingEarnings || 0)).toLocaleString()} more before requesting payout.
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Quick Campaigns */}
                {myCampaigns.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-base font-black text-zinc-900">Your Campaigns</h3>
                    <div className="space-y-2">
                      {myCampaigns.slice(0, 3).map((c: any) => (
                        <div key={c._id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                          <div>
                            <div className="text-sm font-bold text-zinc-800">{c.campaign_name}</div>
                            <div className="text-xs font-semibold text-gray-400">{c.referral_count} referrals · Rank #{c.rank}</div>
                          </div>
                          <span className="text-xs font-black text-emerald-600">+{fmt(c.campaign_earnings || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Commission Rates */}
                {catalogCommissions && catalogCommissions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-base font-black text-zinc-900">Commission per Service</h3>
                    <div className="space-y-1">
                      {catalogCommissions.filter(c => c.commissionEnabled).map((c: any) => (
                        <div key={c._id} className="flex items-center justify-between rounded-xl px-4 py-2.5">
                          <span className="text-sm font-bold text-zinc-800">{c.name}</span>
                          <span className="text-sm font-black text-emerald-600">
                            {c.commissionType === "fixed"
                              ? fmt(c.commissionValue)
                              : `${c.commissionValue}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── CAMPAIGNS TAB ─── */}
        {partnerTab === "campaigns" && (
          <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {selectedCampaign ? (
              <CampaignDetailView campaign={selectedCampaign} onBack={() => setSelectedCampaign(null)} userId={userId as any} />
            ) : (
              <>
                {/* My Campaigns */}
                {myCampaigns.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-lg font-black text-zinc-900">My Campaigns</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {myCampaigns.map((c: any) => (
                        <button key={c._id} onClick={() => setSelectedCampaign({ ...c, _id: c.campaign_id })} className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-black text-zinc-900">{c.campaign_name}</h3>
                              <p className="text-xs font-bold text-gray-400 capitalize mt-0.5">{c.campaign_type || "Campaign"}</p>
                            </div>
                            {c.campaign_type === "q_raffle" && <Trophy size={16} className="text-amber-500" />}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div><span className="font-bold text-zinc-800">{c.referral_count}</span> <span className="text-gray-400">refs</span></div>
                            <div><span className="font-bold text-zinc-800">#{c.rank}</span> <span className="text-gray-400">of {c.total_participants}</span></div>
                            {c.campaign_earnings > 0 && <div className="col-span-2"><span className="font-black text-emerald-600">+{fmt(c.campaign_earnings)}</span></div>}
                          </div>
                          {c.time_remaining > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-gray-400">
                              <Timer size={10} /> {Math.ceil(c.time_remaining / 86400000)}d remaining
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Campaigns */}
                <div>
                  <h2 className="mb-4 text-lg font-black text-zinc-900">Available Campaigns</h2>
                  {campaigns.length === 0 ? (
                    <div className="rounded-2xl border border-black/5 bg-white p-12 text-center shadow-sm">
                      <Megaphone size={32} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-gray-400">No campaigns available right now. Check back later!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {campaigns.map((c: any) => (
                        <div key={c._id} className="relative">
                          <CampaignCard campaign={c} />
                          <button onClick={() => setSelectedCampaign(c)} className="absolute inset-0 z-10 opacity-0" aria-label="View details" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ─── PAYOUTS TAB ─── */}
        {partnerTab === "payouts" && (
          <motion.div key="payouts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Payout History */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white shadow-sm">
                  <div className="border-b border-black/5 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-black text-zinc-900">Payout History</h3>
                      <div className="relative">
                        <input value={payoutSearch} onChange={e => { setPayoutSearch(e.target.value); setPayoutPage(0); }}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-sm font-semibold text-zinc-900 outline-none placeholder:text-gray-300 focus:border-zinc-900 sm:w-56"
                          placeholder="Search..." />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-black/5">
                    {paginatedPayouts.length === 0 && (
                      <div className="px-5 py-12 text-center">
                        <Wallet size={24} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-bold text-gray-400">{payoutSearch ? "No payouts match your search" : "No payouts yet"}</p>
                      </div>
                    )}
                    {paginatedPayouts.map((p: any) => (
                      <div key={p._id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-zinc-50">
                        <div>
                          <div className="font-bold text-zinc-900">{fmt(p.amount)}</div>
                          <div className="text-xs font-semibold text-gray-400">
                            {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {p.transactionReference && ` · ${p.transactionReference.slice(0, 8)}...`}
                          </div>
                        </div>
                        {statusBadge(p.status)}
                      </div>
                    ))}
                  </div>
                  {payoutTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-black/5 px-5 py-3">
                      <button disabled={payoutPage === 0} onClick={() => setPayoutPage(p => p - 1)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30">Previous</button>
                      <span className="text-xs font-bold text-gray-400">Page {payoutPage + 1} of {payoutTotalPages}</span>
                      <button disabled={payoutPage >= payoutTotalPages - 1} onClick={() => setPayoutPage(p => p + 1)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30">Next</button>
                    </div>
                  )}
                </motion.div>
              </div>
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-sm">
                  <Wallet size={24} className="text-orange-400" />
                  <div className="mt-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Available Balance</div>
                    <div className="mt-1 text-3xl font-black text-white">{fmt(partner.pendingEarnings || 0)}</div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs font-semibold text-zinc-400">
                    <div className="flex justify-between"><span>Total Earned</span><span className="text-white">{fmt(partner.totalEarnings || 0)}</span></div>
                    <div className="flex justify-between"><span>Withdrawn</span><span className="text-white">{fmt(partner.paidEarnings || 0)}</span></div>
                    <div className="flex justify-between"><span>Next Payout</span><span className="text-white">{nextPaymentDate}</span></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ACHIEVEMENTS TAB ─── */}
        {partnerTab === "achievements" && (
          <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Affiliate Achievements */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-base font-black text-zinc-900">Affiliate Achievements</h3>
                <div className="grid grid-cols-3 gap-2">
                  {achievements.map((a, i) => <AchievementBadge key={i} {...a} />)}
                </div>
              </motion.div>

              {/* Campaign Achievements */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-base font-black text-zinc-900">Campaign Achievements</h3>
                <div className="grid grid-cols-2 gap-2">
                  {campaignAchievements.map((a, i) => <AchievementBadge key={i} {...a} />)}
                </div>
              </motion.div>

              {/* Notifications */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-zinc-900">Notifications</h3>
                  <Bell size={16} className="text-gray-300" />
                </div>
                <div className="mt-4 space-y-2">
                  {notifications.map((n, i) => <NotificationItem key={i} {...n} />)}
                </div>
              </motion.div>

              {/* Resources */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-base font-black text-zinc-900">Resources</h3>
                <div className="space-y-2">
                  {resources.map((r, i) => <ResourceCard key={i} {...r} />)}
                </div>
                {assets && assets.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">Marketing Assets ({assets.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {assets.slice(0, 4).map((a: any) => (
                        <button key={a._id} className="flex items-center gap-2 rounded-xl border border-black/5 bg-zinc-50 p-3 text-left transition-colors hover:bg-zinc-100">
                          <Download size={14} className="shrink-0 text-gray-400" />
                          <span className="min-w-0 truncate text-xs font-bold text-zinc-700">{a.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {partnerTab === "settings" && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-zinc-900">Partner Settings</h2>
              <p className="mt-1 text-sm font-semibold text-gray-400">Manage your partnership preferences.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-black/5 bg-zinc-50 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400">Referral Code</label>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-black text-zinc-900">{partner.referralCode}</span>
                    <span className="rounded-lg bg-zinc-200 px-2 py-0.5 text-[10px] font-black text-zinc-500">Permanent</span>
                  </div>
                </div>
                <div className="rounded-xl border border-black/5 bg-zinc-50 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400">Payment Schedule</label>
                  <p className="mt-1 text-sm font-bold text-zinc-700 capitalize">{partner.paymentSchedule || "Monthly"}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-zinc-50 p-4">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400">Commission Rate</label>
                  <p className="mt-1 text-sm font-bold text-zinc-700">{partner.commissionPerQualified ? fmt(partner.commissionPerQualified) : "₦500"} per qualified referral</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (compact) return partnerContent;
  return <div className="min-h-screen bg-[#f4f5f8]">{partnerContent}</div>;
}

function CampaignDetailView({ campaign, onBack, userId }: { campaign: any; onBack: () => void; userId: any }) {
  const detail = useQuery(api.campaigns.getCampaignDetail, campaign._id ? { campaign_id: campaign._id, user_id: userId } : "skip");
  const joinCampaign = useMutation(api.campaigns.participate);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!userId) return;
    setJoining(true);
    try {
      await joinCampaign({ campaign_id: campaign._id, user_id: userId });
      toast.success("Joined campaign!");
    } catch (e: any) {
      toast.error(e.message || "Failed to join");
    }
    setJoining(false);
  };

  if (!detail) return <div className="rounded-2xl border border-black/5 bg-white p-12 text-center shadow-sm"><div className="h-8 w-48 rounded-lg bg-zinc-200 animate-pulse mx-auto" /></div>;

  const isRaffle = detail.campaign_type === "q_raffle" || detail.type === "raffle";
  const daysLeft = detail.time_remaining ? Math.ceil(detail.time_remaining / 86400000) : 0;
  const referralLink = detail.referral_code ? `https://jointheq.sbs/c/${detail.campaign_type || detail.type}/${detail.referral_code}` : "";
  const isJoined = !!detail.my_participation;

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-black/5 px-4 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
        <ChevronLeft size={14} /> Back to Campaigns
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Banner */}
          {detail.banner_url && (
            <div className="h-40 w-full overflow-hidden rounded-2xl bg-zinc-100">
              <img src={detail.banner_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          {/* Campaign Info */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-zinc-900">{detail.name}</h2>
                  {isRaffle && <Trophy size={20} className="text-amber-500" />}
                </div>
                <p className="mt-1 text-xs font-bold text-gray-400 capitalize">{detail.campaign_type || detail.type}</p>
              </div>
              {detail.visibility === "invite_only" && (
                <span className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-600">
                  <Lock size={10} /> Invite Only
                </span>
              )}
            </div>

            <p className="mt-4 text-sm font-semibold text-zinc-600 leading-relaxed">{detail.description}</p>

            {detail.about && (
              <div className="mt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">About</h4>
                <p className="text-sm font-semibold text-zinc-600">{detail.about}</p>
              </div>
            )}

            {detail.rules && detail.rules.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Rules</h4>
                <ul className="space-y-1">
                  {detail.rules.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-semibold text-zinc-600">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reward Structure */}
            {detail.reward_structure && (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Reward Structure</h4>
                <p className="text-sm font-bold text-zinc-800">{detail.reward_structure}</p>
              </div>
            )}

            {/* How It Works */}
            {detail.how_it_works && detail.how_it_works.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">How It Works</h4>
                <ol className="space-y-2">
                  {detail.how_it_works.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-semibold text-zinc-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-black text-white">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Countdown */}
            {daysLeft > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-3">
                <Timer size={14} className="text-gray-400" />
                <span className="text-xs font-bold text-zinc-600">{daysLeft} days remaining</span>
                <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${Math.min(100, ((detail.end_date as number) - Date.now()) / ((detail.end_date as number) - (detail.start_date as number)) * 100)}%` }} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Social Tasks */}
          {detail.social_tasks && detail.social_tasks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-black text-zinc-900">Bonus Tasks</h3>
              <div className="space-y-2">
                {detail.social_tasks.map((task: any) => {
                  const completed = detail.my_participation?.social_tasks_completed?.includes(task._id);
                  return (
                    <div key={task._id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${completed ? "bg-emerald-50" : "bg-zinc-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${completed ? "bg-emerald-200 text-emerald-600" : "bg-zinc-200 text-zinc-500"}`}>
                          <Sparkles size={14} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${completed ? "text-emerald-700" : "text-zinc-700"}`}>{task.name}</p>
                          <p className="text-[10px] font-semibold text-gray-400">{task.reward_amount} {task.reward_type}</p>
                        </div>
                      </div>
                      {completed ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : task.destination_url ? (
                        <a href={task.destination_url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-black text-white transition-all hover:bg-zinc-800">
                          Complete
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Leaderboard */}
          {detail.leaderboard && detail.leaderboard.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white shadow-sm">
              <div className="border-b border-black/5 px-5 py-4">
                <h3 className="text-base font-black text-zinc-900">Leaderboard</h3>
              </div>
              <div className="divide-y divide-black/5">
                {detail.leaderboard.slice(0, 10).map((entry: any) => {
                  const isMe = entry.user_id === userId;
                  const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "";
                  return (
                    <div key={entry.rank} className={`flex items-center justify-between px-5 py-3 transition-colors ${isMe ? "bg-amber-50" : "hover:bg-zinc-50"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${entry.rank <= 3 ? "text-lg" : "bg-zinc-100 text-zinc-500"}`}>
                          {medal || entry.rank}
                        </span>
                        <div>
                          <span className={`text-sm font-bold ${isMe ? "text-zinc-900" : "text-zinc-700"}`}>
                            {entry.full_name} {isMe && "(You)"}
                          </span>
                          <div className="text-[10px] font-semibold text-gray-400">@{entry.username}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-zinc-900">{entry.referral_count}</div>
                        <div className="text-[10px] font-semibold text-gray-400">refs</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Join / Status */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 mb-3">Participation</h3>
            {isJoined ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600">
                <CheckCircle size={14} /> Joined
              </span>
            ) : detail.visibility === "invite_only" ? (
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-600">
                  <Lock size={14} /> Invitation Required
                </span>
              </div>
            ) : (
              <button onClick={handleJoin} disabled={joining}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50">
                <UserPlus size={16} /> {joining ? "Joining..." : "Join Campaign"}
              </button>
            )}
          </motion.div>

          {/* Referral Link */}
          {isJoined && referralLink && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-zinc-900 mb-2">Your Referral Link</h3>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-600">{referralLink}</code>
                <button onClick={() => navigator.clipboard.writeText(referralLink).then(() => toast.success("Copied!"))}
                  className="shrink-0 rounded-lg bg-zinc-900 p-1.5 text-white transition-all hover:bg-zinc-800">
                  <Copy size={12} />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                {[
                  { icon: <MessageCircle size={14} />, color: "bg-emerald-500", label: "WhatsApp" },
                  { icon: <Send size={14} />, color: "bg-blue-500", label: "Telegram" },
                  { icon: <Twitter size={14} />, color: "bg-sky-500", label: "X" },
                ].map((s, i) => (
                  <button key={i} className={`flex items-center gap-1.5 rounded-xl ${s.color} px-3 py-1.5 text-[10px] font-black text-white transition-all hover:opacity-90 active:scale-95`}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* My Stats */}
          {isJoined && detail.my_participation && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-zinc-900 mb-3">My Performance</h3>
              <div className="space-y-3">
                {isRaffle ? [
                  { label: "Successful Referrals", value: detail.my_participation.qualified_referrals ?? 0 },
                  { label: "Total Tickets", value: detail.my_participation.entries ?? 0 },
                  { label: "Qualified", value: detail.my_participation.referral_count ?? 0 },
                  { label: "Rank", value: `#${detail.my_participation.rank}` },
                  { label: "Winning Chance", value: detail.my_participation.total_participants > 0 ? `${((detail.my_participation.entries ?? 0) / Math.max(1, detail.leaderboard.reduce((s: number, e: any) => s + (e.entries ?? 0), 0)) * 100).toFixed(1)}%` : "0%" },
                ] : [
                  { label: "Referrals", value: detail.my_participation.referral_count ?? 0 },
                  { label: "Qualified", value: detail.my_participation.qualified_referrals ?? 0 },
                  { label: "Earnings", value: fmt(detail.my_participation.campaign_earnings || 0) },
                  { label: "Rank", value: `#${detail.my_participation.rank}` },
                  { label: "Entries", value: detail.my_participation.entries ?? 0 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5">
                    <span className="text-xs font-bold text-gray-400">{s.label}</span>
                    <span className="text-sm font-black text-zinc-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Campaign Stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 mb-3">Campaign Stats</h3>
            <div className="space-y-3">
              {[
                { label: "Participants", value: detail.participant_count },
                { label: "Status", value: detail.status },
                { label: "Type", value: detail.campaign_type || detail.type },
                { label: "Visibility", value: detail.visibility || "public" },
                { label: "Ends", value: daysLeft > 0 ? `${daysLeft}d` : "Ended" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5">
                  <span className="text-xs font-bold text-gray-400">{s.label}</span>
                  <span className="text-xs font-black text-zinc-900 capitalize">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
