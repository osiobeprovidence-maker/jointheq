import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Users, Wallet, Copy, Share2, CheckCircle2,
  Clock, XCircle, Loader2, TrendingUp, UserPlus,
  Banknote, AlertCircle, Award, CopyCheck, User
} from "lucide-react";
import toast from "react-hot-toast";
import type { User } from "../../types";

const BASE_URL = "https://jointheq.sbs";

interface AgentFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  interestedPackage: string;
}

interface QHustleTabProps {
  user: User;
}

export default function QHustleTab({ user }: QHustleTabProps) {
  const userId = user._id as Id<"users">;

  const dashboard = useQuery(api.qHustle.getUserDashboard, userId ? { userId } : "skip");
  const refsQuery = useQuery(api.qHustle.getUserReferralsPaginated, userId ? { userId, page: 1, limit: 50 } : "skip");

  const requestWithdrawal = useMutation(api.qHustle.requestWithdrawal);

  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentFormData>({
    fullName: "", phone: "", email: "", password: "", confirmPassword: "", interestedPackage: "",
  });
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [agentSuccess, setAgentSuccess] = useState(false);
  const [agentErrors, setAgentErrors] = useState<Record<string, string>>({});

  const createUser = useMutation(api.users.createUser);

  const stats = dashboard?.stats;
  const settings = dashboard?.settings;
  const referrals = refsQuery?.referrals || [];
  const withdrawals = dashboard?.withdrawals || [];
  const isLoading = dashboard === undefined;
  const referralCode = dashboard?.user?.referral_code;
  const referralLink = referralCode ? `${BASE_URL}/register/${referralCode}` : "";
  const hasMinWithdrawal = stats && settings
    ? stats.availableBalance >= settings.minWithdrawalAmount
    : false;

  const handleCopyLink = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy link"));
  }, [referralLink]);

  const handleShare = useCallback(async () => {
    if (!referralLink) return;
    const shareData = {
      title: "Join Q Hustle",
      text: `Join Q and start earning! Sign up using my referral link: ${referralLink}`,
      url: referralLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${referralLink}`);
      toast.success("Share text copied to clipboard!");
    }
  }, [referralLink]);

  const handleWithdraw = useCallback(async () => {
    if (!userId || !stats || !settings) return;
    if (!hasMinWithdrawal) {
      toast.error(`Minimum withdrawal is ₦${settings.minWithdrawalAmount.toLocaleString()}`);
      return;
    }
    setWithdrawing(true);
    try {
      const result = await requestWithdrawal({ userId, amount: stats.availableBalance });
      toast.success(`Withdrawal of ₦${stats.availableBalance.toLocaleString()} requested!`);
    } catch (error: any) {
      toast.error(error?.message || "Could not request withdrawal");
    } finally {
      setWithdrawing(false);
    }
  }, [userId, stats, settings, hasMinWithdrawal, requestWithdrawal]);

  const updateAgentField = useCallback((field: keyof AgentFormData, value: string) => {
    setAgentForm(prev => ({ ...prev, [field]: value }));
    if (agentErrors[field]) setAgentErrors(prev => ({ ...prev, [field]: "" }));
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
    if (!validateAgentForm()) return;
    setAgentSubmitting(true);
    try {
      const phone = agentForm.phone.trim();
      const usernameBase = agentForm.fullName.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || `user${phone.slice(-4)}`;
      const username = `${usernameBase}${Math.floor(100 + Math.random() * 900)}`;
      await createUser({
        email: agentForm.email.trim().toLowerCase() || undefined,
        phone,
        full_name: agentForm.fullName.trim(),
        username,
        password_hash: agentForm.password,
        referred_by_code: referralCode || undefined,
        interested_package: agentForm.interestedPackage,
        registration_source: "agent_registration",
      });
      setAgentForm({ fullName: "", phone: "", email: "", password: "", confirmPassword: "", interestedPackage: "" });
      setAgentSuccess(true);
      toast.success("User registered for Q Hustle!");
      setTimeout(() => setAgentSuccess(false), 3000);
    } catch (error: any) {
      toast.error(error?.message || "Could not register user");
    } finally {
      setAgentSubmitting(false);
    }
  }, [agentForm, referralCode, createUser, validateAgentForm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!dashboard || !stats || !settings) {
    return (
      <div className="bg-white border border-dashed border-black/20 rounded-3xl p-12 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-bold mb-2">Could not load Q Hustle data</h3>
        <p className="text-sm text-gray-400">Please try again later.</p>
      </div>
    );
  }

  return (
    <motion.div key="qhustle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Q Hustle</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Referral and user acquisition program for members who bring new users into Q.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Referrals", value: stats.totalReferrals.toString(), icon: <Users size={16} />, color: "bg-zinc-900" },
          { label: "Approved Referrals", value: stats.approvedReferrals.toString(), icon: <CheckCircle2 size={16} />, color: "bg-emerald-500" },
          { label: "Pending Referrals", value: stats.pendingReferrals.toString(), icon: <Clock size={16} />, color: "bg-amber-500" },
          { label: "Rejected Referrals", value: stats.rejectedReferrals.toString(), icon: <XCircle size={16} />, color: "bg-red-500" },
          { label: "Total Earnings", value: `₦${stats.totalEarnings.toLocaleString()}`, icon: <Wallet size={16} />, color: "bg-blue-600" },
          { label: "Available Balance", value: `₦${stats.availableBalance.toLocaleString()}`, icon: <Banknote size={16} />, color: "bg-purple-600" },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
            <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 sm:p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${s.color} text-white rounded-full flex items-center justify-center`}>
                  {s.icon}
                </div>
              </div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">{s.label}</div>
              <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-black text-zinc-900">Your Referral Link</h2>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Copy your link or share the registration form from any device.</p>
        </div>
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
        {user && (
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
                  <input type="password" value={agentForm.password} onChange={e => updateAgentField("password", e.target.value)} placeholder="Create password"
                    className={`w-full h-11 rounded-2xl border ${agentErrors.password ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 text-sm font-bold outline-none focus:border-zinc-900`} />
                  {agentErrors.password && <p className="text-[10px] font-bold text-red-500">{agentErrors.password}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Confirm Password *</label>
                  <input type="password" value={agentForm.confirmPassword} onChange={e => updateAgentField("confirmPassword", e.target.value)} placeholder="Confirm password"
                    className={`w-full h-11 rounded-2xl border ${agentErrors.confirmPassword ? "border-red-300 bg-red-50" : "border-black/5 bg-white"} px-4 text-sm font-bold outline-none focus:border-zinc-900`} />
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
          You earn <span className="text-emerald-600">₦{settings.payoutAmount.toLocaleString()}</span> for each person who signs up and verifies through your link
        </p>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-black/5 space-y-4">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-black text-zinc-900">Withdraw Earnings</h2>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Withdrawals stay locked until your balance reaches ₦{settings.minWithdrawalAmount.toLocaleString()}.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 rounded-2xl p-4 text-center border border-black/5">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Balance</div>
            <div className="text-2xl font-black text-zinc-900">₦{stats.availableBalance.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-4 text-center border border-black/5">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Minimum</div>
            <div className="text-2xl font-black text-zinc-900">₦{settings.minWithdrawalAmount.toLocaleString()}</div>
          </div>
        </div>
        {stats.availableBalance < settings.minWithdrawalAmount && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700">Progress to withdrawal</span>
              <span className="text-xs font-black text-amber-800">
                ₦{stats.availableBalance.toLocaleString()} / ₦{settings.minWithdrawalAmount.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (stats.availableBalance / settings.minWithdrawalAmount) * 100)}%` }}
              />
            </div>
          </div>
        )}
        <button
          onClick={handleWithdraw}
          disabled={!hasMinWithdrawal || withdrawing}
          className={`w-full h-12 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            hasMinWithdrawal
              ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Banknote size={18} />
          {withdrawing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : hasMinWithdrawal ? (
            `Withdraw ₦${stats.availableBalance.toLocaleString()}`
          ) : (
            `₦${(settings.minWithdrawalAmount - stats.availableBalance).toLocaleString()} more to withdraw`
          )}
        </button>
        {!hasMinWithdrawal && (
          <p className="text-[10px] font-bold text-gray-400 text-center">
            Refer more friends to unlock withdrawals
          </p>
        )}

        {withdrawals.length > 0 && (
          <div className="pt-4 border-t border-black/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Withdrawal History</h3>
            <div className="space-y-2">
              {withdrawals.slice(0, 5).map((w: any) => (
                <div key={w._id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-black text-zinc-900">₦{(w.amount || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-gray-400">{new Date(w.requested_at).toLocaleDateString()}</div>
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
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-black text-zinc-900">Your Referrals ({stats.totalReferrals})</h2>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Approved, pending, and rejected signups are shown here with their payout status.</p>
        </div>
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-400">No referrals yet</p>
            <p className="text-xs text-gray-400 mt-1">Start sharing your referral link to begin earning.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  {["Name", "Phone", "Status", "Earnings", "Date"].map(h => (
                    <th key={h} className="p-3 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r: any) => (
                  <tr key={r._id} className="border-b border-black/5 last:border-0 hover:bg-zinc-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-black shrink-0">
                          {(r.referred_name || "?")[0]}
                        </div>
                        <span className="text-sm font-bold text-zinc-900">{r.referred_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm font-bold text-zinc-700">{r.referred_phone}</td>
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
                    <td className="p-3 text-sm font-black text-zinc-900">{r.earnings > 0 ? `₦${r.earnings.toLocaleString()}` : "—"}</td>
                    <td className="p-3 text-xs font-bold text-gray-400 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
        <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
          <Award size={18} className="text-amber-500" /> How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Share Your Link", desc: "Send your unique referral link to friends and family", icon: <Share2 size={24} /> },
            { step: "2", title: "They Sign Up", desc: "New users register through your link and verify their account", icon: <UserPlus size={24} /> },
            { step: "3", title: "Earn Rewards", desc: `Get ₦${settings.payoutAmount.toLocaleString()} for every verified referral. Withdraw anytime!`, icon: <Banknote size={24} /> },
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
    </motion.div>
  );
}
