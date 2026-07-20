import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import {
  Handshake, Copy, Share2, ExternalLink, TrendingUp, Wallet,
  Calendar, Target, QrCode, Download, MessageCircle,
  Twitter, Send, Instagram, Facebook, ChevronRight,
  Gift, Award, Star, Crown, Zap, BookOpen, Image,
  FileText, HelpCircle, Bell, Clock,
  Users, DollarSign, CheckCircle, Search,
  AlertCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const partnerTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  creator: { label: "Creator", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  influencer: { label: "Influencer", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  affiliate: { label: "Affiliate", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  brand: { label: "Brand Partner", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  ambassador: { label: "Campus Ambassador", color: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
};

function fmt(n: number) {
  return "₦" + n.toLocaleString();
}

function partnerTypeBadge(type: string) {
  const cfg = partnerTypeConfig[type] || partnerTypeConfig.creator;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.color.replace("text", "bg")}`} />
      {cfg.label}
    </span>
  );
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
    paused: "bg-zinc-50 text-zinc-600 border-zinc-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${colors[status] || "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, sub, trend }: { icon: React.ReactNode; label: string; value: string; sub?: string; trend?: { dir: "up" | "down"; val: string } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${trend.dir === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {trend.dir === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.val}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-black text-zinc-900">{value}</div>
        <div className="mt-0.5 text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        {sub && <div className="mt-1 text-xs font-semibold text-gray-400">{sub}</div>}
      </div>
    </motion.div>
  );
}

function SimpleLineChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <div className="flex items-center justify-center" style={{ height }}><p className="text-sm font-bold text-gray-300">No data</p></div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 600;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (d.value / max) * (height - 30) - 15;
    return { x, y, ...d };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#f97316" stroke="white" strokeWidth="2" />
      ))}
      {pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 5)) === 0).map((p, i) => (
        <text key={i} x={p.x} y={height - 2} textAnchor="middle" fill="#a1a1aa" fontSize="10" fontWeight="600">{p.label}</text>
      ))}
    </svg>
  );
}

function AchievementBadge({ icon, label, unlocked }: { icon: React.ReactNode; label: string; unlocked: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${unlocked ? "border-amber-200 bg-amber-50" : "border-black/5 bg-white opacity-40"}`}>
      <div className={`${unlocked ? "text-amber-500" : "text-zinc-300"}`}>{icon}</div>
      <span className={`text-[10px] font-bold leading-tight ${unlocked ? "text-amber-700" : "text-zinc-400"}`}>{label}</span>
    </div>
  );
}

function ResourceCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-xl border border-black/5 bg-white p-4 text-left shadow-sm transition-all hover:border-zinc-900/20 hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-zinc-900">{title}</div>
        <div className="mt-0.5 text-xs font-semibold text-gray-400">{desc}</div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-gray-300" />
    </button>
  );
}

function NotificationItem({ icon, text, time }: { icon: React.ReactNode; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-3">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-700">{text}</p>
        <p className="mt-0.5 text-xs font-bold text-gray-400">{time}</p>
      </div>
    </div>
  );
}

