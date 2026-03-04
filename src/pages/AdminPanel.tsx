import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    CreditCard,
    Megaphone,
    HeadphonesIcon,
    ShieldCheck,
    BarChart3,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Zap,
    Globe,
    AlertCircle,
    CheckCircle2,
    Clock,
    User as UserIcon,
    Ban,
    PauseCircle,
    PlayCircle,
    Plus,
    ChevronRight,
    Wallet,
    Star,
    Activity,
    RefreshCw,
    GraduationCap,
    Ticket,
    MoreVertical,
    X,
    Filter,
    Search,
    DollarSign,
    Shield,
    Settings,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminTab = "dashboard" | "users" | "marketplace" | "payments" | "campaigns" | "support" | "admins" | "campus";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
    return `₦${n.toLocaleString()}`;
}

function StatCard({ label, value, sub, icon, color, trend }: {
    label: string; value: string | number; sub?: string; icon: React.ReactNode;
    color: string; trend?: "up" | "down" | "neutral";
}) {
    return (
        <div className={`bg-white rounded-3xl p-6 border border-black/5 hover:shadow-lg transition-all group overflow-hidden relative`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -mr-8 -mt-8 ${color}`} />
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${color} bg-opacity-10`}>
                <div className={`${color.replace('bg-', 'text-')}`}>{icon}</div>
            </div>
            <div className="text-2xl font-black mb-1">{value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
            {sub && (
                <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                    {trend === 'up' && <TrendingUp size={10} />}
                    {trend === 'down' && <TrendingDown size={10} />}
                    {sub}
                </div>
            )}
        </div>
    );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-xl font-black">{title}</h2>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
            {action}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
    const navigate = useNavigate();
    const user = auth.getCurrentUser();
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
    const [searchQuery, setSearchQuery] = useState("");
    const [campusModalOpen, setCampusModalOpen] = useState(false);
    const [campusUserId, setCampusUserId] = useState("");
    const [campusName, setCampusName] = useState("");

    // Listing state
    const [showListingModal, setShowListingModal] = useState(false);
    const [listingData, setListingData] = useState({
        subscription_id: "",
        account_email: "",
        plan_owner: "",
        admin_renewal_date: "",
        slots: [{ name: "", price: 0, capacity: 1, access_type: "code_access", downloads_enabled: true }]
    });

    // Queries
    const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as Id<"users"> } : "skip");
    const stats = useQuery(api.admin.getPlatformStats);
    const subBreakdown = useQuery(api.admin.getSubscriptionBreakdown) || [];
    const allUsers = useQuery(api.admin.getAllUsers) || [];
    const allTickets = useQuery(api.admin.getAllTickets) || [];
    const campusReps = useQuery(api.admin.getCampusReps) || [];
    const recentTxns = useQuery(api.admin.getRecentTransactions) || [];
    const campaigns = useQuery(api.campaigns.list) || [];
    const adminsList = useQuery(api.users.getAdmins) || [];
    const allSubscriptions = useQuery(api.subscriptions.getMarketplace) || [];

    // Mutations
    const suspendUserMut = useMutation(api.admin.suspendUser);
    const unsuspendUserMut = useMutation(api.admin.unsuspendUser);
    const banUserMut = useMutation(api.admin.banUser);
    const setAdminRoleMut = useMutation(api.admin.setAdminRole);
    const updateTicketMut = useMutation(api.admin.updateTicketStatus);
    const addCampusRepMut = useMutation(api.admin.addCampusRep);
    const adminCreateListingMutation = useMutation(api.subscriptions.adminCreateListing);

    const handleCreateListing = async () => {
        try {
            await adminCreateListingMutation({
                subscription_id: listingData.subscription_id as Id<"subscriptions">,
                account_email: listingData.account_email,
                plan_owner: listingData.plan_owner,
                admin_renewal_date: listingData.admin_renewal_date,
                slot_types: listingData.slots
            });
            toast.success("Listing published to marketplace!", { icon: '🚀' });
            setShowListingModal(false);
            setListingData({
                subscription_id: "", account_email: "", plan_owner: "",
                admin_renewal_date: "",
                slots: [{ name: "", price: 0, capacity: 1, access_type: "code_access", downloads_enabled: true }]
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to create listing");
        }
    };

    if (!currentUser?.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
                <div className="text-center p-12">
                    <ShieldCheck size={48} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-gray-400">Administrator privileges required.</p>
                    <button onClick={() => navigate("/dashboard")} className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-full font-bold">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { id: "users", label: "Users", icon: <Users size={18} /> },
        { id: "marketplace", label: "Marketplace", icon: <ShoppingBag size={18} /> },
        { id: "payments", label: "Payments", icon: <CreditCard size={18} /> },
        { id: "campaigns", label: "Campaigns", icon: <Megaphone size={18} /> },
        { id: "support", label: "Support", icon: <HeadphonesIcon size={18} /> },
        { id: "admins", label: "Admins", icon: <Shield size={18} /> },
        { id: "campus", label: "Campus Q", icon: <GraduationCap size={18} /> },
    ];

    const filteredUsers = allUsers.filter(u =>
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex font-['Inter',sans-serif]">
            {/* ── Sidebar ── */}
            <aside className="hidden md:flex w-64 flex-col bg-zinc-950 text-white min-h-screen fixed top-0 left-0 z-40">
                {/* Logo */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg">Q</div>
                        <div>
                            <div className="font-black text-sm">JoinTheQ</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Admin Control</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id
                                ? 'bg-white text-zinc-900'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                            {item.id === "support" && allTickets.filter(t => t.status === "open").length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {allTickets.filter(t => t.status === "open").length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Admin Profile + Mode Switch */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {currentUser?.full_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{currentUser?.full_name}</div>
                            <div className="text-[10px] text-white/40 capitalize">{currentUser?.admin_role || "Super Admin"}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all"
                    >
                        <ArrowLeft size={14} /> Switch to User Mode
                    </button>
                </div>
            </aside>

            {/* ── Mobile Top Bar ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950 text-white flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black">Q</div>
                    <span className="font-black text-sm">Admin Control</span>
                </div>
                <button onClick={() => navigate("/dashboard")} className="p-2 bg-white/10 rounded-xl">
                    <ArrowLeft size={18} />
                </button>
            </div>

            {/* ── Main Content ── */}
            <main className="flex-1 md:ml-64 mt-14 md:mt-0 min-h-screen">
                {/* Top bar (desktop) */}
                <div className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-black/5 sticky top-0 z-30">
                    <div>
                        <h1 className="text-xl font-black capitalize">{navItems.find(n => n.id === activeTab)?.label}</h1>
                        <p className="text-xs text-gray-400">JoinTheQ Platform Command Center</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Platform Live
                        </div>
                        <div className="w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold">
                            {currentUser?.full_name?.[0]}
                        </div>
                    </div>
                </div>

                {/* Mobile Nav bubbles */}
                <div className="md:hidden overflow-x-auto flex gap-2 p-3 bg-white border-b border-black/5">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === item.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                    <AnimatePresence mode="wait">

                        {/* ═══ DASHBOARD ═══ */}
                        {activeTab === "dashboard" && (
                            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">

                                {/* Users */}
                                <div>
                                    <SectionHeader title="User Metrics" sub="Real-time platform user data" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                        <StatCard label="Total Users" value={stats?.totalUsers ?? "—"} icon={<Users size={18} />} color="bg-blue-500" sub="All time" />
                                        <StatCard label="New Today" value={stats?.newUsersToday ?? "—"} icon={<TrendingUp size={18} />} color="bg-emerald-500" trend="up" sub="Since midnight" />
                                        <StatCard label="Active Users" value={stats?.activeUsers ?? "—"} icon={<Activity size={18} />} color="bg-indigo-500" />
                                        <StatCard label="Suspended" value={stats?.suspendedUsers ?? 0} icon={<PauseCircle size={18} />} color="bg-amber-500" />
                                        <StatCard label="Banned" value={stats?.bannedUsers ?? 0} icon={<Ban size={18} />} color="bg-red-500" />
                                    </div>
                                </div>

                                {/* Slots */}
                                <div>
                                    <SectionHeader title="Subscription Slots" sub="Marketplace capacity overview" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <StatCard label="Total Slots" value={stats?.totalSlots ?? "—"} icon={<Globe size={18} />} color="bg-violet-500" />
                                        <StatCard label="Slots Filled" value={stats?.filledSlots ?? "—"} icon={<CheckCircle2 size={18} />} color="bg-emerald-500" trend="up" />
                                        <StatCard label="Available" value={stats?.availableSlots ?? "—"} icon={<ShoppingBag size={18} />} color="bg-sky-500" />
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div>
                                    <SectionHeader title="Revenue & Payments" sub="Financial performance" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        <StatCard label="Today" value={stats ? fmt(stats.revenueToday) : "—"} icon={<TrendingUp size={18} />} color="bg-emerald-500" trend="up" sub="vs yesterday" />
                                        <StatCard label="This Month" value={stats ? fmt(stats.revenueThisMonth) : "—"} icon={<BarChart3 size={18} />} color="bg-blue-500" />
                                        <StatCard label="Total Revenue" value={stats ? fmt(stats.totalRevenue) : "—"} icon={<DollarSign size={18} />} color="bg-indigo-600" />
                                        <StatCard label="Refunds" value={stats ? fmt(stats.totalRefunds) : "—"} icon={<RefreshCw size={18} />} color="bg-orange-500" trend="down" />
                                    </div>
                                </div>

                                {/* BOOTS & Campaigns */}
                                <div>
                                    <SectionHeader title="BOOTS & Growth" sub="Token economy and campaigns" />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <StatCard label="BOOTS in Circulation" value={(stats?.totalBoots ?? 0).toLocaleString()} icon={<Zap size={18} />} color="bg-yellow-500" />
                                        <StatCard label="Issued Today" value={(stats?.bootsIssuedToday ?? 0).toLocaleString()} icon={<TrendingUp size={18} />} color="bg-amber-400" trend="up" />
                                        <StatCard label="Active Campaigns" value={stats?.activeCampaigns ?? 0} icon={<Megaphone size={18} />} color="bg-purple-500" />
                                        <StatCard label="Total Participants" value={(stats?.totalCampaignParticipants ?? 0).toLocaleString()} icon={<Users size={18} />} color="bg-pink-500" />
                                    </div>
                                </div>

                                {/* Platform Breakdown */}
                                <div>
                                    <SectionHeader title="Platform Performance" sub="Subscription service breakdown" />
                                    <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                        <div className="grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b border-black/5">
                                            <div className="col-span-2">Service</div>
                                            <div className="text-center">Groups</div>
                                            <div className="text-center">Fill Rate</div>
                                            <div className="text-right">Est. Revenue</div>
                                        </div>
                                        {subBreakdown.map((sub: any) => (
                                            <div key={sub._id} className="grid grid-cols-5 items-center p-4 border-b border-black/3 hover:bg-black/[0.01] transition-colors">
                                                <div className="col-span-2 flex items-center gap-3">
                                                    {sub.logo_url ? (
                                                        <img src={sub.logo_url} alt={sub.name} className="w-8 h-8 rounded-xl object-contain" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center font-bold text-sm">{sub.name[0]}</div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-sm">{sub.name}</div>
                                                        <div className="text-[10px] text-gray-400">{sub.filledSlots}/{sub.totalSlots} slots</div>
                                                    </div>
                                                </div>
                                                <div className="text-center text-sm font-bold">{sub.totalGroups}</div>
                                                <div className="flex justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-black/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sub.totalSlots > 0 ? (sub.filledSlots / sub.totalSlots * 100) : 0}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400">
                                                            {sub.totalSlots > 0 ? Math.round(sub.filledSlots / sub.totalSlots * 100) : 0}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right font-bold text-emerald-600">{fmt(sub.estimatedRevenue)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Transactions */}
                                <div>
                                    <SectionHeader title="Recent Transactions" sub="Latest platform payments" />
                                    <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                        {recentTxns.slice(0, 10).map((t: any, i: number) => (
                                            <div key={t._id} className="flex items-center justify-between p-4 border-b border-black/3 hover:bg-black/[0.01]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${t.type === 'funding' ? 'bg-blue-50 text-blue-600' : t.type === 'payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                        {t.type === 'funding' ? <Wallet size={14} /> : t.type === 'payment' ? <CheckCircle2 size={14} /> : <RefreshCw size={14} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold">{t.user_name}</div>
                                                        <div className="text-[10px] text-gray-400">{t.description}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-black ${t.type === 'refund' ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {t.type === 'refund' ? '-' : '+'}{fmt(t.amount)}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ USERS ═══ */}
                        {activeTab === "users" && (
                            <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader
                                    title={`All Users (${allUsers.length})`}
                                    sub="Manage user accounts across the platform"
                                    action={
                                        <div className="flex items-center gap-3 bg-white border border-black/5 rounded-2xl px-4 py-2.5">
                                            <Search size={16} className="text-gray-400" />
                                            <input
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search users..."
                                                className="outline-none text-sm w-48 font-medium"
                                            />
                                        </div>
                                    }
                                />
                                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                    <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b border-black/5">
                                        <div className="col-span-3">User</div>
                                        <div className="col-span-2 text-center">Q Score</div>
                                        <div className="col-span-2 text-center">Active Subs</div>
                                        <div className="col-span-2 text-center">Payments</div>
                                        <div className="col-span-1 text-center">Status</div>
                                        <div className="col-span-2 text-center">Actions</div>
                                    </div>
                                    {filteredUsers.map((u: any) => (
                                        <div key={u._id} className="grid grid-cols-12 items-center p-4 border-b border-black/3 hover:bg-black/[0.01]">
                                            <div className="col-span-3 flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                    {u.full_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm truncate">{u.full_name}</div>
                                                    <div className="text-[10px] text-gray-400 truncate">{u.email}</div>
                                                    {u.username && <div className="text-[10px] text-blue-500 font-bold">@{u.username}</div>}
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center font-bold text-sm">{u.q_score}</div>
                                            <div className="col-span-2 text-center font-bold text-sm">{u.activeSubscriptions}</div>
                                            <div className="col-span-2 text-center font-bold text-sm text-emerald-600">{fmt(u.totalPayments)}</div>
                                            <div className="col-span-1 flex justify-center">
                                                {u.is_banned ? (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full">Banned</span>
                                                ) : u.is_suspended ? (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full">Suspended</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">Active</span>
                                                )}
                                            </div>
                                            <div className="col-span-2 flex justify-center gap-1">
                                                {u.is_suspended ? (
                                                    <button
                                                        onClick={async () => {
                                                            await unsuspendUserMut({ userId: u._id, executorId: currentUser!._id });
                                                            toast.success("User unsuspended");
                                                        }}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:scale-110 transition-transform"
                                                        title="Unsuspend"
                                                    >
                                                        <PlayCircle size={14} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            await suspendUserMut({ userId: u._id, executorId: currentUser!._id });
                                                            toast.success("User suspended");
                                                        }}
                                                        className="p-1.5 bg-amber-50 text-amber-600 rounded-xl hover:scale-110 transition-transform"
                                                        title="Suspend"
                                                    >
                                                        <PauseCircle size={14} />
                                                    </button>
                                                )}
                                                {!u.is_banned && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm(`Ban ${u.full_name}? This is serious.`)) return;
                                                            try {
                                                                await banUserMut({ userId: u._id, executorId: currentUser!._id });
                                                                toast.success("User banned");
                                                            } catch (e: any) { toast.error(e.message); }
                                                        }}
                                                        className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:scale-110 transition-transform"
                                                        title="Ban"
                                                    >
                                                        <Ban size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ MARKETPLACE ═══ */}
                        {activeTab === "marketplace" && (
                            <motion.div key="marketplace" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader
                                    title="Marketplace Management"
                                    sub="All subscription platforms and their performance"
                                    action={
                                        <button
                                            onClick={() => setShowListingModal(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                                        >
                                            <Plus size={16} /> Create New Listing
                                        </button>
                                    }
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {subBreakdown.map((sub: any) => {
                                        const fillPct = sub.totalSlots > 0 ? Math.round(sub.filledSlots / sub.totalSlots * 100) : 0;
                                        return (
                                            <div key={sub._id} className="bg-white rounded-3xl p-6 border border-black/5 hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-4 mb-6">
                                                    {sub.logo_url ? (
                                                        <img src={sub.logo_url} alt={sub.name} className="w-12 h-12 rounded-2xl object-contain" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-xl">{sub.name[0]}</div>
                                                    )}
                                                    <div>
                                                        <div className="font-black text-lg">{sub.name}</div>
                                                        <div className="text-xs text-gray-400">{sub.description}</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <div className="text-lg font-black">{sub.totalGroups}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Groups</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-black text-emerald-600">{sub.filledSlots}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Filled</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-black text-blue-500">{sub.availableSlots}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Open</div>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                                                        <span>Fill Rate</span>
                                                        <span>{fillPct}%</span>
                                                    </div>
                                                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${fillPct > 80 ? 'bg-emerald-500' : fillPct > 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                                                            style={{ width: `${fillPct}%` }} />
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-black/5 flex justify-between items-center">
                                                    <div className="text-xs text-gray-400">Est. Revenue</div>
                                                    <div className="font-black text-emerald-600">{fmt(sub.estimatedRevenue)}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ PAYMENTS ═══ */}
                        {activeTab === "payments" && (
                            <motion.div key="payments" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader title="Payment & Revenue" sub="Full financial overview of the platform" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    <StatCard label="Total Revenue" value={stats ? fmt(stats.totalRevenue) : "—"} icon={<TrendingUp size={18} />} color="bg-emerald-500" />
                                    <StatCard label="Revenue Today" value={stats ? fmt(stats.revenueToday) : "—"} icon={<DollarSign size={18} />} color="bg-blue-500" />
                                    <StatCard label="This Month" value={stats ? fmt(stats.revenueThisMonth) : "—"} icon={<BarChart3 size={18} />} color="bg-indigo-500" />
                                    <StatCard label="Refunds" value={stats ? fmt(stats.totalRefunds) : "—"} icon={<RefreshCw size={18} />} color="bg-orange-500" />
                                </div>

                                <SectionHeader title="All Transactions" sub="Last 50 transactions on the platform" />
                                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                    <div className="grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b">
                                        <div className="col-span-2">User</div>
                                        <div>Type</div>
                                        <div>Date</div>
                                        <div className="text-right">Amount</div>
                                    </div>
                                    {recentTxns.map((t: any) => (
                                        <div key={t._id} className="grid grid-cols-5 items-center p-4 border-b border-black/3 hover:bg-black/[0.01]">
                                            <div className="col-span-2 min-w-0">
                                                <div className="font-bold text-sm truncate">{t.user_name}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{t.description}</div>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${t.type === 'funding' ? 'bg-blue-100 text-blue-600' : t.type === 'payment' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                    {t.type}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</div>
                                            <div className={`text-right font-black ${t.type === 'refund' ? 'text-red-500' : 'text-emerald-600'}`}>
                                                {t.type === 'refund' ? '-' : '+'}{fmt(t.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ CAMPAIGNS ═══ */}
                        {activeTab === "campaigns" && (
                            <motion.div key="campaigns" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader title="Campaigns & Growth" sub="Platform engagement programs" />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {campaigns.map((camp: any) => (
                                        <div key={camp._id} className="bg-white rounded-3xl p-6 border border-black/5 hover:shadow-lg transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                                                    <Megaphone size={18} className="text-purple-600" />
                                                </div>
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${camp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {camp.status}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-lg mb-1">{camp.name}</h3>
                                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">{camp.description}</p>
                                            <div className="flex justify-between text-xs font-bold text-gray-400 pt-4 border-t border-black/5">
                                                <span>Reward: {camp.reward_amount} {camp.reward_type}</span>
                                                <span className="capitalize">{camp.type?.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {campaigns.length === 0 && (
                                        <div className="col-span-3 text-center py-16 text-gray-400">
                                            <Megaphone size={32} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold">No campaigns yet. Create one from the user dashboard admin tab.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ SUPPORT ═══ */}
                        {activeTab === "support" && (
                            <motion.div key="support" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader title="Support Tickets" sub="Manage user issues and escalations" />
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <StatCard label="Open" value={allTickets.filter(t => t.status === "open").length} icon={<Clock size={18} />} color="bg-orange-500" />
                                    <StatCard label="In Progress" value={allTickets.filter(t => t.status === "in_progress").length} icon={<Activity size={18} />} color="bg-blue-500" />
                                    <StatCard label="Resolved" value={allTickets.filter(t => t.status === "resolved").length} icon={<CheckCircle2 size={18} />} color="bg-emerald-500" />
                                </div>
                                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                    {allTickets.length === 0 ? (
                                        <div className="p-16 text-center text-gray-400">
                                            <Ticket size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="font-bold">No support tickets yet.</p>
                                            <p className="text-xs mt-1">Tickets are auto-created when users submit support requests.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b">
                                                <div className="col-span-3">User</div>
                                                <div className="col-span-3">Subject</div>
                                                <div className="col-span-2">Category</div>
                                                <div className="col-span-2">Status</div>
                                                <div className="col-span-2">Actions</div>
                                            </div>
                                            {allTickets.map((ticket: any) => (
                                                <div key={ticket._id} className="grid grid-cols-12 items-center p-4 border-b border-black/3 hover:bg-black/[0.01]">
                                                    <div className="col-span-3">
                                                        <div className="font-bold text-sm">{ticket.username}</div>
                                                        <div className="text-[10px] text-gray-400">{ticket.user_email}</div>
                                                    </div>
                                                    <div className="col-span-3 text-sm font-medium truncate pr-4">{ticket.subject}</div>
                                                    <div className="col-span-2">
                                                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[9px] font-bold capitalize">{ticket.category}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${ticket.status === 'open' ? 'bg-orange-100 text-orange-600' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : ticket.status === 'escalated' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 flex gap-1">
                                                        {ticket.status !== "resolved" && (
                                                            <button
                                                                onClick={() => updateTicketMut({ ticketId: ticket._id, status: "resolved", adminId: currentUser!._id })}
                                                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:scale-110 transition-transform"
                                                                title="Resolve"
                                                            >
                                                                <CheckCircle2 size={13} />
                                                            </button>
                                                        )}
                                                        {ticket.status === "open" && (
                                                            <button
                                                                onClick={() => updateTicketMut({ ticketId: ticket._id, status: "in_progress", adminId: currentUser!._id })}
                                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-xl hover:scale-110 transition-transform"
                                                                title="Take it"
                                                            >
                                                                <HeadphonesIcon size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ ADMINS ═══ */}
                        {activeTab === "admins" && (
                            <motion.div key="admins" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader title="Admin Team" sub="Manage admin roles and accountability" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {adminsList.map((admin: any) => (
                                        <div key={admin._id} className="bg-white rounded-3xl p-6 border border-black/5 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                                    {admin.full_name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg">{admin.full_name}</div>
                                                    <div className="text-xs text-gray-400">{admin.email}</div>
                                                    {admin.email === "riderezzy@gmail.com" && (
                                                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black">
                                                            <Star size={10} /> Super Admin
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs">
                                                    <span className="text-gray-400">Role: </span>
                                                    <span className="font-bold capitalize">{admin.admin_role || "Support Admin"}</span>
                                                </div>
                                                {currentUser?.email === "riderezzy@gmail.com" && admin.email !== "riderezzy@gmail.com" && (
                                                    <select
                                                        defaultValue={admin.admin_role || "support"}
                                                        onChange={async (e) => {
                                                            await setAdminRoleMut({ userId: admin._id, role: e.target.value, executorId: currentUser._id });
                                                            toast.success("Role updated");
                                                        }}
                                                        className="text-xs font-bold border border-black/10 rounded-xl px-3 py-1.5 outline-none focus:ring-2 ring-black/10"
                                                    >
                                                        <option value="support">Support Admin</option>
                                                        <option value="operations">Operations Admin</option>
                                                        <option value="finance">Finance Admin</option>
                                                        <option value="super">Super Admin</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ CAMPUS Q ═══ */}
                        {activeTab === "campus" && (
                            <motion.div key="campus" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader
                                    title="Campus Q Program"
                                    sub="Student ambassadors earning commissions for referrals"
                                    action={
                                        <button
                                            onClick={() => setCampusModalOpen(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                                        >
                                            <Plus size={16} /> Add Campus Rep
                                        </button>
                                    }
                                />

                                {/* Commission Structure */}
                                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white">
                                    <div className="flex items-center gap-3 mb-6">
                                        <GraduationCap size={24} className="text-yellow-400" />
                                        <h3 className="text-xl font-black">Campus Q Commission Structure</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {[
                                            { name: "Netflix Premium", commission: 308 },
                                            { name: "Spotify", commission: 90 },
                                            { name: "Apple Music", commission: 90 },
                                            { name: "Prime Video", commission: 120 },
                                            { name: "YouTube Premium", commission: 96 },
                                            { name: "YouTube Music", commission: 90 },
                                            { name: "Crunchyroll", commission: 100 },
                                            { name: "Canva", commission: 240 },
                                            { name: "CapCut", commission: 500 },
                                            { name: "ChatGPT Go", commission: 200 },
                                        ].map(item => (
                                            <div key={item.name} className="bg-white/10 rounded-2xl p-4">
                                                <div className="text-xs text-white/60 mb-1">{item.name}</div>
                                                <div className="font-black text-yellow-400">₦{item.commission}</div>
                                                <div className="text-[10px] text-white/40">per referral</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-white/40 mt-4">* Commissions are 2% of slot price, paid monthly as long as referred user remains subscribed.</p>
                                </div>

                                {/* Reps List */}
                                {campusReps.length === 0 ? (
                                    <div className="bg-white rounded-3xl border border-black/5 p-16 text-center text-gray-400">
                                        <GraduationCap size={32} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold mb-2">No campus reps yet.</p>
                                        <p className="text-xs">Add student ambassadors to grow JoinTheQ across campuses.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                        <div className="grid grid-cols-6 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b">
                                            <div className="col-span-2">Rep</div>
                                            <div>Campus</div>
                                            <div className="text-center">Referred</div>
                                            <div className="text-center">Status</div>
                                            <div className="text-right">Earned</div>
                                        </div>
                                        {campusReps.map((rep: any) => (
                                            <div key={rep._id} className="grid grid-cols-6 items-center p-4 border-b border-black/3 hover:bg-black/[0.01]">
                                                <div className="col-span-2 flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {rep.full_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{rep.full_name}</div>
                                                        <div className="text-[10px] text-gray-400">{rep.email}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap size={12} className="text-gray-400" />
                                                    <span className="text-sm font-bold">{rep.campus_name}</span>
                                                </div>
                                                <div className="text-center font-black">{rep.total_referred}</div>
                                                <div className="flex justify-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${rep.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                                        {rep.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <div className="text-right font-black text-emerald-600">{fmt(rep.total_earned)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* ── Listing Modal ── */}
            <AnimatePresence>
                {showListingModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="bg-[#f5f5f7] w-full sm:max-w-3xl sm:rounded-[3rem] rounded-t-[3rem] max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 z-10 bg-[#f5f5f7] px-8 pt-8 pb-4 border-b border-black/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black">Create New Listing</h2>
                                        <p className="text-sm text-gray-400 mt-1">Add a subscription account to the marketplace</p>
                                    </div>
                                    <button onClick={() => setShowListingModal(false)} className="p-3 bg-white rounded-full shadow-sm hover:scale-110 transition-transform">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Account Info */}
                                <div className="bg-white rounded-[2.5rem] p-8 space-y-6">
                                    <h3 className="font-black text-lg flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Account Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Subscription Platform</label>
                                            <select
                                                value={listingData.subscription_id}
                                                onChange={e => setListingData({ ...listingData, subscription_id: e.target.value })}
                                                className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                            >
                                                <option value="">Select platform</option>
                                                {allSubscriptions.map((s: any) => (
                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Account Renewal Date</label>
                                            <input
                                                type="date"
                                                value={listingData.admin_renewal_date}
                                                onChange={e => setListingData({ ...listingData, admin_renewal_date: e.target.value })}
                                                className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Account Email</label>
                                            <input
                                                type="email"
                                                placeholder="e.g. netflix@example.com"
                                                value={listingData.account_email}
                                                onChange={e => setListingData({ ...listingData, account_email: e.target.value })}
                                                className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Plan Owner</label>
                                            <input
                                                placeholder="e.g. Providence"
                                                value={listingData.plan_owner}
                                                onChange={e => setListingData({ ...listingData, plan_owner: e.target.value })}
                                                className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Slot Varieties */}
                                <div className="bg-white rounded-[2.5rem] p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black text-lg flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Slot Varieties
                                        </h3>
                                        <button
                                            onClick={() => setListingData({
                                                ...listingData,
                                                slots: [...listingData.slots, { name: "", price: 0, capacity: 1, access_type: "code_access", downloads_enabled: true }]
                                            })}
                                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full border border-blue-100 transition-colors"
                                        >
                                            + Add Variety
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {listingData.slots.map((slot, index) => (
                                            <div key={index} className="bg-[#f8f9fa] rounded-2xl p-5 relative group">
                                                {listingData.slots.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            const newSlots = [...listingData.slots];
                                                            newSlots.splice(index, 1);
                                                            setListingData({ ...listingData, slots: newSlots });
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slot Name</label>
                                                        <input
                                                            placeholder="e.g. Profile 1"
                                                            value={slot.name}
                                                            onChange={e => {
                                                                const ns = [...listingData.slots];
                                                                ns[index] = { ...ns[index], name: e.target.value };
                                                                setListingData({ ...listingData, slots: ns });
                                                            }}
                                                            className="w-full p-3 bg-white rounded-xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price (₦)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="2500"
                                                            value={slot.price}
                                                            onChange={e => {
                                                                const ns = [...listingData.slots];
                                                                ns[index] = { ...ns[index], price: Number(e.target.value) };
                                                                setListingData({ ...listingData, slots: ns });
                                                            }}
                                                            className="w-full p-3 bg-white rounded-xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Capacity</label>
                                                        <input
                                                            type="number"
                                                            placeholder="5"
                                                            value={slot.capacity}
                                                            onChange={e => {
                                                                const ns = [...listingData.slots];
                                                                ns[index] = { ...ns[index], capacity: Number(e.target.value) };
                                                                setListingData({ ...listingData, slots: ns });
                                                            }}
                                                            className="w-full p-3 bg-white rounded-xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Access Method</label>
                                                        <select
                                                            value={slot.access_type}
                                                            onChange={e => {
                                                                const ns = [...listingData.slots];
                                                                ns[index] = { ...ns[index], access_type: e.target.value };
                                                                setListingData({ ...listingData, slots: ns });
                                                            }}
                                                            className="w-full p-3 bg-white rounded-xl font-bold outline-none focus:ring-2 ring-black/10 text-sm appearance-none"
                                                        >
                                                            <option value="code_access">Code Access</option>
                                                            <option value="invite_link">Invite Link</option>
                                                            <option value="email_invite">Email Invite</option>
                                                            <option value="login_with_code">Login + Code</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleCreateListing}
                                    disabled={!listingData.subscription_id || !listingData.account_email || !listingData.plan_owner || !listingData.admin_renewal_date}
                                    className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-base hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10"
                                >
                                    🚀 Confirm & Publish to Marketplace
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Campus Rep Modal ── */}

            <AnimatePresence>
                {campusModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <GraduationCap size={22} className="text-blue-600" /> Add Campus Rep
                                </h2>
                                <button onClick={() => setCampusModalOpen(false)} className="p-2 rounded-full hover:bg-black/5">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">User Email (must be existing user)</label>
                                    <select
                                        className="w-full p-4 bg-[#f8f9fa] rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-black/10"
                                        onChange={e => setCampusUserId(e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select a user</option>
                                        {allUsers.map((u: any) => (
                                            <option key={u._id} value={u._id}>{u.full_name} – {u.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Campus Name</label>
                                    <input
                                        value={campusName}
                                        onChange={e => setCampusName(e.target.value)}
                                        placeholder="e.g. University of Lagos"
                                        className="w-full p-4 bg-[#f8f9fa] rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-black/10"
                                    />
                                </div>
                                <div className="p-4 bg-blue-50 rounded-2xl">
                                    <p className="text-xs text-blue-700 font-bold">
                                        This user will earn 2% commission on every subscription slot their referrals join. Commissions are ongoing as long as users remain subscribed.
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!campusUserId || !campusName) return toast.error("Fill all fields");
                                        try {
                                            await addCampusRepMut({
                                                user_id: campusUserId as Id<"users">,
                                                campus_name: campusName,
                                                executorId: currentUser!._id,
                                            });
                                            toast.success("Campus rep added!");
                                            setCampusModalOpen(false);
                                            setCampusUserId("");
                                            setCampusName("");
                                        } catch (e: any) { toast.error(e.message); }
                                    }}
                                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:scale-[1.01] transition-transform"
                                >
                                    Add to Campus Q Program
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
