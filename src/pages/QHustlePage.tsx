import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Users, Wallet, Copy, Share2, CheckCircle2,
  Clock, XCircle, Loader2, ChevronLeft, TrendingUp, UserPlus,
  Banknote, AlertCircle, CopyCheck, Settings, User, Lock,
  Handshake, MousePointerClick, DollarSign, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";

const QHUSTLE_STORAGE_KEY = "q_hustle_data";
const QHUSTLE_SETTINGS_KEY = "q_hustle_settings";

interface ReferralEntry {
  id: string;
  referredName: string;
  referredPhone: string;
  referredEmail?: string;
  status: "pending" | "approved" | "rejected";
  date: number;
  earnings: number;
  source?: string;
}

interface WithdrawalEntry {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  date: number;
}

interface QHustleData {
  userId: string;
  referrals: ReferralEntry[];
  withdrawals: WithdrawalEntry[];
}

interface QHustleSettings {
  payoutAmount: number;
  minWithdrawal: number;
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 sm:p-6 rounded-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${color} text-white rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-black text-zinc-900">{title}</h2>
      {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

interface AgentFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  interestedPackage: string;
}

const DEFAULT_SETTINGS: QHustleSettings = {
  payoutAmount: 150,
  minWithdrawal: 3000,
};

function getHustleData(userId: string): QHustleData {
  try {
    const raw = localStorage.getItem(QHUSTLE_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, QHustleData>;
      return all[userId] || { userId, referrals: [], withdrawals: [] };
    }
  } catch {}
  return { userId, referrals: [], withdrawals: [] };
}

function saveHustleData(userId: string, data: QHustleData) {
  try {
    const raw = localStorage.getItem(QHUSTLE_STORAGE_KEY);
    const all: Record<string, QHustleData> = raw ? JSON.parse(raw) : {};
    all[userId] = data;
    localStorage.setItem(QHUSTLE_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function getSettings(): QHustleSettings {
  try {
    const raw = localStorage.getItem(QHUSTLE_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function generateMockReferrals(): ReferralEntry[] {
  const names = ["Chioma Okafor", "Emeka Nwosu", "Zainab Abdullah", "Tunde Balogun", "Grace Eze", "Yusuf Bello", "Fatima Usman"];
  const phones = ["07081234567", "08099887766", "09033445566", "08122334455", "07055667788", "08099881122", "09011223344"];
  const now = Date.now();
  return names.map((name, i) => ({
    id: `ref_${i}`,
    referredName: name,
    referredPhone: phones[i],
    status: i < 2 ? "approved" : i < 4 ? "pending" : "rejected",
    date: now - (i + 1) * 86400000 * 3,
    earnings: i < 2 ? 150 : i < 4 ? 0 : 0,
  }));
}

function formatMoney(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function QHustlePage() {
  const user = auth.getCurrentUser();
  const userId = user?._id || "mock_user";
  const createUser = useMutation(api.users.createUser);
  const sendVerificationEmail = useAction(api.actions.sendVerificationEmail);

  const [data, setData] = useState<QHustleData>(() => getHustleData(userId));
  const [settings, setSettings] = useState<QHustleSettings>(getSettings);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [agentSuccess, setAgentSuccess] = useState(false);
  const [agentErrors, setAgentErrors] = useState<Record<string, string>>({});
  const [agentForm, setAgentForm] = useState<AgentFormData>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    interestedPackage: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!data.referrals.length && !data.withdrawals.length) {
    const mock = getHustleData(userId);
    if (!mock.referrals.length) {
      const seeded: QHustleData = {
        userId,
        referrals: generateMockReferrals(),
        withdrawals: [
          { id: "wd_1", amount: 1500, status: "approved", date: Date.now() - 86400000 * 10 },
          { id: "wd_2", amount: 2000, status: "pending", date: Date.now() - 86400000 * 2 },
        ],
      };
      saveHustleData(userId, seeded);
      setData(seeded);
    }
  }

  const partner = useQuery(api.partners.getPartnerByEmail, user?.email ? { email: user.email } : "skip");
  const partnerEarnings = useQuery(api.partners.getPartnerEarnings, partner?._id ? { partnerId: partner._id } : "skip");
  const partnerPayments = useQuery(api.partners.getPartnerPayments, partner?._id ? { partnerId: partner._id } : "skip");
  const partnerClicks = useQuery(api.partners.getPartnerClicks, partner?._id ? { partnerId: partner._id } : "skip");
  const partnerReferrals = useQuery(api.partners.getPartnerReferrals, partner?._id ? { partnerId: partner._id } : "skip");
  const announcements = useQuery(api.partners.getAnnouncements);
  const marketingAssets = useQuery(api.partners.getMarketingAssets);

  const referralCode = user?.referral_code || user?._id?.slice(-6) || "QHUSTLE";
  const referralLink = `${window.location.origin}/register/${referralCode}`;
  const canUseAgentTools = Boolean(user);
  const agentReferralCode = user?.referral_code || user?._id?.slice(-6) || "";

  const stats = useMemo(() => {
    const total = data.referrals.length;
    const approved = data.referrals.filter(r => r.status === "approved").length;
    const pending = data.referrals.filter(r => r.status === "pending").length;
    const totalEarnings = data.referrals
      .filter(r => r.status === "approved")
      .reduce((s, r) => s + r.earnings, 0);
    const approvedWithdrawals = data.withdrawals
      .filter(w => w.status === "approved")
      .reduce((s, w) => s + w.amount, 0);
    const pendingWithdrawals = data.withdrawals
      .filter(w => w.status === "pending")
      .reduce((s, w) => s + w.amount, 0);
    const availableBalance = totalEarnings - approvedWithdrawals - pendingWithdrawals;
    return { total, approved, pending, totalEarnings, availableBalance, minWithdrawal: settings.minWithdrawal };
  }, [data, settings]);

  const hasMinWithdrawal = stats.availableBalance >= settings.minWithdrawal;

  const updateAgentField = useCallback((field: keyof AgentFormData, value: string) => {
    setAgentForm(prev => ({ ...prev, [field]: value }));
    if (agentErrors[field]) {
      setAgentErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [agentErrors]);

  const validateAgentForm = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!agentForm.fullName.trim()) errs.fullName = "Full name is required";
    if (!agentForm.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(agentForm.phone.trim())) errs.phone = "Enter a valid phone number";
    if (agentForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentForm.email.trim())) errs.email = "Enter a valid email";
    if (!agentForm.password) errs.password = "Password is required";
    else if (agentForm.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (agentForm.password !== agentForm.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!agentForm.interestedPackage) errs.interestedPackage = "Select a package";
    setAgentErrors(errs);
    return Object.keys(errs).length === 0;
  }, [agentForm]);

  const handleAgentRegistration = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseAgentTools) {
      toast.error("Please log in to register users for Q Hustle.");
      return;
    }
    if (!validateAgentForm()) return;

    setAgentSubmitting(true);
    try {
      const email = agentForm.email.trim().toLowerCase();
      const phone = agentForm.phone.trim();
      const token = email ? Math.random().toString(36).substring(2) + Date.now().toString(36) : undefined;
      const expires = email ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined;
      const usernameBase = agentForm.fullName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 16) || `user${phone.slice(-4)}`;
      const username = `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;

      await createUser({
        email: email || undefined,
        phone,
        full_name: agentForm.fullName.trim(),
        username,
        password_hash: agentForm.password,
        verification_token: token,
        verification_token_expires: expires,
        referred_by_code: agentReferralCode || undefined,
        interested_package: agentForm.interestedPackage,
        registration_source: "agent_registration",
      });

      if (email && token) {
        try {
          await sendVerificationEmail({
            email,
            name: agentForm.fullName.trim(),
            token,
            baseUrl: window.location.origin,
          });
        } catch (emailError) {
          console.warn("Verification email could not be sent", emailError);
        }
      }

      const updated: QHustleData = {
        ...data,
        referrals: [
          {
            id: `agent_${Date.now()}`,
            referredName: agentForm.fullName.trim(),
            referredPhone: phone,
            referredEmail: email || undefined,
            status: "pending",
            date: Date.now(),
            earnings: 0,
            source: "agent_registration",
          },
          ...data.referrals,
        ],
      };

      saveHustleData(userId, updated);
      setData(updated);
      setAgentForm({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        interestedPackage: "",
      });
      setAgentSuccess(true);
      toast.success("User registered for Q Hustle!");
      setTimeout(() => setAgentSuccess(false), 3000);
    } catch (error: any) {
      toast.error(error?.message || "Could not register user");
    } finally {
      setAgentSubmitting(false);
    }
  }, [agentForm, agentReferralCode, canUseAgentTools, createUser, data, sendVerificationEmail, userId, validateAgentForm]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  }, [referralLink]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "Join Q Hustle",
      text: `Join Q and start earning! Sign up using my referral link: ${referralLink}`,
      url: referralLink,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${referralLink}`);
      toast.success("Share text copied to clipboard!");
    }
  }, [referralLink]);

  const handleWithdraw = useCallback(() => {
    if (!hasMinWithdrawal) {
      toast.error(`Minimum withdrawal is ${formatMoney(settings.minWithdrawal)}`);
      return;
    }
    const amount = stats.availableBalance;
    const wd: WithdrawalEntry = {
      id: `wd_${Date.now()}`,
      amount,
      status: "pending",
      date: Date.now(),
    };
    const updated: QHustleData = {
      ...data,
      withdrawals: [wd, ...data.withdrawals],
    };
    saveHustleData(userId, updated);
    setData(updated);
    toast.success(`Withdrawal of ${formatMoney(amount)} requested!`);
  }, [data, hasMinWithdrawal, stats, settings, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Q Hustle</h1>
              <p className="text-xs sm:text-sm text-gray-400 font-bold">Referral and user acquisition program for members who bring new users into Q.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Referrals", value: stats.total, icon: <Users size={16} />, color: "bg-zinc-900" },
            { label: "Approved Referrals", value: stats.approved, icon: <CheckCircle2 size={16} />, color: "bg-emerald-500" },
            { label: "Pending Referrals", value: stats.pending, icon: <Clock size={16} />, color: "bg-amber-500" },
            { label: "Total Earnings", value: formatMoney(stats.totalEarnings), icon: <Wallet size={16} />, color: "bg-blue-600" },
            { label: "Available Balance", value: formatMoney(stats.availableBalance), icon: <Banknote size={16} />, color: "bg-purple-600" },
            { label: "Minimum Withdrawal", value: formatMoney(settings.minWithdrawal), icon: <AlertCircle size={16} />, color: "bg-zinc-900" },
          ].map(s => (
            <motion.div key={s.label} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
              <StatCard label={s.label} value={s.value} icon={s.icon} color={s.color} />
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
          <SectionHeader title="Your Referral Link" sub="Copy your link or share the registration form from any device." />
          <div className="flex items-center gap-2 bg-zinc-50 rounded-2xl p-3 border border-black/5">
            <code className="flex-1 text-xs sm:text-sm font-bold text-zinc-700 truncate">{referralLink}</code>
            <button
              onClick={handleCopyLink}
              className="shrink-0 h-9 px-4 rounded-xl bg-zinc-900 text-white text-[10px] font-black hover:bg-zinc-800 transition-all flex items-center gap-1.5"
            >
              {copied ? <CopyCheck size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleShare}
            className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <Share2 size={16} /> Share Registration Form
          </button>
          {canUseAgentTools && (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-zinc-900">Agent Registration</p>
                  <p className="text-[10px] font-bold text-zinc-500">Register users directly and attach them to your Q Hustle link.</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black text-zinc-600 border border-black/5">
                  <User size={12} /> Ready
                </span>
              </div>
              <form onSubmit={handleAgentRegistration} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Full Name *</label>
                    <input value={agentForm.fullName} onChange={e => updateAgentField("fullName", e.target.value)} placeholder="Full name"
                      className={`w-full h-11 rounded-2xl border ${agentErrors.fullName ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 text-sm font-bold outline-none focus:border-zinc-900`} />
                    {agentErrors.fullName && <p className="text-[10px] font-bold text-red-500">{agentErrors.fullName}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone *</label>
                    <input value={agentForm.phone} onChange={e => updateAgentField("phone", e.target.value)} placeholder="08012345678"
                      className={`w-full h-11 rounded-2xl border ${agentErrors.phone ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 text-sm font-bold outline-none focus:border-zinc-900`} />
                    {agentErrors.phone && <p className="text-[10px] font-bold text-red-500">{agentErrors.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email <span className="text-zinc-300">(optional)</span></label>
                    <input value={agentForm.email} onChange={e => updateAgentField("email", e.target.value)} placeholder="Email address"
                      className={`w-full h-11 rounded-2xl border ${agentErrors.email ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 text-sm font-bold outline-none focus:border-zinc-900`} />
                    {agentErrors.email && <p className="text-[10px] font-bold text-red-500">{agentErrors.email}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Package *</label>
                    <select value={agentForm.interestedPackage} onChange={e => updateAgentField("interestedPackage", e.target.value)}
                      className={`w-full h-11 rounded-2xl border ${agentErrors.interestedPackage ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 text-sm font-bold outline-none focus:border-zinc-900`}>
                      <option value="">Select package</option>
                      {["Netflix", "Spotify", "ChatGPT", "Canva", "CapCut", "Others"].map(pkg => (
                        <option key={pkg} value={pkg}>{pkg}</option>
                      ))}
                    </select>
                    {agentErrors.interestedPackage && <p className="text-[10px] font-bold text-red-500">{agentErrors.interestedPackage}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Password *</label>
                    <div className="relative">
                      <input type="password" value={agentForm.password} onChange={e => updateAgentField("password", e.target.value)} placeholder="Create password"
                        className={`w-full h-11 rounded-2xl border ${agentErrors.password ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 pr-10 text-sm font-bold outline-none focus:border-zinc-900`} />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                    </div>
                    {agentErrors.password && <p className="text-[10px] font-bold text-red-500">{agentErrors.password}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Confirm Password *</label>
                    <div className="relative">
                      <input type="password" value={agentForm.confirmPassword} onChange={e => updateAgentField("confirmPassword", e.target.value)} placeholder="Confirm password"
                        className={`w-full h-11 rounded-2xl border ${agentErrors.confirmPassword ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 pr-10 text-sm font-bold outline-none focus:border-zinc-900`} />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                    </div>
                    {agentErrors.confirmPassword && <p className="text-[10px] font-bold text-red-500">{agentErrors.confirmPassword}</p>}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={agentSubmitting}
                  className="w-full h-11 rounded-2xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {agentSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {agentSubmitting ? "Registering..." : "Register User"}
                </button>
                {agentSuccess && (
                  <p className="text-[10px] font-black text-emerald-600 text-center">User added and linked to your Q Hustle network.</p>
                )}
              </form>
            </div>
          )}
          <p className="text-xs font-bold text-zinc-500">
            You earn <span className="text-emerald-600">{formatMoney(settings.payoutAmount)}</span> for each person who signs up and verifies through your link
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
          <SectionHeader title="Withdraw Earnings" sub="Withdrawals stay locked until your balance reaches ₦3,000." />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 rounded-2xl p-4 text-center border border-black/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Balance</div>
              <div className="text-2xl font-black text-zinc-900">{formatMoney(stats.availableBalance)}</div>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 text-center border border-black/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Minimum</div>
              <div className="text-2xl font-black text-zinc-900">{formatMoney(settings.minWithdrawal)}</div>
            </div>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!hasMinWithdrawal}
            className={`w-full h-12 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              hasMinWithdrawal
                ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Banknote size={18} />
            {hasMinWithdrawal ? `Withdraw ${formatMoney(stats.availableBalance)}` : `${formatMoney(settings.minWithdrawal - stats.availableBalance)} more to withdraw`}
          </button>
          {!hasMinWithdrawal && (
            <p className="text-[10px] font-bold text-gray-400 text-center">
              Refer more friends to unlock withdrawals
            </p>
          )}

          {data.withdrawals.length > 0 && (
            <div className="pt-4 border-t border-black/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Withdrawal History</h3>
              <div className="space-y-2">
                {data.withdrawals.slice(0, 5).map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-sm font-black text-zinc-900">{formatMoney(w.amount)}</div>
                      <div className="text-[10px] font-bold text-gray-400">{new Date(w.date).toLocaleDateString()}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black ${
                      w.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                      w.status === "pending" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {w.status === "approved" ? <CheckCircle2 size={12} /> :
                       w.status === "pending" ? <Clock size={12} /> :
                       <XCircle size={12} />}
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
          <SectionHeader title={`Your Referrals (${data.referrals.length})`} sub="Approved, pending, and rejected signups are shown here with their payout status." />
          {data.referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-400">No referrals yet</p>
              <p className="text-xs text-gray-400 mt-1">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5">
                    {["Name", "Phone", "Status", "Earnings", "Date"].map(h => (
                      <th key={h} className="p-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.slice(0, 20).map(r => (
                    <tr key={r.id} className="border-b border-black/5 last:border-0 hover:bg-zinc-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-black shrink-0">
                            {r.referredName[0]}
                          </div>
                          <span className="text-sm font-bold text-zinc-900">{r.referredName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-bold text-zinc-700">{r.referredPhone}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black ${
                          r.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          r.status === "pending" ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-600"
                        }`}>
                          {r.status === "approved" ? <CheckCircle2 size={12} /> :
                           r.status === "pending" ? <Clock size={12} /> :
                           <XCircle size={12} />}
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-black text-zinc-900">{r.earnings > 0 ? formatMoney(r.earnings) : "—"}</td>
                      <td className="p-3 text-xs font-bold text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {partner && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Link Clicks", value: partnerClicks?.length || 0, icon: <MousePointerClick size={16} />, color: "bg-blue-600" },
                { label: "Partner Refers", value: partnerReferrals?.length || 0, icon: <Users size={16} />, color: "bg-emerald-500" },
                { label: "Commission", value: `${partner.commission}%`, icon: <TrendingUp size={16} />, color: "bg-purple-600" },
                { label: "Earnings", value: `$${((partnerEarnings || []).reduce((s: number, e: any) => s + (e.amount || 0), 0)).toFixed(2)}`, icon: <DollarSign size={16} />, color: "bg-zinc-900" },
                { label: "Paid Out", value: `$${((partnerPayments || []).filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + (p.amount || 0), 0)).toFixed(2)}`, icon: <Wallet size={16} />, color: "bg-emerald-600" },
                { label: "Pending", value: `$${((partnerEarnings || []).filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + (e.amount || 0), 0)).toFixed(2)}`, icon: <Clock size={16} />, color: "bg-amber-500" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
                  <div className={`w-8 h-8 ${s.color} text-white rounded-xl flex items-center justify-center mb-2`}>{s.icon}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</div>
                  <div className="text-lg font-black text-zinc-900">{s.value}</div>
                </div>
              ))}
            </div>

            {partner.campaigns && partner.campaigns.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
                <SectionHeader title="Campaign Links" sub="Your exclusive referral links for each campaign" />
                <div className="space-y-3">
                  {partner.campaigns.map((campaign: any) => {
                    const campaignLink = `jointheq.sbs/${campaign.slug || campaign.name?.toLowerCase().replace(/\s+/g, "")}?ref=${partner.referralCode}`;
                    return (
                      <div key={campaign._id || campaign.slug} className="flex items-center justify-between bg-zinc-50 rounded-2xl px-4 py-3 border border-black/5">
                        <div>
                          <p className="text-xs font-bold text-gray-400">{campaign.name}</p>
                          <p className="font-mono text-xs font-bold text-zinc-700">{campaignLink}</p>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(campaignLink); toast.success("Copied!"); }} className="shrink-0 h-8 px-3 rounded-xl bg-zinc-900 text-white text-[10px] font-black hover:bg-zinc-800 transition-all flex items-center gap-1.5"><Copy size={12} /> Copy</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
                <SectionHeader title="Partner Earnings" sub="Commission from qualified referrals" />
                <div className="space-y-2">
                  {(!partnerEarnings || partnerEarnings.length === 0) && <p className="py-6 text-center text-sm font-bold text-gray-400">No partner earnings yet</p>}
                  {partnerEarnings?.slice(0, 10).reverse().map((e: any) => (
                    <div key={e._id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5 border border-black/5">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{e.description || "Referral commission"}</p>
                        <p className="text-[10px] font-bold text-gray-400">{new Date(e._creationTime).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">+${(e.amount || 0).toFixed(2)}</p>
                        <p className={`text-[10px] font-black ${e.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{e.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
                <SectionHeader title="Payment History" sub="Payouts from the partner program" />
                <div className="space-y-2">
                  {(!partnerPayments || partnerPayments.length === 0) && <p className="py-6 text-center text-sm font-bold text-gray-400">No payments yet</p>}
                  {partnerPayments?.slice(0, 10).reverse().map((p: any) => (
                    <div key={p._id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5 border border-black/5">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{p.method || "Manual"}</p>
                        <p className="text-[10px] font-bold text-gray-400">{new Date(p._creationTime).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-zinc-900">${(p.amount || 0).toFixed(2)}</p>
                        <p className={`text-[10px] font-black ${p.status === "completed" ? "text-emerald-600" : "text-amber-600"}`}>{p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {announcements && announcements.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
                <SectionHeader title="Partner Announcements" sub="Latest updates for partners" />
                <div className="space-y-3">
                  {announcements.slice(0, 5).reverse().map((a: any) => (
                    <div key={a._id} className="rounded-2xl bg-zinc-50 px-4 py-3 border border-black/5">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-zinc-900">{a.title}</h3>
                        {a.priority === "high" && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-600">HIGH</span>}
                      </div>
                      {a.body && <p className="text-xs font-bold text-zinc-500">{a.body}</p>}
                      <p className="mt-1.5 text-[10px] font-bold text-gray-400">{new Date(a._creationTime).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {marketingAssets && marketingAssets.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
                <SectionHeader title="Marketing Assets" sub="Download banners and creatives for your campaigns" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {marketingAssets.map((asset: any) => (
                    <a key={asset._id} href={asset.url} target="_blank" rel="noopener noreferrer" className="group relative aspect-video overflow-hidden rounded-2xl bg-zinc-50 border border-black/5">
                      {asset.type === "image" ? (
                        <img src={asset.url} alt={asset.label || "Asset"} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300"><ExternalLink size={24} /></div>
                      )}
                      <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100">
                        <span className="text-[10px] font-black text-white">{asset.label || "Asset"}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
          <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
            <Settings size={18} className="text-amber-500" /> How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Share Your Link", desc: "Send your unique referral link to friends and family", icon: <Share2 size={24} /> },
              { step: "2", title: "They Sign Up", desc: "New users register through your link and verify their account", icon: <UserPlus size={24} /> },
              { step: "3", title: "Earn Rewards", desc: `Get ${formatMoney(settings.payoutAmount)} for every verified referral. Withdraw anytime!`, icon: <Banknote size={24} /> },
            ].map(s => (
              <div key={s.step} className="text-center p-4 bg-zinc-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-3">
                  {s.icon}
                </div>
                <div className="text-xs font-black text-zinc-900 mb-1">{s.title}</div>
                <div className="text-[10px] font-bold text-zinc-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