export default function PartnerDashboardPage({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const currentUser = auth.getCurrentUser();
  const userId = currentUser?._id;

  const storedPartnerId = typeof window !== "undefined" ? localStorage.getItem("partner_id") : null;
  const partnerByUser = useQuery(api.partners.getPartnerByUserId, userId ? { userId: userId as any } : "skip");
  const partnerByIdObj = useQuery(api.partners.getPartnerDashboard, storedPartnerId && !partnerByUser ? { partnerId: storedPartnerId as any } : "skip");
  const partner = partnerByUser ?? partnerByIdObj?.partner ?? null;
  const dashboard = useQuery(api.partners.getPartnerDashboard, partner?._id ? { partnerId: partner._id as any } : "skip");
  const announcements = useQuery(api.partners.getAnnouncements);
  const assets = useQuery(api.partners.getMarketingAssets);

  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(7);
  const [refSearch, setRefSearch] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [refPage, setRefPage] = useState(0);
  const [payoutPage, setPayoutPage] = useState(0);
  const pageSize = 5;

  const loading = partner === undefined;

  const referrals = dashboard?.referrals || [];
  const payments = dashboard?.payments || [];
  const campaigns = dashboard?.campaigns || [];

  const filteredReferrals = useMemo(() => {
    const q = refSearch.trim().toLowerCase();
    if (!q) return referrals;
    return referrals.filter((r: any) =>
      r.userEmail?.toLowerCase().includes(q)
    );
  }, [referrals, refSearch]);

  const paginatedReferrals = filteredReferrals.slice(refPage * pageSize, (refPage + 1) * pageSize);
  const refTotalPages = Math.max(1, Math.ceil(filteredReferrals.length / pageSize));

  const filteredPayouts = useMemo(() => {
    const q = payoutSearch.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p: any) =>
      p.transactionReference?.toLowerCase().includes(q) ||
      p.period?.toLowerCase().includes(q)
    );
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
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch { toast.error("Failed to copy"); }
  };

  const referralUrl = partner?.referralCode
    ? `https://jointheq.sbs/r/${partner.referralCode}`
    : "";

  const partnerSince = partner?.createdAt
    ? new Date(partner.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

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
            Apply Now
            <ArrowUpRight size={16} />
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Welcome Card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-zinc-900">
                    Welcome back, {currentUser?.full_name || "Partner"} <span className="inline-block">👋</span>
                  </h2>
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
                  <div className="mt-1 font-mono text-lg font-black text-orange-500">{partner.referralCode}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => copyToClipboard(partner.referralCode || "", "Referral code copied!")}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95">
                  <Copy size={14} /> Copy Referral Code
                </button>
                <button onClick={() => copyToClipboard(referralUrl, "Referral link copied!")}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-95">
                  <Share2 size={14} /> Share Referral Link
                </button>
                {referralUrl && (
                  <div className="flex w-full items-center gap-2 rounded-xl border border-black/5 bg-zinc-50 px-4 py-2.5 text-xs font-mono font-semibold text-gray-500 sm:w-auto">
                    <ExternalLink size={12} className="shrink-0" />
                    <span className="truncate">{referralUrl}</span>
                    <button onClick={() => copyToClipboard(referralUrl)} className="shrink-0 text-zinc-900 hover:text-orange-500"><Copy size={12} /></button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Earnings Overview */}
            <div>
              <h3 className="mb-4 text-base font-black text-zinc-900">Earnings Overview</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard icon={<DollarSign size={18} />} label="Total Earnings" value={fmt(partner.totalEarnings || 0)} trend={{ dir: "up", val: "+12%" }} />
                <StatCard icon={<Clock size={18} />} label="Pending Earnings" value={fmt(partner.pendingEarnings || 0)} />
                <StatCard icon={<CheckCircle size={18} />} label="Paid Out" value={fmt(partner.paidEarnings || 0)} />
                <StatCard icon={<Users size={18} />} label="Successful Referrals" value={String(partner.qualifiedReferrals || 0)} sub="Qualified referrals" />
              </div>
            </div>

            {/* Commission Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-black text-zinc-900">Commission Details</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-zinc-50 p-4 text-center">
                  <div className="text-2xl font-black text-zinc-900">{partner.commissionPerQualified}%</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Commission Rate</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 text-center">
                  <div className="text-sm font-black text-zinc-900 capitalize">{partner.paymentSchedule}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Schedule</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 text-center">
                  <div className="text-sm font-black text-zinc-900">₦5,000</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Minimum Withdrawal</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 text-center">
                  <div className="text-sm font-black text-zinc-900">{nextPaymentDate}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Next Payment Date</div>
                </div>
              </div>
            </motion.div>

            {/* Performance Chart */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-zinc-900">Performance</h3>
                <div className="flex gap-1 rounded-lg border border-black/5 bg-zinc-50 p-0.5">
                  {([7, 30, 90] as const).map(p => (
                    <button key={p} onClick={() => { setChartPeriod(p); }}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${chartPeriod === p ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}>
                      {p}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <SimpleLineChart data={chartData} height={220} />
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Referrals</span>
              </div>
            </motion.div>

            {/* Referrals Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white shadow-sm">
              <div className="border-b border-black/5 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-black text-zinc-900">Referrals</h3>
                  <div className="relative">
                    <input value={refSearch} onChange={e => { setRefSearch(e.target.value); setRefPage(0); }}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-sm font-semibold text-zinc-900 outline-none placeholder:text-gray-300 focus:border-zinc-900 sm:w-64"
                      placeholder="Search by email..." />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/5 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Campaign</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Commission</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {paginatedReferrals.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-12 text-center">
                        <Users size={24} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm font-bold text-gray-400">{refSearch ? "No referrals match your search" : "No referrals yet"}</p>
                        <p className="text-xs text-gray-300 mt-1">Share your referral link to start earning</p>
                      </td></tr>
                    )}
                    {paginatedReferrals.map((r: any) => (
                      <tr key={r._id} className="transition-colors hover:bg-zinc-50">
                        <td className="px-5 py-3 font-bold text-zinc-900">{r.userEmail || "—"}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-500 capitalize">{r.campaignSlug}</td>
                        <td className="px-5 py-3">{statusBadge(r.status)}</td>
                        <td className="px-5 py-3 font-bold text-zinc-900">{fmt(r.commission)}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

            {/* Referral Tools */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-black text-zinc-900">Referral Tools</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-black/5 bg-zinc-50 p-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Referral Link</label>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-mono font-semibold text-zinc-700">{referralUrl}</span>
                    <button onClick={() => copyToClipboard(referralUrl)} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-black/5 bg-zinc-50 p-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">QR Code</label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white border border-black/10">
                      <QrCode size={36} className="text-zinc-900" />
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50">
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Share Via</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { icon: <MessageCircle size={16} />, label: "WhatsApp", color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
                    { icon: <Twitter size={16} />, label: "X", color: "bg-zinc-900 text-white hover:bg-zinc-800" },
                    { icon: <Send size={16} />, label: "Telegram", color: "bg-sky-50 text-sky-600 hover:bg-sky-100" },
                    { icon: <Instagram size={16} />, label: "Instagram", color: "bg-pink-50 text-pink-600 hover:bg-pink-100" },
                    { icon: <Facebook size={16} />, label: "Facebook", color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
                  ].map((s, i) => (
                    <button key={i} onClick={() => copyToClipboard(referralUrl, `${s.label} share link copied!`)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${s.color}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <button onClick={() => copyToClipboard(
                  `Hey! 🎉 Join me on JoinTheQ and unlock amazing subscription deals!\n\nSign up here: ${referralUrl}\n\nDon't miss out! 🚀`,
                  "Invitation message copied!"
                )}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95">
                  <Copy size={14} /> Copy Invitation Message
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Available Balance Card - Mobile Sticky */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-sm lg:sticky lg:top-6">
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

            {/* Achievements */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-black text-zinc-900">Achievements</h3>
              <div className="grid grid-cols-3 gap-2">
                {achievements.map((a, i) => <AchievementBadge key={i} {...a} />)}
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
      </div>
    </div>
  );

  if (compact) return partnerContent;
  return <div className="min-h-screen bg-[#f4f5f8]">{partnerContent}</div>;
}