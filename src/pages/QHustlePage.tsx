import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { auth } from "../lib/auth";
import { Link } from "react-router-dom";
import {
    Users, Gift, Wallet, Copy, Share2, CheckCircle2,
    Clock, XCircle, Loader2, ChevronLeft, TrendingUp, UserPlus,
    Banknote, AlertCircle, Award, ExternalLink, CopyCheck,
    Percent, Settings
} from "lucide-react";
import toast from "react-hot-toast";

const QHUSTLE_STORAGE_KEY = "q_hustle_data";
const QHUSTLE_SETTINGS_KEY = "q_hustle_settings";

interface ReferralEntry {
    id: string;
    referredName: string;
    referredPhone: string;
    status: "pending" | "approved" | "rejected";
    date: number;
    earnings: number;
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

export default function QHustlePage() {
    const user = auth.getCurrentUser();
    const userId = user?._id || "mock_user";

    const [data, setData] = useState<QHustleData>(() => getHustleData(userId));
    const [settings, setSettings] = useState<QHustleSettings>(getSettings);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const referralCode = user?.referral_code || user?._id?.slice(-6) || "QHUSTLE";
    const referralLink = `${window.location.origin}/register/${referralCode}`;

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
            toast.error(`Minimum withdrawal is ₦${settings.minWithdrawal.toLocaleString()}`);
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
        toast.success(`Withdrawal of ₦${amount.toLocaleString()} requested!`);
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
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-zinc-900 transition-colors">
                    <ChevronLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex items-center gap-3">
                    <TrendingUp size={24} className="text-zinc-900" />
                    <h1 className="text-xl font-black text-zinc-900">Q Hustle</h1>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: "Total Referrals", value: stats.total, icon: <Users size={16} />, color: "bg-zinc-900 text-white" },
                        { label: "Approved", value: stats.approved, icon: <CheckCircle2 size={16} />, color: "bg-emerald-500 text-white" },
                        { label: "Pending", value: stats.pending, icon: <Clock size={16} />, color: "bg-amber-500 text-white" },
                        { label: "Total Earnings", value: `₦${stats.totalEarnings.toLocaleString()}`, icon: <Wallet size={16} />, color: "bg-zinc-900 text-white" },
                        { label: "Available", value: `₦${stats.availableBalance.toLocaleString()}`, icon: <Banknote size={16} />, color: "bg-blue-600 text-white" },
                        { label: "Min. Withdrawal", value: `₦${settings.minWithdrawal.toLocaleString()}`, icon: <AlertCircle size={16} />, color: "bg-purple-600 text-white" },
                    ].map(s => (
                        <motion.div key={s.label} whileHover={{ scale: 1.02 }} className={`rounded-2xl p-4 ${s.color}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {s.icon}
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</div>
                            </div>
                            <div className="text-2xl font-black">{s.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Referral Link & Share */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
                    <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                        <Award size={18} className="text-amber-500" /> Your Referral Link
                    </h2>
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
                    <p className="text-xs font-bold text-zinc-500">
                        You earn <span className="text-emerald-600">₦{settings.payoutAmount}</span> for each person who signs up and verifies through your link
                    </p>
                    <button
                        onClick={handleShare}
                        className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 size={16} /> Share Registration Form
                    </button>
                </div>

                {/* Withdrawal Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
                    <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                        <Wallet size={18} className="text-blue-500" /> Withdraw Earnings
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-2xl p-4 text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Available Balance</div>
                            <div className="text-2xl font-black text-blue-700">₦{stats.availableBalance.toLocaleString()}</div>
                        </div>
                        <div className="bg-purple-50 rounded-2xl p-4 text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1">Minimum</div>
                            <div className="text-2xl font-black text-purple-700">₦{settings.minWithdrawal.toLocaleString()}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleWithdraw}
                        disabled={!hasMinWithdrawal}
                        className={`w-full h-12 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                            hasMinWithdrawal
                                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <Banknote size={18} />
                        {hasMinWithdrawal ? `Withdraw ₦${stats.availableBalance.toLocaleString()}` : `₦${(settings.minWithdrawal - stats.availableBalance).toLocaleString()} more to withdraw`}
                    </button>
                    {!hasMinWithdrawal && (
                        <p className="text-[10px] font-bold text-gray-400 text-center">
                            Refer more friends to unlock withdrawals
                        </p>
                    )}

                    {/* Withdrawal History */}
                    {data.withdrawals.length > 0 && (
                        <div className="pt-4 border-t border-black/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Withdrawal History</h3>
                            <div className="space-y-2">
                                {data.withdrawals.slice(0, 5).map(w => (
                                    <div key={w.id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3">
                                        <div>
                                            <div className="text-sm font-black text-zinc-900">₦{w.amount.toLocaleString()}</div>
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

                {/* Referrals List */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
                    <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                        <UserPlus size={18} className="text-zinc-900" /> Your Referrals ({data.referrals.length})
                    </h2>
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
                                            <td className="p-3 text-sm font-black text-zinc-900">{r.earnings > 0 ? `₦${r.earnings}` : "—"}</td>
                                            <td className="p-3 text-xs font-bold text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* How It Works */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-4">
                    <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                        <Award size={18} className="text-amber-500" /> How It Works
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { step: "1", title: "Share Your Link", desc: "Send your unique referral link to friends and family", icon: <Share2 size={24} /> },
                            { step: "2", title: "They Sign Up", desc: "New users register through your link and verify their account", icon: <UserPlus size={24} /> },
                            { step: "3", title: "Earn Rewards", desc: `Get ₦${settings.payoutAmount} for every verified referral. Withdraw anytime!`, icon: <Banknote size={24} /> },
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
