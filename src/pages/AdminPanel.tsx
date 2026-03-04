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
    CheckCircle2,
    Clock,
    Ban,
    PauseCircle,
    PlayCircle,
    Plus,
    Wallet,
    Star,
    Activity,
    RefreshCw,
    GraduationCap,
    Ticket,
    X,
    Search,
    DollarSign,
    Shield,
    Edit3,
    Pause,
    StopCircle,
    Trophy,
    Share2,
    Eye,
    ChevronDown,
    ArrowDownCircle,
    Users2,
    AlertTriangle,
    MapPin,
    Calendar,
    Flag,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminTab = "dashboard" | "users" | "marketplace" | "payments" | "campaigns" | "support" | "admins" | "campus" | "security";

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

    // Campaign state
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [campTab, setCampTab] = useState<'list' | 'analytics' | 'withdrawals'>('list');
    const [campaignForm, setCampaignForm] = useState({
        name: '', type: 'referral', description: '', about: '',
        rules: [''], how_it_works: [''],
        reward_structure: '', reward_type: 'boots', reward_amount: 0,
        referral_boots: 5, commission_months: 3,
        start_date: '', end_date: '', target_goal: 100,
    });

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
    const campaigns = useQuery(api.campaigns.getAllAnalytics) || [];
    const adminsList = useQuery(api.users.getAdmins) || [];
    const allSubscriptions = useQuery(api.subscriptions.getMarketplace) || [];
    const campaignAnalytics = useQuery(
        api.campaigns.getAnalytics,
        selectedCampaignId ? { campaign_id: selectedCampaignId as Id<"campaigns"> } : "skip"
    );
    const withdrawals = useQuery(api.campaigns.getWithdrawals, {}) || [];
    // Security / Fraud
    const fraudFlags = useQuery(api.fraud.getFraudFlags, {}) || [];
    const fraudSummary = useQuery(api.fraud.getFraudSummary);
    // Campus territories & events
    const territories = useQuery(api.campus.getTerritories) || [];
    const campusEvents = useQuery(api.campus.getEvents, {}) || [];
    const campusOverview = useQuery(api.campus.getCampusOverview);

    // Mutations
    const suspendUserMut = useMutation(api.admin.suspendUser);
    const unsuspendUserMut = useMutation(api.admin.unsuspendUser);
    const banUserMut = useMutation(api.admin.banUser);
    const setAdminRoleMut = useMutation(api.admin.setAdminRole);
    const updateTicketMut = useMutation(api.admin.updateTicketStatus);
    const addCampusRepMut = useMutation(api.admin.addCampusRep);
    const adminCreateListingMutation = useMutation(api.subscriptions.adminCreateListing);
    const createCampaignMut = useMutation(api.campaigns.create);
    const updateCampaignStatusMut = useMutation(api.campaigns.updateStatus);
    const editCampaignMut = useMutation(api.campaigns.editCampaign);
    const processWithdrawalMut = useMutation(api.campaigns.processWithdrawal);
    // Security mutations
    const reviewFlagMut = useMutation(api.fraud.reviewFlag);
    // Campus mutations
    const createTerritoryMut = useMutation(api.campus.createTerritory);
    const createEventMut = useMutation(api.campus.createEvent);
    const updateEventMut = useMutation(api.campus.updateEvent);

    const handleSaveCampaign = async () => {
        if (!campaignForm.name || !campaignForm.description || !campaignForm.start_date || !campaignForm.end_date) {
            return toast.error('Fill in all required fields');
        }
        try {
            if (editingCampaign) {
                await editCampaignMut({
                    id: editingCampaign._id,
                    name: campaignForm.name,
                    description: campaignForm.description,
                    about: campaignForm.about,
                    rules: campaignForm.rules.filter(r => r.trim()),
                    how_it_works: campaignForm.how_it_works.filter(h => h.trim()),
                    reward_structure: campaignForm.reward_structure,
                    reward_type: campaignForm.reward_type,
                    reward_amount: campaignForm.reward_amount,
                    referral_boots: campaignForm.referral_boots,
                    target_goal: campaignForm.target_goal,
                    end_date: new Date(campaignForm.end_date).getTime(),
                });
                toast.success('Campaign updated!');
            } else {
                await createCampaignMut({
                    name: campaignForm.name,
                    type: campaignForm.type,
                    description: campaignForm.description,
                    about: campaignForm.about,
                    rules: campaignForm.rules.filter(r => r.trim()),
                    how_it_works: campaignForm.how_it_works.filter(h => h.trim()),
                    reward_structure: campaignForm.reward_structure,
                    reward_type: campaignForm.reward_type,
                    reward_amount: campaignForm.reward_amount,
                    referral_boots: campaignForm.referral_boots ?? 5,
                    commission_months: campaignForm.commission_months ?? 3,
                    start_date: new Date(campaignForm.start_date).getTime(),
                    end_date: new Date(campaignForm.end_date).getTime(),
                    target_goal: campaignForm.target_goal,
                    created_by: currentUser!._id,
                });
                toast.success('Campaign created! 🚀', { icon: '🎯' });
            }
            setShowCampaignModal(false);
            setEditingCampaign(null);
            setCampaignForm({ name: '', type: 'referral', description: '', about: '', rules: [''], how_it_works: [''], reward_structure: '', reward_type: 'boots', reward_amount: 0, referral_boots: 5, commission_months: 3, start_date: '', end_date: '', target_goal: 100 });
        } catch (e: any) { toast.error(e.message); }
    };

    const openEditCampaign = (camp: any) => {
        setEditingCampaign(camp);
        setCampaignForm({
            name: camp.name, type: camp.type || 'referral',
            description: camp.description, about: camp.about || '',
            rules: camp.rules?.length ? camp.rules : [''],
            how_it_works: camp.how_it_works?.length ? camp.how_it_works : [''],
            reward_structure: camp.reward_structure || '',
            reward_type: camp.reward_type || 'boots',
            reward_amount: camp.reward_amount || 0,
            referral_boots: camp.referral_boots || 5,
            commission_months: camp.commission_months || 3,
            start_date: camp.start_date ? new Date(camp.start_date).toISOString().split('T')[0] : '',
            end_date: camp.end_date ? new Date(camp.end_date).toISOString().split('T')[0] : '',
            target_goal: camp.target_goal || 100,
        });
        setShowCampaignModal(true);
    };

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
        { id: "security", label: "Security", icon: <ShieldCheck size={18} /> },
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
                            {item.id === "security" && (fraudFlags.filter((f: any) => f.status === "open").length) > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {fraudFlags.filter((f: any) => f.status === "open").length}
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
                                <SectionHeader
                                    title="Campaigns & Growth"
                                    sub="Create and manage growth programs"
                                    action={
                                        <button
                                            onClick={() => { setEditingCampaign(null); setShowCampaignModal(true); }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                                        >
                                            <Plus size={16} /> New Campaign
                                        </button>
                                    }
                                />

                                {/* Sub-tabs */}
                                <div className="flex gap-2">
                                    {(['list', 'analytics', 'withdrawals'] as const).map(t => (
                                        <button key={t} onClick={() => setCampTab(t)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${campTab === t ? 'bg-zinc-900 text-white' : 'bg-white text-gray-500 hover:text-black border border-black/5'
                                                }`}>
                                            {t === 'withdrawals' ? `Withdrawals (${withdrawals.filter((w: any) => w.status === 'pending').length})` : t}
                                        </button>
                                    ))}
                                </div>

                                {/* LIST */}
                                {campTab === 'list' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {(campaigns as any[]).map((camp: any) => {
                                            const daysLeft = Math.max(0, Math.ceil((camp.end_date - Date.now()) / 86400000));
                                            const fillPct = camp.target_goal > 0 ? Math.min(100, Math.round((camp.current_progress ?? 0) / camp.target_goal * 100)) : 0;
                                            return (
                                                <div key={camp._id} className="bg-white rounded-3xl p-6 border border-black/5 hover:shadow-lg transition-all group">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${camp.type === 'campus' ? 'bg-yellow-100' : camp.type === 'referral' ? 'bg-blue-100' : camp.type === 'referral_storm' ? 'bg-purple-100' : 'bg-orange-100'
                                                            }`}>
                                                            {camp.type === 'campus' ? <GraduationCap size={18} className="text-yellow-600" /> :
                                                                camp.type === 'referral' || camp.type === 'referral_storm' ? <Share2 size={18} className="text-blue-600" /> :
                                                                    <Megaphone size={18} className="text-orange-600" />}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${camp.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                                camp.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                                                                }`}>{camp.status}</span>
                                                        </div>
                                                    </div>

                                                    <h3 className="font-black text-base mb-1">{camp.name}</h3>
                                                    <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{camp.description}</p>

                                                    {/* Metrics */}
                                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                                        <div className="bg-[#f8f9fa] rounded-xl p-2 text-center">
                                                            <div className="font-black text-sm">{camp.participant_count ?? 0}</div>
                                                            <div className="text-[9px] text-gray-400 font-bold">Joined</div>
                                                        </div>
                                                        <div className="bg-[#f8f9fa] rounded-xl p-2 text-center">
                                                            <div className="font-black text-sm">{camp.referral_count ?? 0}</div>
                                                            <div className="text-[9px] text-gray-400 font-bold">Referrals</div>
                                                        </div>
                                                        <div className="bg-[#f8f9fa] rounded-xl p-2 text-center">
                                                            <div className="font-black text-sm">{daysLeft}d</div>
                                                            <div className="text-[9px] text-gray-400 font-bold">Left</div>
                                                        </div>
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                                            <span>Progress</span><span>{fillPct}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/5 rounded-full">
                                                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                                                        </div>
                                                    </div>

                                                    {/* Admin Controls */}
                                                    <div className="flex gap-2 pt-4 border-t border-black/5">
                                                        <button onClick={() => openEditCampaign(camp)}
                                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-100 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors">
                                                            <Edit3 size={12} /> Edit
                                                        </button>
                                                        <button onClick={() => { setSelectedCampaignId(camp._id); setCampTab('analytics'); }}
                                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                                                            <BarChart3 size={12} /> Analytics
                                                        </button>
                                                        {camp.status === 'active' ? (
                                                            <button onClick={async () => { await updateCampaignStatusMut({ id: camp._id, status: 'paused' }); toast.success('Campaign paused'); }}
                                                                className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:scale-110 transition-transform" title="Pause">
                                                                <Pause size={14} />
                                                            </button>
                                                        ) : camp.status === 'paused' ? (
                                                            <button onClick={async () => { await updateCampaignStatusMut({ id: camp._id, status: 'active' }); toast.success('Campaign resumed'); }}
                                                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:scale-110 transition-transform" title="Resume">
                                                                <PlayCircle size={14} />
                                                            </button>
                                                        ) : null}
                                                        {camp.status !== 'ended' && (
                                                            <button onClick={async () => { if (!window.confirm('End this campaign?')) return; await updateCampaignStatusMut({ id: camp._id, status: 'ended' }); toast.success('Campaign ended'); }}
                                                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:scale-110 transition-transform" title="End">
                                                                <StopCircle size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {campaigns.length === 0 && (
                                            <div className="col-span-3 text-center py-20 text-gray-400">
                                                <Megaphone size={40} className="mx-auto mb-4 opacity-20" />
                                                <p className="font-black text-lg">No campaigns yet</p>
                                                <p className="text-sm mt-1">Create your first campaign to start growing the platform.</p>
                                                <button onClick={() => setShowCampaignModal(true)} className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-full font-bold text-sm">Create Campaign</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ANALYTICS */}
                                {campTab === 'analytics' && (
                                    <div className="space-y-6">
                                        {/* Campaign selector */}
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={selectedCampaignId ?? ''}
                                                onChange={e => setSelectedCampaignId(e.target.value)}
                                                className="p-3 bg-white border border-black/5 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-black/10 min-w-[220px]"
                                            >
                                                <option value="">Select campaign</option>
                                                {(campaigns as any[]).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>

                                        {selectedCampaignId && campaignAnalytics ? (
                                            <>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <StatCard label="Participants" value={campaignAnalytics.total_participants} icon={<Users2 size={18} />} color="bg-blue-500" />
                                                    <StatCard label="Referrals" value={campaignAnalytics.total_referrals} icon={<Share2 size={18} />} color="bg-purple-500" />
                                                    <StatCard label="BOOTS Sent" value={(campaignAnalytics.total_boots_distributed ?? 0).toLocaleString()} icon={<Zap size={18} />} color="bg-yellow-500" />
                                                    <StatCard label="Cash Sent" value={fmt(campaignAnalytics.total_cash_distributed ?? 0)} icon={<DollarSign size={18} />} color="bg-emerald-500" />
                                                </div>

                                                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                                    <div className="p-6 border-b border-black/5 flex items-center gap-2">
                                                        <Trophy size={18} className="text-yellow-500" />
                                                        <h3 className="font-black">Top Referrers</h3>
                                                    </div>
                                                    {(campaignAnalytics.top_referrers as any[]).map((rep: any, i: number) => (
                                                        <div key={rep._id} className="flex items-center justify-between p-4 border-b border-black/3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-200 text-orange-700' : 'bg-zinc-100 text-zinc-500'
                                                                    }`}>{i + 1}</div>
                                                                <div>
                                                                    <div className="font-bold text-sm">{rep.full_name}</div>
                                                                    <div className="text-[10px] text-gray-400">{rep.email}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-black text-sm">{rep.referral_count ?? 0} referrals</div>
                                                                <div className="text-[10px] text-emerald-600 font-bold">{(rep.boots_earned ?? 0)} BOOTS</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(campaignAnalytics.top_referrers as any[]).length === 0 && (
                                                        <div className="p-8 text-center text-gray-400 text-sm">No referrers yet</div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-white rounded-3xl border border-black/5 p-16 text-center text-gray-400">
                                                <BarChart3 size={40} className="mx-auto mb-4 opacity-20" />
                                                <p className="font-bold">Select a campaign above to view its analytics</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* WITHDRAWALS */}
                                {campTab === 'withdrawals' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <StatCard label="Pending" value={(withdrawals as any[]).filter((w: any) => w.status === 'pending').length} icon={<Clock size={18} />} color="bg-amber-500" />
                                            <StatCard label="Approved" value={(withdrawals as any[]).filter((w: any) => w.status === 'approved').length} icon={<CheckCircle2 size={18} />} color="bg-emerald-500" />
                                            <StatCard label="Rejected" value={(withdrawals as any[]).filter((w: any) => w.status === 'rejected').length} icon={<Ban size={18} />} color="bg-red-500" />
                                        </div>
                                        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                            <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b">
                                                <div className="col-span-3">User</div>
                                                <div className="col-span-2">Campaign</div>
                                                <div className="col-span-2">Bank Info</div>
                                                <div className="col-span-2">Amount</div>
                                                <div className="col-span-1">Status</div>
                                                <div className="col-span-2">Actions</div>
                                            </div>
                                            {(withdrawals as any[]).map((w: any) => (
                                                <div key={w._id} className="grid grid-cols-12 items-center p-4 border-b border-black/3 hover:bg-black/[0.01]">
                                                    <div className="col-span-3">
                                                        <div className="font-bold text-sm">{w.full_name}</div>
                                                        <div className="text-[10px] text-gray-400">{w.email}</div>
                                                    </div>
                                                    <div className="col-span-2 text-xs font-bold truncate pr-2">{w.campaign_name}</div>
                                                    <div className="col-span-2">
                                                        <div className="text-xs font-bold">{w.bank_name}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">{w.account_number}</div>
                                                    </div>
                                                    <div className="col-span-2 font-black text-emerald-600">{fmt(w.amount)}</div>
                                                    <div className="col-span-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                                                            }`}>{w.status}</span>
                                                    </div>
                                                    <div className="col-span-2 flex gap-1">
                                                        {w.status === 'pending' && (
                                                            <>
                                                                <button onClick={async () => { await processWithdrawalMut({ withdrawal_id: w._id, status: 'approved' }); toast.success('Withdrawal approved!'); }}
                                                                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:scale-105 transition-transform">
                                                                    Approve
                                                                </button>
                                                                <button onClick={async () => { await processWithdrawalMut({ withdrawal_id: w._id, status: 'rejected', admin_note: 'Rejected by admin' }); toast.error('Withdrawal rejected'); }}
                                                                    className="flex-1 py-1.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black hover:scale-105 transition-transform">
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {w.status !== 'pending' && <span className="text-[10px] text-gray-400">{w.processed_at ? new Date(w.processed_at).toLocaleDateString() : '—'}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            {withdrawals.length === 0 && (
                                                <div className="p-12 text-center text-gray-400">
                                                    <ArrowDownCircle size={32} className="mx-auto mb-3 opacity-20" />
                                                    <p className="font-bold">No withdrawal requests yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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

                        {/* ═══ SECURITY ═══ */}
                        {activeTab === "security" && (
                            <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                                <SectionHeader title="Security & Fraud Prevention" sub="Monitor suspicious activity and protect platform integrity" />

                                {/* Fraud Summary Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <StatCard label="Total Flags" value={fraudSummary?.total_flags ?? 0} icon={<Flag size={18} />} color="bg-red-500" />
                                    <StatCard label="Open Alerts" value={fraudSummary?.open_flags ?? 0} icon={<AlertTriangle size={18} />} color="bg-red-500" sub="Need review" trend="down" />
                                    <StatCard label="High Severity" value={fraudSummary?.high_severity ?? 0} icon={<AlertTriangle size={18} />} color="bg-orange-500" />
                                    <StatCard label="Flagged Users" value={fraudSummary?.flagged_users ?? 0} icon={<Users size={18} />} color="bg-amber-500" />
                                    <StatCard label="Flagged Referrals" value={fraudSummary?.flagged_referrals ?? 0} icon={<Share2 size={18} />} color="bg-purple-500" />
                                </div>

                                {/* Fraud by type breakdown */}
                                {fraudSummary && (
                                    <div className="bg-white rounded-3xl p-6 border border-black/5">
                                        <h3 className="font-black mb-4">Fraud Breakdown by Type</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                            {[
                                                { key: "same_device", label: "Same Device", color: "bg-orange-100 text-orange-700" },
                                                { key: "same_ip", label: "Same IP", color: "bg-amber-100 text-amber-700" },
                                                { key: "circular_referral", label: "Circular Ref", color: "bg-red-100 text-red-700" },
                                                { key: "rapid_signup", label: "Rapid Signup", color: "bg-purple-100 text-purple-700" },
                                                { key: "suspicious_withdrawal", label: "Suspicious W/D", color: "bg-blue-100 text-blue-700" },
                                            ].map(t => (
                                                <div key={t.key} className={`rounded-2xl p-4 text-center ${t.color}`}>
                                                    <div className="text-2xl font-black">{(fraudSummary.by_type as any)[t.key] ?? 0}</div>
                                                    <div className="text-[10px] font-bold mt-1">{t.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Fraud Flags List */}
                                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                    <div className="p-6 border-b border-black/5 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black">Fraud Flags</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Review and clear or confirm each flag</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {["", "open", "reviewing", "cleared", "confirmed"].map(s => (
                                                <button key={s} className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 hover:bg-zinc-200 transition-colors">
                                                    {s || "All"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="divide-y divide-black/3">
                                        {(fraudFlags as any[]).length === 0 ? (
                                            <div className="p-12 text-center">
                                                <ShieldCheck size={32} className="mx-auto mb-3 text-emerald-400" />
                                                <p className="font-bold text-gray-400">No fraud flags — platform is clean!</p>
                                            </div>
                                        ) : (fraudFlags as any[]).map((flag: any) => (
                                            <div key={flag._id} className="p-5 flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${flag.severity === "high" ? "bg-red-100" : flag.severity === "medium" ? "bg-orange-100" : "bg-amber-100"}`}>
                                                    <AlertTriangle size={16} className={flag.severity === "high" ? "text-red-500" : flag.severity === "medium" ? "text-orange-500" : "text-amber-500"} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-sm">{flag.full_name}</span>
                                                        <span className="text-xs text-gray-400">{flag.email}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${flag.severity === "high" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                                                            {flag.severity}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${flag.status === "open" ? "bg-amber-100 text-amber-700" : flag.status === "confirmed" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                            {flag.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold">{flag.type.replace(/_/g, " ")}</span>
                                                        <span className="text-xs text-gray-400">{new Date(flag.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">{flag.description}</p>
                                                </div>
                                                {flag.status === "open" || flag.status === "reviewing" ? (
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={async () => {
                                                                await reviewFlagMut({ flag_id: flag._id, action: "reviewing", reviewer_id: currentUser!._id });
                                                                toast("Marked as reviewing", { icon: "🔍" });
                                                            }}
                                                            className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors"
                                                        >Review</button>
                                                        <button
                                                            onClick={async () => {
                                                                await reviewFlagMut({ flag_id: flag._id, action: "clear", reviewer_id: currentUser!._id });
                                                                toast.success("Flag cleared");
                                                            }}
                                                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-colors"
                                                        >Clear</button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm("Confirm this fraud flag? This will suspend the user.")) return;
                                                                await reviewFlagMut({ flag_id: flag._id, action: "confirm", reviewer_id: currentUser!._id });
                                                                toast.error("Fraud confirmed — user suspended");
                                                            }}
                                                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors"
                                                        >Confirm</button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ CAMPUS Q (Territories + Events) ═══ */}
                        {activeTab === "campus" && (
                            <motion.div key="campus-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                                <SectionHeader
                                    title="Campus Q Program"
                                    sub="Territory management, ambassadors, and events"
                                    action={
                                        <button
                                            onClick={() => {
                                                const campusName = prompt("Campus name?");
                                                const city = prompt("City?");
                                                if (campusName && city) {
                                                    createTerritoryMut({ campus_name: campusName, city, country: "Nigeria" })
                                                        .then(() => toast.success(`Territory "${campusName}" created!`))
                                                        .catch((e: any) => toast.error(e.message));
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:scale-105 transition-transform"
                                        >
                                            <Plus size={14} /> Add Territory
                                        </button>
                                    }
                                />

                                {/* Campus Overview Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <StatCard label="Territories" value={campusOverview?.total_territories ?? 0} icon={<MapPin size={18} />} color="bg-blue-500" />
                                    <StatCard label="Ambassadors" value={campusOverview?.total_ambassadors ?? 0} icon={<Users size={18} />} color="bg-purple-500" />
                                    <StatCard label="Total Events" value={campusOverview?.total_events ?? 0} icon={<Calendar size={18} />} color="bg-amber-500" />
                                    <StatCard label="Users Acquired" value={campusOverview?.total_users_acquired ?? 0} icon={<TrendingUp size={18} />} color="bg-emerald-500" trend="up" sub="From events" />
                                </div>

                                {/* Territories Grid */}
                                <div>
                                    <h3 className="font-black text-lg mb-4">Campus Territories</h3>
                                    {(territories as any[]).length === 0 ? (
                                        <div className="bg-white rounded-3xl p-12 border border-dashed border-black/20 text-center text-gray-400">
                                            <MapPin size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="font-bold">No territories yet</p>
                                            <p className="text-xs mt-1">Add campus territories to manage ambassadors and events</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {(territories as any[]).map((t: any) => (
                                                <div key={t._id} className="bg-white rounded-3xl p-5 border border-black/5 hover:shadow-lg transition-all">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-black">{t.campus_name}</h4>
                                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {t.city}, {t.country}</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                            {t.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                                        <div className="bg-blue-50 rounded-xl p-2">
                                                            <div className="font-black text-sm text-blue-700">{t.total_users ?? 0}</div>
                                                            <div className="text-[9px] text-blue-500 font-bold">Users</div>
                                                        </div>
                                                        <div className="bg-purple-50 rounded-xl p-2">
                                                            <div className="font-black text-sm text-purple-700">{t.ambassador_count ?? 0}</div>
                                                            <div className="text-[9px] text-purple-500 font-bold">Ambassadors</div>
                                                        </div>
                                                        <div className="bg-amber-50 rounded-xl p-2">
                                                            <div className="font-black text-sm text-amber-700">{t.event_count ?? 0}</div>
                                                            <div className="text-[9px] text-amber-500 font-bold">Events</div>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-black/5 pt-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold">{t.leader_name?.[0] ?? "?"}</div>
                                                            <div>
                                                                <div className="text-xs font-bold">{t.leader_name}</div>
                                                                <div className="text-[10px] text-gray-400">Campus Leader</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Campus Events */}
                                <div>
                                    <SectionHeader
                                        title="Campus Events"
                                        sub="Track onboarding events, referral competitions, and meetups"
                                        action={
                                            <button
                                                onClick={async () => {
                                                    const name = prompt("Event name?");
                                                    const campusName = prompt("Campus name?");
                                                    const city = prompt("City?");
                                                    const dateStr = prompt("Event date? (YYYY-MM-DD)");
                                                    const type = prompt("Type? (onboarding/referral_comp/demo/meetup)") || "meetup";
                                                    if (name && campusName && city && dateStr) {
                                                        try {
                                                            await createEventMut({
                                                                name, campus_name: campusName, city,
                                                                event_date: new Date(dateStr).getTime(),
                                                                type,
                                                                created_by: currentUser?._id,
                                                            });
                                                            toast.success(`Event "${name}" created!`);
                                                        } catch (e: any) { toast.error(e.message); }
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:scale-105 transition-transform"
                                            >
                                                <Plus size={14} /> Add Event
                                            </button>
                                        }
                                    />
                                    <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                        {(campusEvents as any[]).length === 0 ? (
                                            <div className="p-12 text-center text-gray-400">
                                                <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                                                <p className="font-bold">No events yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-black/5">
                                                {(campusEvents as any[]).map((ev: any) => (
                                                    <div key={ev._id} className="p-5 flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${ev.type === "onboarding" ? "bg-blue-100" : ev.type === "referral_comp" ? "bg-purple-100" : ev.type === "demo" ? "bg-green-100" : "bg-amber-100"}`}>
                                                            <Calendar size={18} className="text-zinc-700" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black text-sm">{ev.name}</div>
                                                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                                                <MapPin size={10} />{ev.campus_name}, {ev.city}
                                                                <span>•</span>
                                                                <Calendar size={10} />{new Date(ev.event_date).toLocaleDateString()}
                                                                <span>•</span>
                                                                Host: {ev.host_name}
                                                            </div>
                                                            {ev.status === "completed" && (
                                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                                                                    <span>👥 {ev.actual_attendance ?? 0} attended</span>
                                                                    <span>🆕 {ev.new_users_acquired ?? 0} new users</span>
                                                                    <span>📦 {ev.subscriptions_created ?? 0} subscriptions</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${ev.status === "upcoming" ? "bg-blue-100 text-blue-700" : ev.status === "completed" ? "bg-emerald-100 text-emerald-700" : ev.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                                {ev.status}
                                                            </span>
                                                            {ev.status === "upcoming" && (
                                                                <button
                                                                    onClick={async () => {
                                                                        const attendance = prompt("Actual attendance?");
                                                                        const newUsers = prompt("New users acquired?");
                                                                        const subs = prompt("Subscriptions created?");
                                                                        if (attendance !== null) {
                                                                            await updateEventMut({ id: ev._id, status: "completed", actual_attendance: Number(attendance), new_users_acquired: Number(newUsers || 0), subscriptions_created: Number(subs || 0) });
                                                                            toast.success("Event marked complete!");
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-colors"
                                                                >Complete</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Legacy Campus Reps */}
                                {campusReps.length > 0 && (
                                    <div>
                                        <SectionHeader title="Campus Representatives (Legacy)" sub="Original campus rep program members" />
                                        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                            <div className="grid grid-cols-4 p-4 text-[10px] uppercase font-black text-gray-400 border-b border-black/5">
                                                <span>Rep</span><span className="text-center">Campus</span><span className="text-center">Referred</span><span className="text-right">Earned</span>
                                            </div>
                                            {campusReps.map((rep: any) => (
                                                <div key={rep._id} className="grid grid-cols-4 p-4 items-center border-b border-black/3">
                                                    <div className="font-bold text-sm truncate">{rep.full_name}</div>
                                                    <div className="flex justify-center items-center gap-1"><GraduationCap size={12} className="text-gray-400" /><span className="text-sm font-bold">{rep.campus_name}</span></div>
                                                    <div className="text-center font-black">{rep.total_referred}</div>
                                                    <div className="text-right font-black text-emerald-600">{fmt(rep.total_earned)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>

                </div>
            </main>

            {/* ── Campaign Create / Edit Modal ── */}
            <AnimatePresence>
                {showCampaignModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="bg-[#f5f5f7] w-full sm:max-w-2xl sm:rounded-[3rem] rounded-t-[3rem] max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="sticky top-0 bg-[#f5f5f7] z-10 px-8 pt-8 pb-4 border-b border-black/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
                                    <p className="text-sm text-gray-400 mt-1">Build a growth program for the platform</p>
                                </div>
                                <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }} className="p-3 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"><X size={20} /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Basic Info */}
                                <div className="bg-white rounded-[2.5rem] p-8 space-y-5">
                                    <h3 className="font-black text-base flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Basic Info</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign Name *</label>
                                            <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. Campus Q Program" className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign Type</label>
                                            <select value={campaignForm.type} onChange={e => setCampaignForm({ ...campaignForm, type: e.target.value })} className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm appearance-none">
                                                <option value="referral">Referral Campaign</option>
                                                <option value="campus">Campus Campaign</option>
                                                <option value="engagement">Engagement Campaign</option>
                                                <option value="promotion">Promotion Campaign</option>
                                                <option value="referral_storm">Referral Storm</option>
                                                <option value="jar">Reward Jar</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reward Type</label>
                                            <select value={campaignForm.reward_type} onChange={e => setCampaignForm({ ...campaignForm, reward_type: e.target.value })} className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm appearance-none">
                                                <option value="boots">BOOTS</option>
                                                <option value="cash">Cash Commission</option>
                                                <option value="subscription">Subscription Reward</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reward Amount</label>
                                            <input type="number" value={campaignForm.reward_amount} onChange={e => setCampaignForm({ ...campaignForm, reward_amount: Number(e.target.value) })} placeholder="500" className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BOOTS per Referral</label>
                                            <input type="number" value={campaignForm.referral_boots} onChange={e => setCampaignForm({ ...campaignForm, referral_boots: Number(e.target.value) })} placeholder="5" className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                        </div>
                                        {campaignForm.type === 'campus' && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Commission Months</label>
                                                <input type="number" value={campaignForm.commission_months} onChange={e => setCampaignForm({ ...campaignForm, commission_months: Number(e.target.value) })} placeholder="3" className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Date *</label>
                                            <input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm({ ...campaignForm, start_date: e.target.value })} className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Date *</label>
                                            <input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm({ ...campaignForm, end_date: e.target.value })} className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Goal (participants)</label>
                                            <input type="number" value={campaignForm.target_goal} onChange={e => setCampaignForm({ ...campaignForm, target_goal: Number(e.target.value) })} placeholder="100" className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Description & About */}
                                <div className="bg-white rounded-[2.5rem] p-8 space-y-5">
                                    <h3 className="font-black text-base flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full" /> Description & About</h3>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Short Description * (shown on campaign card)</label>
                                        <textarea rows={2} value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} placeholder="Brief summary of the campaign..." className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm resize-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">About the Campaign (full explanation)</label>
                                        <textarea rows={3} value={campaignForm.about} onChange={e => setCampaignForm({ ...campaignForm, about: e.target.value })} placeholder="Full explanation of what this campaign is about..." className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm resize-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reward Structure</label>
                                        <textarea rows={2} value={campaignForm.reward_structure} onChange={e => setCampaignForm({ ...campaignForm, reward_structure: e.target.value })} placeholder="What users earn. e.g. 2% per subscription for 3 months. 5 BOOTS per referral." className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm resize-none" />
                                    </div>
                                </div>

                                {/* Rules */}
                                <div className="bg-white rounded-[2.5rem] p-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-base flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full" /> Campaign Rules</h3>
                                        <button onClick={() => setCampaignForm({ ...campaignForm, rules: [...campaignForm.rules, ''] })} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">+ Add Rule</button>
                                    </div>
                                    {campaignForm.rules.map((rule, i) => (
                                        <div key={i} className="flex gap-2">
                                            <div className="w-6 h-6 mt-3.5 flex-shrink-0 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                            <input value={rule} onChange={e => { const r = [...campaignForm.rules]; r[i] = e.target.value; setCampaignForm({ ...campaignForm, rules: r }); }} placeholder={`Rule ${i + 1}`} className="flex-1 p-3 bg-[#f8f9fa] rounded-2xl font-medium outline-none focus:ring-2 ring-black/10 text-sm" />
                                            {campaignForm.rules.length > 1 && <button onClick={() => { const r = campaignForm.rules.filter((_, ri) => ri !== i); setCampaignForm({ ...campaignForm, rules: r }); }} className="mt-2 p-2 text-red-400 hover:bg-red-50 rounded-full"><X size={14} /></button>}
                                        </div>
                                    ))}
                                </div>

                                {/* How it works */}
                                <div className="bg-white rounded-[2.5rem] p-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-base flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> How It Works</h3>
                                        <button onClick={() => setCampaignForm({ ...campaignForm, how_it_works: [...campaignForm.how_it_works, ''] })} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">+ Add Step</button>
                                    </div>
                                    {campaignForm.how_it_works.map((step, i) => (
                                        <div key={i} className="flex gap-2">
                                            <div className="w-6 h-6 mt-3.5 flex-shrink-0 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                            <input value={step} onChange={e => { const h = [...campaignForm.how_it_works]; h[i] = e.target.value; setCampaignForm({ ...campaignForm, how_it_works: h }); }} placeholder={`Step ${i + 1}`} className="flex-1 p-3 bg-[#f8f9fa] rounded-2xl font-medium outline-none focus:ring-2 ring-black/10 text-sm" />
                                            {campaignForm.how_it_works.length > 1 && <button onClick={() => { const h = campaignForm.how_it_works.filter((_, hi) => hi !== i); setCampaignForm({ ...campaignForm, how_it_works: h }); }} className="mt-2 p-2 text-red-400 hover:bg-red-50 rounded-full"><X size={14} /></button>}
                                        </div>
                                    ))}
                                </div>

                                {/* Submit */}
                                <button onClick={handleSaveCampaign} className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-base hover:scale-[1.01] transition-transform shadow-xl shadow-black/10">
                                    {editingCampaign ? '✅ Save Changes' : '🚀 Create Campaign'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
