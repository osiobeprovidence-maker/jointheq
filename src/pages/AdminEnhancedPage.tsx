import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    CreditCard,
    Settings,
    Search,
    Plus,
    X,
    Check,
    AlertTriangle,
    TrendingUp,
    Activity,
    Clock,
    Shield,
    FileText,
    Bell,
    ChevronRight,
    Filter,
    MoreVertical,
    Edit3,
    Trash2,
    UserPlus,
    UserMinus,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type AdminEnhancedTab = "dashboard" | "slots" | "payments" | "groups" | "waitlist" | "logs";

export default function AdminEnhancedPage() {
    const navigate = useNavigate();
    const user = auth.getCurrentUser();
    const [activeTab, setActiveTab] = useState<AdminEnhancedTab>("dashboard");
    const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Id<"subscription_slots"> | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showPaymentOverrideModal, setShowPaymentOverrideModal] = useState(false);
    const [selectedSlotType, setSelectedSlotType] = useState<Id<"slot_types"> | null>(null);
    const [overrideReason, setOverrideReason] = useState("");
    const [overrideAmount, setOverrideAmount] = useState<string>("");
    const [overrideStatus, setOverrideStatus] = useState("filled");

    // Admin role check
    const adminRole = useQuery(api.adminEnhanced.getAdminRole, user?._id ? { adminId: user._id } : "skip");
    
    // Dashboard metrics
    const metrics = useQuery(api.adminEnhanced.getAdminDashboardMetrics);

    // Data queries
    const allUsers = useQuery(api.admin.getAllUsers) || [];
    const subscriptions = useQuery(api.subscriptions.getActiveSubscriptions) || [];
    const slotTypes = useQuery(api.subscriptions.getAdminMarketplace) || [];
    const waitlist = useQuery(api.adminEnhanced.getWaitlist, {}) || [];
    const adminLogs = useQuery(api.adminEnhanced.getAdminLogs, { limit: 50 }) || [];

    // Mutations
    const assignUserToSlot = useMutation(api.adminEnhanced.adminAssignUserToSlot);
    const removeUserFromSlot = useMutation(api.adminEnhanced.adminRemoveUserFromSlot);
    const overridePayment = useMutation(api.adminEnhanced.adminOverridePayment);
    const moveToGroup = useMutation(api.adminEnhanced.adminMoveUserToGroup);
    const addToWaitlist = useMutation(api.adminEnhanced.addToWaitlist);
    const fillWaitlistSlot = useMutation(api.adminEnhanced.fillWaitlistSlot);

    const filteredUsers = allUsers.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssignUser = async () => {
        if (!user || !selectedUser || !selectedSlotType) return;
        try {
            await assignUserToSlot({
                adminId: user._id,
                userId: selectedUser,
                slotTypeId: selectedSlotType,
                reason: "Manual assignment via enhanced admin panel"
            });
            toast.success("User assigned to slot successfully!");
            setShowAssignModal(false);
            setSelectedUser(null);
            setSelectedSlotType(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to assign user");
        }
    };

    const handlePaymentOverride = async () => {
        if (!user || !selectedSlot || !overrideReason) return;
        try {
            await overridePayment({
                adminId: user._id,
                slotId: selectedSlot,
                newStatus: overrideStatus,
                overrideAmount: overrideAmount ? Number(overrideAmount) : undefined,
                reason: overrideReason,
            });
            toast.success("Payment status overridden!");
            setShowPaymentOverrideModal(false);
            setSelectedSlot(null);
            setOverrideReason("");
            setOverrideAmount("");
        } catch (e: any) {
            toast.error(e.message || "Failed to override payment");
        }
    };

    if (!user?.is_admin) {
        return (
            <MainLayout activeTab="dashboard" setActiveTab={() => navigate("/dashboard")}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                        <p className="text-gray-500">You don't have permission to access this page.</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activeTab="dashboard" setActiveTab={setActiveTab as any}>
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Enhanced Admin System</h1>
                        <p className="text-gray-500 mt-1 text-sm">Advanced subscription and user management</p>
                    </div>
                    {adminRole && (
                        <div className="bg-zinc-900 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold self-start sm:self-auto">
                            {adminRole.isSuperAdmin ? "Super Admin" : adminRole.role?.replace("_", " ").toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Tab Navigation - Scrollable on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={18} />} label="Dashboard" />
                    <TabButton active={activeTab === "slots"} onClick={() => setActiveTab("slots")} icon={<ShoppingBag size={18} />} label="Slot Management" />
                    <TabButton active={activeTab === "payments"} onClick={() => setActiveTab("payments")} icon={<CreditCard size={18} />} label="Payments" />
                    <TabButton active={activeTab === "groups"} onClick={() => setActiveTab("groups")} icon={<Users size={18} />} label="Groups" />
                    <TabButton active={activeTab === "waitlist"} onClick={() => setActiveTab("waitlist")} icon={<Clock size={18} />} label="Waitlist" />
                    <TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<FileText size={18} />} label="Activity Logs" />
                </div>

                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Health Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <MetricCard
                                label="Subscription Health"
                                value={`${metrics?.healthScore || 0}%`}
                                icon={<Activity size={20} />}
                                color="bg-emerald-500"
                                trend={metrics && metrics.healthScore > 80 ? "up" : "neutral"}
                            />
                            <MetricCard
                                label="Active Slots"
                                value={metrics?.activeSlots || 0}
                                icon={<CheckCircle2 size={20} />}
                                color="bg-blue-500"
                            />
                            <MetricCard
                                label="Open Slots"
                                value={metrics?.openSlots || 0}
                                icon={<ShoppingBag size={20} />}
                                color="bg-amber-500"
                            />
                            <MetricCard
                                label="Waiting Users"
                                value={metrics?.waitingUsers || 0}
                                icon={<Users size={20} />}
                                color="bg-purple-500"
                            />
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <StatCard
                                label="Total Groups"
                                value={metrics?.totalGroups || 0}
                                icon={<Settings size={18} />}
                            />
                            <StatCard
                                label="Payment Overrides Today"
                                value={metrics?.paymentOverridesToday || 0}
                                icon={<CreditCard size={18} />}
                            />
                            <StatCard
                                label="Closing Slots"
                                value={metrics?.closingSlots || 0}
                                icon={<AlertTriangle size={18} />}
                                color="text-red-500"
                            />
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-3xl p-6 border border-black/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Activity size={20} />
                                Recent Admin Activity
                            </h3>
                            <div className="space-y-3">
                                {adminLogs.slice(0, 5).map((log: any) => (
                                    <div key={log._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                                        <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                            {log.admin_name?.[0] || "A"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">{log.admin_name || "Unknown Admin"}</div>
                                            <div className="text-xs text-gray-500">{log.action_type.replace("_", " ")}</div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {adminLogs.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No recent activity
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Slot Management Tab */}
                {activeTab === "slots" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* User List */}
                            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/5">
                                <h3 className="text-base sm:text-lg font-bold mb-4">Users ({filteredUsers.length})</h3>
                                <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                                    {filteredUsers.map((u: any) => (
                                        <div
                                            key={u._id}
                                            onClick={() => {
                                                setSelectedUser(u._id);
                                                setShowAssignModal(true);
                                            }}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold">
                                                    {u.full_name?.[0] || "U"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{u.full_name}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Available Slot Types */}
                            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/5">
                                <h3 className="text-base sm:text-lg font-bold mb-4">Available Slot Types</h3>
                                <div className="space-y-3">
                                    {slotTypes.map((group: any) =>
                                        group.slot_types.map((st: any) => (
                                            <div
                                                key={st._id}
                                                onClick={() => {
                                                    setSelectedSlotType(st._id);
                                                    if (selectedUser) setShowAssignModal(true);
                                                }}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                    selectedSlotType === st._id
                                                        ? "border-black bg-black/5"
                                                        : "border-black/5 hover:border-black/20"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-sm sm:text-base">{st.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {group.subscription_name} · ₦{st.price.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-500">
                                                        {st.open_slots || 0} open
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Payments Tab */}
                {activeTab === "payments" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-6 flex items-start gap-4">
                            <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-amber-800 mb-1 text-sm sm:text-base">Payment Override System</h3>
                                <p className="text-sm text-amber-700">
                                    Use this to manually change payment status for slots. All actions are logged.
                                </p>
                            </div>
                        </div>

                        {/* Recent Payment Overrides */}
                        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/5">
                            <h3 className="text-base sm:text-lg font-bold mb-4">Recent Overrides</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-black/5">
                                            <th className="text-left py-3 px-3 sm:px-4 font-bold text-gray-500 text-xs">User</th>
                                            <th className="text-left py-3 px-3 sm:px-4 font-bold text-gray-500 text-xs">Status</th>
                                            <th className="text-left py-3 px-3 sm:px-4 font-bold text-gray-500 text-xs">Amount</th>
                                            <th className="text-left py-3 px-3 sm:px-4 font-bold text-gray-500 text-xs hidden sm:table-cell">Admin</th>
                                            <th className="text-left py-3 px-3 sm:px-4 font-bold text-gray-500 text-xs hidden md:table-cell">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* This would be populated with payment override data */}
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                No recent overrides
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Waitlist Tab */}
                {activeTab === "waitlist" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/5">
                            <h3 className="text-base sm:text-lg font-bold mb-4">Waitlist Queue ({waitlist.length})</h3>
                            <div className="space-y-3">
                                {waitlist.map((item: any) => (
                                    <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                                {item.user_name?.[0] || "U"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm sm:text-base">{item.user_name || "Unknown"}</div>
                                                <div className="text-xs text-gray-500">{item.user_email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="text-sm">
                                                <div className="font-bold">Priority: {item.priority || 0}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(item.added_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {item.status === "waiting" && (
                                                <button
                                                    onClick={async () => {
                                                        if (!user) return;
                                                        toast.success("Feature: Select a slot to fill");
                                                    }}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-600 transition-colors flex-shrink-0"
                                                >
                                                    Fill Slot
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {waitlist.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No users on waitlist
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Activity Logs Tab */}
                {activeTab === "logs" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-white rounded-3xl p-6 border border-black/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText size={20} />
                                Admin Activity Logs
                            </h3>
                            <div className="space-y-3">
                                {adminLogs.map((log: any) => (
                                    <div key={log._id} className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                                    {log.admin_name?.[0] || "A"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{log.action_type.replace(/_/g, " ")}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {log.details || "No details"}
                                                    </div>
                                                    {log.reason && (
                                                        <div className="text-xs text-amber-600 mt-1">
                                                            Reason: {log.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Assign User Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold">Assign User to Slot</h2>
                                    <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-black/5 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Selected User</div>
                                        <div className="font-bold">
                                            {allUsers.find(u => u._id === selectedUser)?.full_name || "Unknown"}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Selected Slot Type</div>
                                        <div className="font-bold">
                                            {slotTypes.flatMap(g => g.slot_types).find(st => st._id === selectedSlotType)?.name || "Select a slot type"}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAssignUser}
                                        disabled={!selectedUser || !selectedSlotType}
                                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                                    >
                                        Confirm Assignment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Override Modal */}
            <AnimatePresence>
                {showPaymentOverrideModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPaymentOverrideModal(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold">Override Payment</h2>
                                    <button onClick={() => setShowPaymentOverrideModal(false)} className="p-2 hover:bg-black/5 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-500 ml-1 mb-2 block">New Status</label>
                                        <select
                                            value={overrideStatus}
                                            onChange={(e) => setOverrideStatus(e.target.value)}
                                            className="w-full p-4 bg-white border border-black/10 rounded-2xl text-sm font-semibold"
                                        >
                                            <option value="filled">Paid (Filled)</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-500 ml-1 mb-2 block">Override Amount (Optional)</label>
                                        <input
                                            type="number"
                                            value={overrideAmount}
                                            onChange={(e) => setOverrideAmount(e.target.value)}
                                            placeholder="Leave blank for original amount"
                                            className="w-full p-4 bg-white border border-black/10 rounded-2xl text-sm font-semibold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-gray-500 ml-1 mb-2 block">Reason (Required)</label>
                                        <textarea
                                            value={overrideReason}
                                            onChange={(e) => setOverrideReason(e.target.value)}
                                            placeholder="Explain why you're overriding this payment..."
                                            rows={3}
                                            className="w-full p-4 bg-white border border-black/10 rounded-2xl text-sm font-semibold resize-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handlePaymentOverride}
                                        disabled={!overrideReason}
                                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                                    >
                                        Confirm Override
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                active
                    ? "bg-zinc-900 text-white shadow-lg"
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-black/5"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function MetricCard({ label, value, icon, color, trend }: { label: string; value: React.ReactNode; icon: React.ReactNode; color: string; trend?: "up" | "down" | "neutral" }) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} bg-opacity-10`}>
                    <div className={`${color.replace('bg-', 'text-')}`}>{icon}</div>
                </div>
                {trend && (
                    <TrendingUp size={16} className={trend === "up" ? "text-emerald-500" : "text-gray-400"} />
                )}
            </div>
            <div className="text-2xl font-black mb-1">{value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: React.ReactNode; icon: React.ReactNode; color?: string }) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-black/5">
            <div className="flex items-center gap-3 mb-2">
                <div className={`${color || "text-gray-400"}`}>{icon}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
            </div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );
}
