import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    CreditCard,
    Megaphone,
    HeadphonesIcon,
    MessageSquare,
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
    AlertCircle,
    MapPin,
    Calendar,
    Flag,
    Menu,
    Layers,
    Mail,
    Lock,
    Edit,
    BadgeDollarSign,
    Bell,
    UserMinus,
    User,
    ChevronRight,
    ArrowRight,
    LogOut,
    Tag,
    Sparkles,
    UserPlus
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import SupportChatAdmin from "../components/chat/SupportChatAdmin";
import { fmtCurrency, fmtCurrencyShort } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminTab = "dashboard" | "users" | "marketplace" | "payments" | "campaigns" | "support" | "admins" | "campus" | "security" | "review_payments" | "user_listings" | "notifications" | "leave_requests";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = fmtCurrency;

function StatCard({ label, value, sub, icon, color, trend }: {
    label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode;
    color: string; trend?: "up" | "down" | "neutral";
}) {
    return (
        <div className={`bg-white rounded-3xl p-4 sm:p-6 border border-black/5 hover:shadow-lg transition-all group overflow-hidden relative`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -mr-8 -mt-8 ${color}`} />
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 ${color} bg-opacity-10`}>
                <div className={`${color.replace('bg-', 'text-')}`}>{icon}</div>
            </div>
            <div className="text-xl sm:text-2xl font-black mb-1">{value}</div>
            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
                <h2 className="text-lg sm:text-xl font-black">{title}</h2>
                {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
    const navigate = useNavigate();
    const user = auth.getCurrentUser();
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreatingListing, setIsCreatingListing] = useState(false);
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
        platform_name: "",
        account_email: "",
        account_password: "",
        plan_owner: "",
        admin_renewal_date: "",
        category: "Streaming",
        base_cost: 0,
        instructions_text: "",
        instructions_image_url: "",
        slots: [{ name: "", price: 0, capacity: 1, access_type: "code_access", downloads_enabled: true }]
    });
    const [editingSlot, setEditingSlot] = useState<any>(null);  // { slot_type_id, name, price, capacity, access_type }
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Notifications state
    const [notifForm, setNotifForm] = useState({ title: "", message: "", type: "system", userId: "" });

    // Selected User state
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Workforce admin state
    const [adminSubTab, setAdminSubTab] = useState<"team" | "tasks" | "daily" | "performance" | "audit">("team");
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: "", role: "support", work_username: "" });
    const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", deadline: "", priority: "medium", category: "general" });

    // Payment Review state
    const [paymentFilterStatus, setPaymentFilterStatus] = useState("Awaiting Review");
    const [paymentAdminNote, setPaymentAdminNote] = useState("");
    const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

    // Listing Review state
    const [listingFilterStatus, setListingFilterStatus] = useState("Pending Review");
    const [selectedReviewListing, setSelectedReviewListing] = useState<any>(null);
    const [reviewTotalSlots, setReviewTotalSlots] = useState<number>(0);
    const [reviewPricePerSlot, setReviewPricePerSlot] = useState<number>(0);
    const [reviewOwnerPayout, setReviewOwnerPayout] = useState<number>(0);
    const [reviewAdminNote, setReviewAdminNote] = useState("");

    // Queries
    const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as Id<"users"> } : "skip");
    const isSuperAdmin = currentUser?.admin_role === "super" || currentUser?.email === "riderezzy@gmail.com";
    const stats = useQuery(api.admin.getPlatformStats);
    const subBreakdown = useQuery(api.admin.getSubscriptionBreakdown) || [];
    const allUsers = useQuery(api.admin.getAllUsers) || [];
    const allTickets = useQuery(api.admin.getAllTickets) || [];
    const campusReps = useQuery(api.admin.getCampusReps) || [];
    const recentTxns = useQuery(api.admin.getRecentTransactions) || [];
    const campaigns = useQuery(api.campaigns.getAllAnalytics) || [];
    const adminsList = useQuery(api.users.getAdmins) || [];
    const allSubscriptions = useQuery(api.subscriptions.getAdminMarketplace) || [];
    const campaignAnalytics = useQuery(
        api.campaigns.getAnalytics,
        selectedCampaignId ? { campaign_id: selectedCampaignId as Id<"campaigns"> } : "skip"
    );
    const withdrawals = useQuery(api.campaigns.getWithdrawals, {}) || [];
    // Security / Fraud
    const fraudFlags = useQuery(api.fraud.getFraudFlags, {}) || [];
    const fraudSummary = useQuery(api.fraud.getFraudSummary);
    const manualRequests = useQuery(api.funding.getUserManualRequests, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const notifications = useQuery(api.notifications.list, currentUser ? { user_id: currentUser._id } : "skip") || [];
    // Campus territories & events
    const territories = useQuery(api.campus.getTerritories) || [];
    const campusEvents = useQuery(api.campus.getEvents, {}) || [];
    const campusOverview = useQuery(api.campus.getCampusOverview);
    const campusApplications = useQuery(api.campus.getCampusApplications, {}) || [];

    // Payment Review Queries
    const paymentRequests = useQuery(api.funding.getManualRequests, {
        status: paymentFilterStatus
    }) || [];

    // Settings Query
    const platformSettings = useQuery(api.admin.getPlatformSettings) || {};

    // Selected User Slots Query
    const selectedUserSlots = useQuery(api.subscriptions.getSlotsByUserId, selectedUser ? { user_id: selectedUser._id as Id<"users"> } : "skip") || [];

    // User Listings Queries
    const userListings = useQuery(api.listings.getAdminListings, {
        status: listingFilterStatus
    }) || [];

    // Pending Counts for Badges
    const pendingPaymentsCount = useQuery(api.funding.getManualRequests, { status: "Awaiting Review" })?.length || 0;
    const pendingListingsCount = useQuery(api.listings.getAdminListings, { status: "Pending Review" })?.length || 0;

    // Leave Requests Query
    const pendingLeaveRequests = useQuery(api.admin.getPendingLeaveRequests) || { slots: [], migrations: [] };
    const pendingLeaveCount = pendingLeaveRequests.slots.length + pendingLeaveRequests.migrations.length;

    // God Mode State
    const [showGodModeModal, setShowGodModeModal] = useState(false);
    const [godModeUserId, setGodModeUserId] = useState<Id<"users"> | null>(null);
    const [selectedSlotForAssignment, setSelectedSlotForAssignment] = useState<Id<"slot_types"> | null>(null);
    const [overridePaymentStatus, setOverridePaymentStatus] = useState("filled");
    const [overrideReason, setOverrideReason] = useState("");
    const [overrideAmount, setOverrideAmount] = useState("");

    // Mutations
    const toggleAutoRenewMutation = useMutation(api.subscriptions.toggleAutoRenew);
    const markAsReadMutation = useMutation(api.notifications.markAsRead);
    const suspendUserMut = useMutation(api.admin.suspendUser);
    const unsuspendUserMut = useMutation(api.admin.unsuspendUser);
    const banUserMut = useMutation(api.admin.banUser);
    const setAdminRoleMut = useMutation(api.admin.setAdminRole);
    const updateTicketMut = useMutation(api.admin.updateTicketStatus);
    const addCampusRepMut = useMutation(api.admin.addCampusRep);
    const adminCreateListingMutation = useMutation(api.subscriptions.adminCreateListing);
    const adminUpdateSlotMut = useMutation(api.subscriptions.adminUpdateSlotType);
    const adminDeleteGroupMut = useMutation(api.subscriptions.adminDeleteGroup);
    const setPlatformSetting = useMutation(api.admin.updatePlatformSetting);

    // God Mode Mutations (Enhanced Admin)
    const assignUserToSlot = useMutation(api.adminEnhanced.adminAssignUserToSlot);
    const removeUserFromSlot = useMutation(api.adminEnhanced.adminRemoveUserFromSlot);
    const overridePayment = useMutation(api.adminEnhanced.adminOverridePayment);
    const moveToGroup = useMutation(api.adminEnhanced.adminMoveUserToGroup);
    const addToWaitlist = useMutation(api.adminEnhanced.addToWaitlist);
    const fillWaitlistSlot = useMutation(api.adminEnhanced.fillWaitlistSlot);

    const adminSendNotification = useMutation(api.admin.adminSendNotification);
    const approveLeaveRequest = useMutation(api.admin.approveLeaveRequest);
    const createCampaignMut = useMutation(api.campaigns.create);
    const updateCampaignStatusMut = useMutation(api.campaigns.updateStatus);
    const editCampaignMut = useMutation(api.campaigns.editCampaign);
    const processWithdrawalMut = useMutation(api.campaigns.processWithdrawal);
    // Workforce Queries
    const workforceAdmins = useQuery(api.adminWorkforce.getAdminTeam) || [];
    const invitations = useQuery(api.adminWorkforce.getInvitations) || [];
    const allAdminTasks = useQuery(api.adminWorkforce.getAllTasks, {}) || [];
    const adminActivityLogs = useQuery(api.adminWorkforce.getAdminLogs, {}) || [];
    const performanceMetrics = useQuery(api.adminWorkforce.getPerformanceMetrics) || [];
    const dailyReport = useQuery(api.adminWorkforce.getDailyReport);
    const supportStats = useQuery(api.support.getSupportStats, currentUser?._id ? { adminId: currentUser._id as any } : "skip");


    // Workforce Mutations
    const createInviteMut = useMutation(api.adminWorkforce.createInvitation);
    const revokeInviteMut = useMutation(api.adminWorkforce.revokeInvitation);
    const updateAdminProfileMut = useMutation(api.adminWorkforce.updateAdminProfile);
    const suspendAdminMut = useMutation(api.adminWorkforce.suspendAdminAccess);
    const restoreAdminMut = useMutation(api.adminWorkforce.restoreAdminAccess);
    const removeAdminMut = useMutation(api.adminWorkforce.removeAdmin);
    const createTaskMut = useMutation(api.adminWorkforce.createTask);
    const updateTaskMut = useMutation(api.adminWorkforce.updateTask);
    const deleteTaskMut = useMutation(api.adminWorkforce.deleteTask);
    // Security mutations
    const reviewFlagMut = useMutation(api.fraud.reviewFlag);
    // Campus mutations
    const createTerritoryMut = useMutation(api.campus.createTerritory);
    const createEventMut = useMutation(api.campus.createEvent);
    const updateEventMut = useMutation(api.campus.updateEvent);
    const reviewCampusApplicationMut = useMutation(api.campus.reviewCampusApplication);

    // Payment Mutations
    const approvePaymentMut = useMutation(api.funding.approveFunding);
    const rejectPaymentMut = useMutation(api.funding.rejectFunding);

    // Listing Review Mutations
    const approveListingMut = useMutation(api.listings.approveListing);
    const rejectListingMut = useMutation(api.listings.rejectListing);

    // Settings Mutation
    const updateSettingMut = useMutation(api.admin.updatePlatformSetting);

    // Pre-Launch Reset Mutation
    const resetAllWalletsMut = useMutation(api.users.resetAllWallets);
    const grantSuperAdminMut = useMutation(api.users.grantSuperAdmin);
    const initializeSuperAdminMut = useMutation(api.users.initializeSuperAdmin);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const walletResetPermission = useQuery(
        api.users.canResetWallets,
        currentUser?._id ? { user_id: currentUser._id } : "skip"
    );


    // Auto-initialize super admin for authorized emails
    useEffect(() => {
        const authorizedAdmins = ["riderezzy@gmail.com", "reinvoursehung@gmail.com"];
        if (currentUser?.email && authorizedAdmins.includes(currentUser.email) &&
            walletResetPermission !== undefined && walletResetPermission.role !== "super") {
            initializeSuperAdminMut({}).then(() => {
                toast.success("Super admin initialized! Refreshing...");
                setTimeout(() => window.location.reload(), 1500);
            }).catch(e => console.log("Init already done or error:", e.message));
        }
    }, [currentUser, walletResetPermission]);

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

    // God Mode Handlers
    const handleAssignUserToSlot = async () => {
        if (!godModeUserId || !selectedSlotForAssignment) return;
        try {
            await assignUserToSlot({
                adminId: currentUser!._id,
                userId: godModeUserId,
                slotTypeId: selectedSlotForAssignment,
                reason: "Manual assignment via God mode"
            });
            toast.success("User assigned to slot!");
            setShowGodModeModal(false);
            setGodModeUserId(null);
            setSelectedSlotForAssignment(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to assign user");
        }
    };

    const handleOverridePayment = async (slotId: Id<"subscription_slots">) => {
        if (!overrideReason) return toast.error("Please provide a reason");
        try {
            await overridePayment({
                adminId: currentUser!._id,
                slotId,
                newStatus: overridePaymentStatus,
                overrideAmount: overrideAmount ? Number(overrideAmount) : undefined,
                reason: overrideReason,
            });
            toast.success("Payment status overridden!");
            setShowGodModeModal(false);
            setOverrideReason("");
            setOverrideAmount("");
        } catch (e: any) {
            toast.error(e.message || "Failed to override payment");
        }
    };

    const handleAddToWaitlist = async (subscriptionCatalogId: Id<"subscription_catalog">) => {
        if (!godModeUserId) return;
        try {
            await addToWaitlist({
                adminId: currentUser!._id,
                userId: godModeUserId,
                subscriptionCatalogId,
                notes: "Added via God mode"
            });
            toast.success("User added to waitlist!");
        } catch (e: any) {
            toast.error(e.message || "Failed to add to waitlist");
        }
    };

    const handleOpenGodMode = (userId: Id<"users">) => {
        setGodModeUserId(userId);
        setShowGodModeModal(true);
    };

    const handleApprovePayment = async (id: any) => {
        if (!confirm("Are you sure you want to approve this payment? This will credit the user's wallet with the base amount.")) return;
        try {
            await approvePaymentMut({
                request_id: id,
                admin_id: currentUser!._id as any,
                admin_note: paymentAdminNote || undefined
            });
            toast.success("Payment approved and wallet credited!");
            setPaymentAdminNote("");
        } catch (e: any) { toast.error(e.message || "Failed to approve payment"); }
    };

    const handleRejectPayment = async (id: any) => {
        if (!paymentAdminNote) return toast.error("Please provide a reason for rejection in the note field.");
        if (!confirm("Reject this payment?")) return;
        try {
            await rejectPaymentMut({
                request_id: id,
                admin_id: currentUser!._id as any,
                admin_note: paymentAdminNote
            });
            toast.success("Payment rejected");
            setPaymentAdminNote("");
        } catch (e: any) { toast.error(e.message || "Failed to reject payment"); }
    };

    const handleOpenApproveListing = (listing: any) => {
        setSelectedReviewListing(listing);
        setReviewTotalSlots(listing.total_slots);
        // Suggest pricing
        if (listing.platform === "Netflix Premium") {
            setReviewPricePerSlot(1600);
            setReviewOwnerPayout(13000);
        } else if (listing.platform === "Spotify Family") {
            setReviewPricePerSlot(800);
            setReviewOwnerPayout(4800);
        } else {
            setReviewPricePerSlot(1000);
            setReviewOwnerPayout(0);
        }
    };

    const handleApproveListingSubmit = async () => {
        if (!reviewTotalSlots || !reviewPricePerSlot || !reviewOwnerPayout) return toast.error("Please fill in all approval details");
        try {
            await approveListingMut({
                listing_id: selectedReviewListing._id,
                admin_id: currentUser!._id as any,
                total_slots: reviewTotalSlots,
                price_per_slot: reviewPricePerSlot,
                owner_payout: reviewOwnerPayout,
                admin_note: reviewAdminNote || undefined
            });
            toast.success("Listing approved and marketplace updated!");
            setSelectedReviewListing(null);
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
        if (isCreatingListing) return;
        setIsCreatingListing(true);
        try {
            const normalizedPlanOwner = listingData.plan_owner.trim().replace(/^@+/, "") || "admin";
            // Generate a short unique request id to send to the backend for idempotency
            (window as any).__listingRequestId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
            await adminCreateListingMutation({
                platform_name: listingData.platform_name,
                account_email: listingData.account_email,
                plan_owner: normalizedPlanOwner,
                admin_renewal_date: listingData.admin_renewal_date,
                category: listingData.category,
                login_password: listingData.account_password,
                base_cost: Number(listingData.base_cost),
                instructions_text: listingData.instructions_text,
                instructions_image_url: listingData.instructions_image_url,
                slot_types: listingData.slots,
                // frontend should generate a unique request id per user action
                request_id: (window as any).__listingRequestId || undefined,
            });
            toast.success("Listing published to marketplace!", { icon: '🚀' });
            setShowListingModal(false);
            setListingData({
                platform_name: "", account_email: "", account_password: "", plan_owner: "",
                admin_renewal_date: "", category: "Streaming", base_cost: 0, instructions_text: "", instructions_image_url: "",
                slots: [{ name: "", price: 0, capacity: 1, access_type: "code_access", downloads_enabled: true }]
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to create listing");
        } finally {
            setIsCreatingListing(false);
        }
    };

    const handleSendNotification = async () => {
        if (!notifForm.title || !notifForm.message) return toast.error("Title and message are required");
        try {
            await adminSendNotification({
                title: notifForm.title,
                message: notifForm.message,
                type: notifForm.type as any,
                userId: notifForm.userId ? notifForm.userId as Id<"users"> : undefined,
                executorId: currentUser!._id,
            });
            toast.success("Notification sent successfully!");
            setNotifForm({ title: "", message: "", type: "system", userId: "" });
        } catch (e: any) { toast.error(e.message); }
    };

    const handleApproveLeave = async (id: Id<"slots" | "migrated_subscriptions">, type: "slot" | "migration") => {
        try {
            await approveLeaveRequest({ id, type, executorId: currentUser!._id });
            toast.success("Leave request approved");
        } catch (e: any) { toast.error(e.message); }
    };

    const handleRejectLeave = async (id: Id<"slots" | "migrated_subscriptions">, type: "slot" | "migration") => {
        toast("Rejection not implemented yet. Contact ops.", { icon: "ℹ️" });
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

    const navItems: { id: AdminTab; label: string; icon: React.ReactNode; sub?: string }[] = [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, sub: "Platform Command Center" },
        { id: "users", label: "Users", icon: <Users size={18} />, sub: "User Management & Audit" },
        { id: "marketplace", label: "Marketplace", icon: <ShoppingBag size={18} />, sub: "Subscription Inventory" },
        { id: "payments", label: "Payments", icon: <CreditCard size={18} />, sub: "Transaction History" },
        { id: "campaigns", label: "Campaigns", icon: <Megaphone size={18} />, sub: "Growth & Commissions" },
        { id: "security", label: "Security", icon: <ShieldCheck size={18} />, sub: "Fraud & Anti-Spam" },
        { id: "support", label: "Support", icon: <HeadphonesIcon size={18} />, sub: "Customer Experience" },
        { id: "admins", label: "Admins", icon: <Shield size={18} />, sub: "Workforce & Tasks" },
        { id: "campus", label: "Campus Q", icon: <GraduationCap size={18} />, sub: "Campus Rep Program" },
        { id: "review_payments", label: "Payments Review", icon: <Wallet size={18} />, sub: "FINANCE OPERATIONS" },
        { id: "user_listings", label: "Listing Review", icon: <Layers size={18} />, sub: "CONTENT MODERATION" },
        { id: "notifications", label: "Notifications", icon: <Bell size={18} />, sub: "Push Updates" },
        { id: "leave_requests", label: "Leave Requests", icon: <UserMinus size={18} />, sub: "Cancellations" },
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
                            onClick={() => {
                                setActiveTab(item.id);
                                setMobileMenuOpen(false);
                            }}
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
                            {item.id === "review_payments" && pendingPaymentsCount > 0 && (
                                <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {pendingPaymentsCount}
                                </span>
                            )}
                            {item.id === "user_listings" && pendingListingsCount > 0 && (
                                <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {pendingListingsCount}
                                </span>
                            )}
                            {item.id === "leave_requests" && pendingLeaveCount > 0 && (
                                <span className="ml-auto bg-purple-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {pendingLeaveCount}
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
                    <div className="pt-2 text-[10px] text-white/20 font-bold uppercase text-center tracking-widest">
                        Terminal v2.4.0
                    </div>
                </div>
            </aside>

            {/* Profile Drawer Overlay (Right Side) */}
            <AnimatePresence>
                {isProfileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsProfileOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-[320px] bg-white shadow-2xl z-[101] flex flex-col"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5">
                                <h2 className="text-xl font-bold">Profile Settings</h2>
                                <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-zinc-100 rounded-full mx-auto mb-4 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                        {currentUser?.profile_image_url ? (
                                            <img src={currentUser.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} className="text-gray-300" />
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold">{currentUser?.full_name || currentUser?.username}</h3>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">@{currentUser?.username}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Account Mode</div>
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/dashboard');
                                        }}
                                        className="w-full p-4 bg-zinc-900 text-white rounded-3xl font-bold flex items-center justify-between group hover:bg-black transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                                                <LayoutDashboard size={16} />
                                            </div>
                                            <span className="text-sm">Go to User Side</span>
                                        </div>
                                        <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Quick Stats</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-3xl">
                                            <div className="text-sm font-bold">{currentUser?.q_score}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Q Score</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-3xl">
                                            <div className="text-sm font-bold">{fmtCurrency(currentUser?.wallet_balance || 0)}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Wallet</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 border-t border-black/5 bg-gray-50/50">
                                <button
                                    onClick={() => {
                                        if (window.confirm("Logout now?")) {
                                            auth.logout();
                                        }
                                    }}
                                    className="w-full py-5 bg-white border border-red-50 text-red-500 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    <LogOut size={20} /> Logout Session
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* ── Mobile Top Bar ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950 text-white flex items-center justify-between px-4 py-3 h-16 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black">Q</div>
                    <span className="font-extrabold tracking-tight text-base">Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsProfileOpen(true)} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                        {currentUser?.profile_image_url ? <img src={currentUser.profile_image_url} alt="Profile" className="w-full h-full object-cover" /> : <User size={16} />}
                    </button>
                    <button onClick={() => setMobileMenuOpen(prev => !prev)} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* ── Mobile Hamburger Menu ── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Close menu overlay"
                            className="md:hidden fixed inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            className="md:hidden fixed top-16 left-0 bottom-0 w-[88%] max-w-[320px] bg-zinc-950 text-white z-50 p-4 flex flex-col"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 260, damping: 28 }}
                        >
                            <div className="p-2 border-b border-white/10 mb-3">
                                <div className="text-[10px] text-white/50 uppercase tracking-widest">Navigation</div>
                                <div className="text-sm font-black mt-1">Admin Control</div>
                            </div>
                            <nav className="flex-1 space-y-1 overflow-y-auto">
                                {navItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id
                                            ? 'bg-white text-zinc-900'
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
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

                            <div className="pt-3 border-t border-white/10 mt-3">
                                <div className="flex items-center gap-3 px-2 py-2">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {currentUser?.full_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold truncate">{currentUser?.full_name}</div>
                                        <div className="text-[10px] text-white/40 capitalize">{currentUser?.admin_role || "Super Admin"}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Content ── */}
            <main className="flex-1 md:ml-64 mt-16 md:mt-0 min-h-screen">
                {/* Top bar (desktop) */}
                <div className="hidden md:flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-black/5 sticky top-0 z-30">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {activeTab !== "dashboard" && (
                            <button
                                onClick={() => setActiveTab("dashboard")}
                                className="p-2 -ml-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all group shadow-sm border border-black/5"
                            >
                                <ArrowLeft size={18} className="text-gray-400 group-hover:text-zinc-900 group-hover:-translate-x-0.5 transition-all" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-base sm:text-xl font-black capitalize">{navItems.find(n => n.id === activeTab)?.label}</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">{navItems.find(n => n.id === activeTab)?.sub || "Platform Command Center"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-50 border border-black/5 rounded-full text-[10px] sm:text-xs font-bold text-gray-500 flex items-center gap-1.5 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="hidden sm:inline">System Active</span>
                        </div>
                        <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 sm:pr-4 bg-zinc-950 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                                {currentUser?.profile_image_url ? <img src={currentUser.profile_image_url} alt="Profile" className="w-full h-full object-cover" /> : <User size={14} />}
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold tracking-tight hidden sm:inline">@{currentUser?.username}</span>
                        </button>
                    </div>
                </div>

                <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
                    <AnimatePresence mode="wait">

                        {/* ═══ DASHBOARD ═══ */}
                        {activeTab === "dashboard" && (
                            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">

                                {/* Pre-Launch Actions */}
                                {walletResetPermission && (
                                    <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-[2.5rem] p-8 text-white shadow-2xl">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                                    <ShieldCheck size={12} /> Pre-Launch Setup
                                                </div>
                                                <h2 className="text-2xl font-black mb-2">Reset All Wallet Balances</h2>
                                                <p className="text-sm font-medium text-red-100 max-w-xl mb-3">
                                                    Clear all user wallet balances and funding history. This action is irreversible.
                                                </p>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="px-3 py-1.5 bg-white/20 rounded-full font-bold">
                                                        Your role: <span className="font-black uppercase">{walletResetPermission.role || 'none'}</span>
                                                    </span>
                                                    {walletResetPermission.can_reset ? (
                                                        <span className="px-3 py-1.5 bg-emerald-500/80 rounded-full font-bold">✓ Authorized</span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 bg-amber-500/80 rounded-full font-bold">✗ {walletResetPermission.reason}</span>
                                                    )}
                                                </div>
                                                {!walletResetPermission.can_reset && walletResetPermission.role !== 'super' && currentUser?.is_admin && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await grantSuperAdminMut({ target_id: currentUser!._id, granted_by: currentUser!._id });
                                                                toast.success('Super admin role granted! You can now reset wallets.');
                                                                // Refresh permission check
                                                            } catch (e: any) {
                                                                toast.error(e.message);
                                                            }
                                                        }}
                                                        className="mt-3 px-4 py-2 bg-white text-red-600 font-bold rounded-xl hover:scale-105 transition-transform text-xs"
                                                    >
                                                        👑 Grant Yourself Super Admin
                                                    </button>
                                                )}
                                            </div>
                                            {walletResetPermission.can_reset && (
                                                <button
                                                    onClick={() => setShowResetConfirm(true)}
                                                    className="px-6 py-4 bg-white text-red-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                                                >
                                                    <RefreshCw size={18} /> Reset Wallets
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                                        <StatCard label="Today" value={stats ? fmtCurrency(stats.revenueToday) : "—"} icon={<TrendingUp size={18} />} color="bg-emerald-500" trend="up" sub="vs yesterday" />
                                        <StatCard label="This Month" value={stats ? fmtCurrency(stats.revenueThisMonth) : "—"} icon={<BarChart3 size={18} />} color="bg-blue-500" />
                                        <StatCard label="Total Revenue" value={stats ? fmtCurrency(stats.totalRevenue) : "—"} icon={<DollarSign size={18} />} color="bg-indigo-600" />
                                        <StatCard label="Refunds" value={stats ? fmtCurrency(stats.totalRefunds) : "—"} icon={<RefreshCw size={18} />} color="bg-orange-500" trend="down" />
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

                                {/* Migrations */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <SectionHeader title="Offline Migrations" sub="Legacy account transition metrics" />
                                        <button onClick={() => navigate("/admin/migrations")} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-all">View All</button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <StatCard label="Total Migrations" value={stats?.totalMigrations ?? 0} icon={<RefreshCw size={18} />} color="bg-indigo-500" />
                                        <StatCard label="Pending Review" value={stats?.pendingMigrations ?? 0} icon={<Clock size={18} />} color="bg-amber-500" sub="Needs verification" />
                                        <StatCard label="Migration Completion" value={`${stats?.totalMigrations ? Math.round(((stats.totalMigrations - stats.pendingMigrations) / stats.totalMigrations) * 100) : 0}%`} icon={<CheckCircle2 size={18} />} color="bg-emerald-500" />
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
                                                <div className="text-right font-bold text-emerald-600">{fmtCurrency(sub.estimatedRevenue)}</div>
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
                                                        {t.type === 'refund' ? '-' : '+'}{fmtCurrency(t.amount)}
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
                            <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 sm:space-y-6">
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
                                                className="outline-none text-sm w-32 sm:w-48 font-medium"
                                            />
                                        </div>
                                    }
                                />
                                {/* Desktop Table / Mobile Cards */}
                                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                    {/* Desktop Table Header */}
                                    <div className="hidden md:grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-gray-400 p-4 border-b border-black/5">
                                        <div className="col-span-3">User</div>
                                        <div className="col-span-2 text-center">Q Score</div>
                                        <div className="col-span-2 text-center">Active Subs</div>
                                        <div className="col-span-2 text-center">Payments</div>
                                        <div className="col-span-1 text-center">Status</div>
                                        <div className="col-span-2 text-center">Actions</div>
                                    </div>
                                    {/* Mobile-first card layout */}
                                    <div className="divide-y divide-black/5">
                                        {filteredUsers.map((u: any) => (
                                            <React.Fragment key={u._id}>
                                                <div onClick={() => setSelectedUser(u)} className="p-4 hover:bg-black/[0.01] cursor-pointer md:hidden">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0">
                                                                {u.full_name?.[0]}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-bold text-sm truncate">{u.full_name}</div>
                                                                <div className="text-[10px] text-gray-400 truncate">{u.email}</div>
                                                                {u.username && <div className="text-[10px] text-blue-500 font-bold">@{u.username}</div>}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            {u.is_banned ? (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full">Banned</span>
                                                            ) : u.is_suspended ? (
                                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full">Suspended</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">Active</span>
                                                            )}
                                                            <div className="text-xs font-bold text-gray-400">Q: {u.q_score}</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-2xl p-3 mb-3">
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Subs</div>
                                                            <div className="text-sm font-black">{u.activeSubscriptions}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Payments</div>
                                                            <div className="text-sm font-black text-emerald-600">{fmt(u.totalPayments)}</div>
                                                        </div>
                                                        <div className="text-center flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenGodMode(u._id);
                                                                }}
                                                                className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:scale-110 transition-transform"
                                                                title="God Mode"
                                                            >
                                                                <Sparkles size={14} />
                                                            </button>
                                                            {u.is_suspended ? (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        await unsuspendUserMut({ userId: u._id, executorId: currentUser!._id });
                                                                        toast.success("User unsuspended");
                                                                    }}
                                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:scale-110 transition-transform"
                                                                    title="Unsuspend"
                                                                >
                                                                    <PlayCircle size={14} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        await suspendUserMut({ userId: u._id, executorId: currentUser!._id });
                                                                        toast.success("User suspended");
                                                                    }}
                                                                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:scale-110 transition-transform"
                                                                    title="Suspend"
                                                                >
                                                                    <PauseCircle size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Desktop Table Row */}
                                                <div onClick={() => setSelectedUser(u)} className="hidden md:grid grid-cols-12 items-center p-4 border-b border-black/3 hover:bg-black/[0.01] cursor-pointer">
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
                                                    {/* God Mode Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenGodMode(u._id);
                                                        }}
                                                        className="p-1.5 bg-purple-50 text-purple-600 rounded-xl hover:scale-110 transition-transform"
                                                        title="God Mode"
                                                    >
                                                        <Sparkles size={14} />
                                                    </button>

                                                    {u.is_suspended ? (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
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
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
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
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!window.confirm(`Ban ${u.full_name}? This is serious.`)) return;
                                                                try {
                                                                    await banUserMut({ userId: u._id, executorId: currentUser!._id });
                                                                    toast.success("User banned");
                                                                } catch (err: any) { toast.error(err.message); }
                                                            }}
                                                            className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:scale-110 transition-transform"
                                                            title="Ban"
                                                        >
                                                            <Ban size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ MARKETPLACE ═══ */}
                        {activeTab === "marketplace" && (
                            <motion.div key="marketplace" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader
                                    title="Marketplace Management"
                                    sub="All subscription listings — tap a card to manage slots"
                                    action={
                                        <button
                                            onClick={() => setShowListingModal(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                                        >
                                            <Plus size={16} /> Create New Listing
                                        </button>
                                    }
                                />

                                {allSubscriptions.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400">
                                        <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">No listings yet</p>
                                        <p className="text-sm mt-1">Click "Create New Listing" to add one</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(allSubscriptions as any[]).map((group: any) => {
                                            const isExpanded = expandedGroup === group._id;
                                            const filledSlots = group.members?.length ?? 0;
                                            const displayOwner = (group.plan_owner || "admin").trim().replace(/^@+/, "") || "admin";
                                            return (
                                                <div key={group._id} className="bg-white rounded-3xl border border-black/5 overflow-hidden hover:shadow-lg transition-all">
                                                    {/* Card header — clickable to expand */}
                                                    <button
                                                        onClick={() => setExpandedGroup(isExpanded ? null : group._id)}
                                                        className="w-full p-5 flex items-center justify-between text-left"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0">
                                                                {group.subscription_name?.[0] ?? "?"}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-base">{group.subscription_name}</div>
                                                                <div className="text-xs text-gray-400">
                                                                    {group.account_email} · Owner: {displayOwner}
                                                                </div>
                                                                <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                                                                    Renews {group.billing_cycle_start}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="font-black text-sm text-emerald-600">{filledSlots} Members</div>
                                                                <div className="text-[10px] text-gray-400">{group.slot_types?.length ?? 0} slot types</div>
                                                            </div>
                                                            <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                        </div>
                                                    </button>

                                                    {/* Expanded slot management panel */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="border-t border-black/5 p-5 space-y-4 bg-zinc-50">
                                                                    {/* Slot types list */}
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Slot Types</p>
                                                                        <div className="space-y-2">
                                                                            {(group.slot_types ?? []).length === 0 ? (
                                                                                <p className="text-xs text-gray-400 text-center py-3">No slot types defined</p>
                                                                            ) : (group.slot_types as any[]).map((st: any) => (
                                                                                <div key={st._id} className="bg-white rounded-2xl p-4">
                                                                                    {editingSlot?._id === st._id ? (
                                                                                        /* Inline edit form */
                                                                                        <div className="space-y-3">
                                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                                <div>
                                                                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Name</label>
                                                                                                    <input
                                                                                                        value={editingSlot.name}
                                                                                                        onChange={e => setEditingSlot({ ...editingSlot, name: e.target.value })}
                                                                                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-black/8 rounded-xl text-sm font-bold outline-none"
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Price (₦)</label>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        value={editingSlot.price}
                                                                                                        onChange={e => setEditingSlot({ ...editingSlot, price: Number(e.target.value) })}
                                                                                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-black/8 rounded-xl text-sm font-bold outline-none"
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Capacity</label>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        value={editingSlot.capacity}
                                                                                                        onChange={e => setEditingSlot({ ...editingSlot, capacity: Number(e.target.value) })}
                                                                                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-black/8 rounded-xl text-sm font-bold outline-none"
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Access</label>
                                                                                                    <select
                                                                                                        value={editingSlot.access_type}
                                                                                                        onChange={e => setEditingSlot({ ...editingSlot, access_type: e.target.value })}
                                                                                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 border border-black/8 rounded-xl text-sm font-bold outline-none"
                                                                                                    >
                                                                                                        <option value="code_access">Code Access</option>
                                                                                                        <option value="invite_link">Invite Link</option>
                                                                                                        <option value="email_invite">Email Invite</option>
                                                                                                        <option value="login_with_code">Login + Code</option>
                                                                                                    </select>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex gap-2 pt-1">
                                                                                                <button
                                                                                                    onClick={async () => {
                                                                                                        try {
                                                                                                            await adminUpdateSlotMut({
                                                                                                                slot_type_id: editingSlot._id,
                                                                                                                name: editingSlot.name,
                                                                                                                price: editingSlot.price,
                                                                                                                capacity: editingSlot.capacity,
                                                                                                                access_type: editingSlot.access_type,
                                                                                                            });
                                                                                                            toast.success("Slot updated!");
                                                                                                            setEditingSlot(null);
                                                                                                        } catch (e: any) { toast.error(e.message); }
                                                                                                    }}
                                                                                                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black hover:scale-105 transition-transform"
                                                                                                >Save Changes</button>
                                                                                                <button
                                                                                                    onClick={() => setEditingSlot(null)}
                                                                                                    className="px-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold"
                                                                                                >Cancel</button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        /* Display row */
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div>
                                                                                                <div className="font-black text-sm">{st.name}</div>
                                                                                                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                                                                                    <span className="font-bold text-emerald-600">₦{st.price?.toLocaleString()}</span>
                                                                                                    <span>·</span>
                                                                                                    <span>Capacity: {st.capacity}</span>
                                                                                                    <span>·</span>
                                                                                                    <span className="capitalize">{st.access_type?.replace(/_/g, " ")}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex gap-2">
                                                                                                <button
                                                                                                    onClick={() => setEditingSlot({ ...st })}
                                                                                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:scale-110 transition-transform"
                                                                                                    title="Edit slot"
                                                                                                ><Edit3 size={13} /></button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Members inside this group */}
                                                                    {(group.members ?? []).length > 0 && (
                                                                        <div>
                                                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Current Members</p>
                                                                            <div className="space-y-1.5">
                                                                                {(group.members as any[]).map((m: any, i: number) => (
                                                                                    <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center text-[10px] font-black">{m.user_name?.[0]}</div>
                                                                                            <span className="text-sm font-bold">{m.user_name}</span>
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-400">
                                                                                            <span className="font-bold text-zinc-600">{m.slot_name}</span>
                                                                                            {m.renewal && <span> · Renews {m.renewal}</span>}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Delete listing */}
                                                                    <div className="pt-2 border-t border-black/5">
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (!confirm(`Delete the entire "${group.subscription_name}" listing and all its slots?`)) return;
                                                                                try {
                                                                                    await adminDeleteGroupMut({ group_id: group._id });
                                                                                    toast("Listing deleted", { icon: "🗑️" });
                                                                                    setExpandedGroup(null);
                                                                                } catch (e: any) { toast.error(e.message); }
                                                                            }}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-xs font-black hover:bg-red-100 transition-colors"
                                                                        >
                                                                            <X size={13} /> Delete Entire Listing
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                <SectionHeader title="Support Chat" sub="Real-time assistance for users" />

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <StatCard label="Open Tickets" value={supportStats?.open || 0} icon={<MessageSquare size={16} />} color="bg-zinc-900" />
                                    <StatCard label="AI Handled" value={supportStats?.ai_handled || 0} icon={<Zap size={16} />} color="bg-indigo-500" />
                                    <StatCard label="Agent Handled" value={supportStats?.agent_handled || 0} icon={<Users size={16} />} color="bg-blue-500" />
                                    <StatCard label="Resolved" value={supportStats?.resolved || 0} icon={<CheckCircle2 size={16} />} color="bg-emerald-500" />
                                </div>

                                {/* WhatsApp Config */}
                                <div className="bg-white p-5 rounded-3xl border border-black/5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div>
                                        <div className="font-black text-sm">WhatsApp Support Number</div>
                                        <div className="text-xs text-gray-400 mt-1">Users clicking the WhatsApp support button will be redirected here.</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            defaultValue={platformSettings?.whatsapp_number || ""}
                                            id="whatsapp_input"
                                            placeholder="e.g. +1234567890"
                                            className="w-48 px-4 py-2 bg-zinc-50 border border-black/5 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-emerald-500/20"
                                        />
                                        <button
                                            onClick={async () => {
                                                const val = (document.getElementById('whatsapp_input') as HTMLInputElement).value;
                                                try {
                                                    await updateSettingMut({ key: "whatsapp_number", value: val, executorId: currentUser!._id as any });
                                                    toast.success("WhatsApp number updated!");
                                                } catch (e: any) { toast.error(e.message); }
                                            }}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-black hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <SupportChatAdmin adminId={currentUser!._id} />
                            </motion.div>

                        )}

                        {/* ═══ ADMINS — WORKFORCE CONTROL ROOM ═══ */}
                        {activeTab === "admins" && (
                            <motion.div key="admins" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

                                {/* Sub-tab nav */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {(["team", "tasks", "daily", "performance", "audit"] as const).map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => setAdminSubTab(sub)}
                                            className={`flex-shrink-0 px-5 py-2 rounded-2xl text-sm font-bold transition-all capitalize ${adminSubTab === sub ? "bg-zinc-900 text-white shadow" : "bg-white text-zinc-500 border border-black/8 hover:border-black/20"}`}
                                        >
                                            {sub === "daily" ? "📊 Daily Report" : sub === "tasks" ? "✅ Tasks" : sub === "team" ? "👥 Team" : sub === "performance" ? "📈 Performance" : "🔍 Audit"}
                                        </button>
                                    ))}
                                </div>

                                {/* ── TEAM ── */}
                                {adminSubTab === "team" && (
                                    <div className="space-y-6">
                                        <SectionHeader
                                            title="Admin Team"
                                            sub="Manage roles, work handles, and access"
                                            action={isSuperAdmin ? (
                                                <button
                                                    onClick={() => setShowInviteModal(true)}
                                                    className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:scale-105 transition-transform"
                                                >
                                                    <Plus size={14} /> Invite Admin
                                                </button>
                                            ) : null}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {(workforceAdmins as any[]).map((admin: any) => {
                                                const roleColors: Record<string, string> = {
                                                    super: "bg-purple-100 text-purple-700",
                                                    support: "bg-blue-100 text-blue-700",
                                                    operations: "bg-amber-100 text-amber-700",
                                                    finance: "bg-emerald-100 text-emerald-700",
                                                    campaigns: "bg-pink-100 text-pink-700",
                                                };
                                                const roleColor = roleColors[admin.admin_role ?? "support"] ?? "bg-zinc-100 text-zinc-600";
                                                return (
                                                    <div key={admin._id} className={`bg-white rounded-3xl p-5 border border-black/5 hover:shadow-lg transition-all relative overflow-hidden ${admin.is_admin_suspended ? "opacity-60 ring-2 ring-red-200" : ""}`}>
                                                        {admin.is_admin_suspended && (
                                                            <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase">Suspended</div>
                                                        )}
                                                        <div className="flex items-start gap-3 mb-4">
                                                            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0">
                                                                {admin.full_name?.[0]}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-black truncate">{admin.full_name}</div>
                                                                {admin.work_username && (
                                                                    <div className="text-xs font-bold text-zinc-400">@{admin.work_username}</div>
                                                                )}
                                                                <div className="text-[10px] text-gray-400 truncate">{admin.email}</div>
                                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${roleColor}`}>
                                                                    {admin.admin_role === "super" ? "⭐ Super Admin" : (admin.admin_role ?? "support") + " admin"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Performance mini-stats */}
                                                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                                            <div className="bg-zinc-50 rounded-xl p-2">
                                                                <div className="font-black text-sm text-zinc-800">{admin.tasks_completed}</div>
                                                                <div className="text-[9px] text-zinc-400 font-bold">Tasks Done</div>
                                                            </div>
                                                            <div className="bg-zinc-50 rounded-xl p-2">
                                                                <div className={`font-black text-sm ${admin.tasks_overdue > 0 ? "text-red-500" : "text-zinc-800"}`}>{admin.tasks_overdue}</div>
                                                                <div className="text-[9px] text-zinc-400 font-bold">Overdue</div>
                                                            </div>
                                                            <div className="bg-zinc-50 rounded-xl p-2">
                                                                <div className="font-black text-sm text-zinc-800">{admin.total_actions}</div>
                                                                <div className="text-[9px] text-zinc-400 font-bold">Actions</div>
                                                            </div>
                                                        </div>

                                                        {/* Super admin controls */}
                                                        {isSuperAdmin && admin._id !== currentUser._id && (
                                                            <div className="border-t border-black/5 pt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        const newHandle = prompt(`Change work username for ${admin.full_name}:`, admin.work_username ?? "");
                                                                        if (newHandle) {
                                                                            await updateAdminProfileMut({ target_id: admin._id, updated_by: currentUser._id, work_username: newHandle });
                                                                            toast.success("Work username updated!");
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1"
                                                                ><Edit3 size={11} /> Username</button>
                                                                <select
                                                                    defaultValue={admin.admin_role || "support"}
                                                                    onChange={async (e) => {
                                                                        await updateAdminProfileMut({ target_id: admin._id, updated_by: currentUser._id, admin_role: e.target.value });
                                                                        toast.success("Role updated");
                                                                    }}
                                                                    className="px-2 py-1.5 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold border-0 outline-none"
                                                                >
                                                                    <option value="support">Support</option>
                                                                    <option value="operations">Operations</option>
                                                                    <option value="finance">Finance</option>
                                                                    <option value="campaigns">Campaigns</option>
                                                                    <option value="super">Super Admin</option>
                                                                </select>
                                                                {admin.is_admin_suspended ? (
                                                                    <button
                                                                        onClick={async () => {
                                                                            await restoreAdminMut({ target_id: admin._id, restored_by: currentUser._id });
                                                                            toast.success("Access restored");
                                                                        }}
                                                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-colors"
                                                                    >Restore</button>
                                                                ) : (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const reason = prompt("Reason for suspension?");
                                                                            if (!reason) return;
                                                                            await suspendAdminMut({ target_id: admin._id, suspended_by: currentUser._id, reason });
                                                                            toast("Admin access suspended", { icon: "⏸️" });
                                                                        }}
                                                                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors"
                                                                    >Suspend</button>
                                                                )}
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm(`Permanently remove ${admin.full_name} as admin?`)) return;
                                                                        await removeAdminMut({ target_id: admin._id, removed_by: currentUser._id });
                                                                        toast.error("Admin removed");
                                                                    }}
                                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors"
                                                                >Remove</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pending Invitations */}
                                        {(invitations as any[]).filter((i: any) => i.status === "pending").length > 0 && (
                                            <div>
                                                <h3 className="font-black text-sm mb-3 text-gray-400 uppercase tracking-widest">Pending Invitations</h3>
                                                <div className="bg-white rounded-3xl border border-black/5 divide-y divide-black/5">
                                                    {(invitations as any[]).filter((i: any) => i.status === "pending").map((inv: any) => (
                                                        <div key={inv._id} className="p-4 flex items-center justify-between">
                                                            <div>
                                                                <div className="font-bold text-sm">{inv.email}</div>
                                                                <div className="text-xs text-gray-400">@{inv.work_username} · {inv.role} admin · Invited by {inv.invited_by_name}</div>
                                                                <div className="text-[10px] text-amber-600 mt-0.5">Expires {new Date(inv.expires_at).toLocaleDateString()}</div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const link = `https://jointheq.sbs/admin-accept?token=${inv.token}`;
                                                                        navigator.clipboard.writeText(link);
                                                                        toast.success("Invite link copied!");
                                                                    }}

                                                                    className="px-3 py-1.5 bg-zinc-100 rounded-xl text-xs font-bold hover:bg-zinc-200"
                                                                >Copy Link</button>
                                                                <button
                                                                    onClick={async () => {
                                                                        await revokeInviteMut({ invitation_id: inv._id, revoked_by: currentUser!._id });
                                                                        toast("Invitation revoked");
                                                                    }}
                                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200"
                                                                >Revoke</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── TASKS ── */}
                                {adminSubTab === "tasks" && (
                                    <div className="space-y-6">
                                        <SectionHeader
                                            title="Task Board"
                                            sub="Assign, track, and manage admin duties"
                                            action={isSuperAdmin ? (
                                                <button
                                                    onClick={() => setShowTaskModal(true)}
                                                    className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:scale-105 transition-transform"
                                                >
                                                    <Plus size={14} /> New Task
                                                </button>
                                            ) : null}
                                        />

                                        {/* Kanban columns */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {(["pending", "in_progress", "completed", "overdue"] as const).map(col => {
                                                const colTasks = (allAdminTasks as any[]).filter((t: any) => t.status === col);
                                                const colColors: Record<string, string> = {
                                                    pending: "bg-zinc-50 border-zinc-200",
                                                    in_progress: "bg-blue-50 border-blue-200",
                                                    completed: "bg-emerald-50 border-emerald-200",
                                                    overdue: "bg-red-50 border-red-200",
                                                };
                                                const colHeaders: Record<string, string> = {
                                                    pending: "⏳ Pending",
                                                    in_progress: "🔵 In Progress",
                                                    completed: "✅ Completed",
                                                    overdue: "🔴 Overdue",
                                                };
                                                return (
                                                    <div key={col} className={`rounded-3xl border p-4 ${colColors[col]}`}>
                                                        <div className="font-black text-sm mb-3 flex items-center justify-between">
                                                            <span>{colHeaders[col]}</span>
                                                            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-black shadow-sm">{colTasks.length}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {colTasks.length === 0 ? (
                                                                <div className="text-center text-xs text-gray-400 py-6">No tasks</div>
                                                            ) : colTasks.map((task: any) => {
                                                                const priorityColors: Record<string, string> = {
                                                                    urgent: "bg-red-100 text-red-700",
                                                                    high: "bg-orange-100 text-orange-700",
                                                                    medium: "bg-amber-100 text-amber-700",
                                                                    low: "bg-zinc-100 text-zinc-600",
                                                                };
                                                                return (
                                                                    <div key={task._id} className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all">
                                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                                            <div className="font-bold text-xs leading-tight">{task.title}</div>
                                                                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${priorityColors[task.priority] ?? "bg-zinc-100 text-zinc-600"}`}>{task.priority}</span>
                                                                        </div>
                                                                        {task.description && <p className="text-[10px] text-gray-400 mb-2 line-clamp-2">{task.description}</p>}
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="text-[10px] text-gray-400">
                                                                                <span className="font-bold text-zinc-600">@{task.assignee_name}</span>
                                                                                <span className="mx-1">·</span>
                                                                                <span>{task.days_until_due > 0 ? `${task.days_until_due}d left` : `${Math.abs(task.days_until_due)}d ago`}</span>
                                                                            </div>
                                                                            {task.status !== "completed" && (
                                                                                <div className="flex gap-1">
                                                                                    {task.status !== "in_progress" && (
                                                                                        <button onClick={async () => { await updateTaskMut({ task_id: task._id, admin_id: currentUser!._id, status: "in_progress" }); toast("Marked in progress", { icon: "🔵" }); }} className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:scale-110 transition-transform" title="Start"><PlayCircle size={11} /></button>
                                                                                    )}
                                                                                    <button onClick={async () => { await updateTaskMut({ task_id: task._id, admin_id: currentUser!._id, status: "completed" }); toast.success("Task complete!"); }} className="p-1 bg-emerald-100 text-emerald-600 rounded-lg hover:scale-110 transition-transform" title="Complete"><CheckCircle2 size={11} /></button>
                                                                                    {isSuperAdmin && (
                                                                                        <button onClick={async () => { if (!confirm("Delete task?")) return; await deleteTaskMut({ task_id: task._id, deleted_by: currentUser!._id }); }} className="p-1 bg-red-100 text-red-600 rounded-lg hover:scale-110 transition-transform" title="Delete"><X size={11} /></button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── DAILY REPORT ── */}
                                {adminSubTab === "daily" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-black">Daily Platform Report</h2>
                                                <p className="text-sm text-gray-400 mt-1">{dailyReport?.date ?? "Loading..."}</p>
                                            </div>
                                            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-black flex items-center gap-2">
                                                <Activity size={14} /> Live
                                            </div>
                                        </div>

                                        {dailyReport && (
                                            <>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <StatCard label="New Users Today" value={dailyReport.users.new_today} icon={<Users size={18} />} color="bg-blue-500" sub={`vs ${dailyReport.users.new_yesterday} yesterday`} trend={dailyReport.users.trend as any} />
                                                    <StatCard label="Revenue Today" value={`₦${(dailyReport.revenue.today / 100).toLocaleString()}`} icon={<DollarSign size={18} />} color="bg-emerald-500" sub={`${dailyReport.revenue.transactions_today} transactions`} trend={dailyReport.revenue.trend as any} />
                                                    <StatCard label="Open Tickets" value={dailyReport.support.open_tickets} icon={<HeadphonesIcon size={18} />} color="bg-amber-500" sub={`${dailyReport.support.resolved_today} resolved today`} />
                                                    <StatCard label="Security Flags" value={dailyReport.security.open_flags} icon={<ShieldCheck size={18} />} color="bg-red-500" sub={`${dailyReport.security.flags_today} new today`} trend={dailyReport.security.flags_today > 0 ? "down" : "neutral"} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-white rounded-3xl p-5 border border-black/5">
                                                        <div className="font-black mb-3 flex items-center gap-2"><Users size={16} /> User Growth</div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between"><span className="text-gray-400">Total Users</span><span className="font-black">{dailyReport.users.total.toLocaleString()}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-400">New Today</span><span className="font-black text-emerald-600">+{dailyReport.users.new_today}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-400">Yesterday</span><span className="font-black">+{dailyReport.users.new_yesterday}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-3xl p-5 border border-black/5">
                                                        <div className="font-black mb-3 flex items-center gap-2"><Megaphone size={16} /> Campaigns</div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between"><span className="text-gray-400">Active Campaigns</span><span className="font-black">{dailyReport.campaigns.active}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-400">Referrals Today</span><span className="font-black text-blue-600">{dailyReport.campaigns.referrals_today}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-3xl p-5 border border-black/5">
                                                        <div className="font-black mb-3 flex items-center gap-2"><Activity size={16} /> Admin Activity</div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between"><span className="text-gray-400">Actions Today</span><span className="font-black">{dailyReport.admin_activity.actions_today}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-400">New Tickets</span><span className="font-black">{dailyReport.support.new_today}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-400">Resolved</span><span className="font-black text-emerald-600">{dailyReport.support.resolved_today}</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ── PERFORMANCE ── */}
                                {adminSubTab === "performance" && (
                                    <div className="space-y-6">
                                        <SectionHeader title="Admin Performance" sub="Monthly productivity metrics — who is actually working" />
                                        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                            <div className="grid grid-cols-6 p-4 text-[10px] font-black uppercase text-gray-400 border-b border-black/5">
                                                <span>Admin</span>
                                                <span className="text-center">Role</span>
                                                <span className="text-center">Tasks ✅</span>
                                                <span className="text-center">Overdue 🔴</span>
                                                <span className="text-center">Tickets</span>
                                                <span className="text-right">On-Time %</span>
                                            </div>
                                            {(performanceMetrics as any[]).map((m: any) => (
                                                <div key={m.admin_id} className="grid grid-cols-6 p-4 items-center border-b border-black/3 hover:bg-zinc-50 transition-colors">
                                                    <div>
                                                        <div className="font-black text-sm">@{m.work_username}</div>
                                                        <div className="text-[10px] text-gray-400">{m.full_name}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${m.admin_role === "super" ? "bg-purple-100 text-purple-700" : m.admin_role === "finance" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{m.admin_role}</span>
                                                    </div>
                                                    <div className="text-center font-black text-emerald-600">{m.tasks_completed_this_month}</div>
                                                    <div className={`text-center font-black ${m.tasks_overdue > 0 ? "text-red-500" : "text-gray-400"}`}>{m.tasks_overdue}</div>
                                                    <div className="text-center font-black text-blue-600">{m.tickets_resolved_this_month}</div>
                                                    <div className="text-right">
                                                        <span className={`font-black ${m.on_time_completion_rate >= 80 ? "text-emerald-600" : m.on_time_completion_rate >= 50 ? "text-amber-500" : "text-red-500"}`}>{m.on_time_completion_rate}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── AUDIT ── */}
                                {adminSubTab === "audit" && (
                                    <div className="space-y-6">
                                        <SectionHeader title="Activity Audit Log" sub="Every action taken by every admin, in real time" />
                                        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                                            <div className="divide-y divide-black/3 max-h-[60vh] overflow-y-auto">
                                                {(adminActivityLogs as any[]).length === 0 ? (
                                                    <div className="p-12 text-center text-gray-400">
                                                        <Eye size={32} className="mx-auto mb-3 opacity-20" />
                                                        <p className="font-bold">No logs yet</p>
                                                    </div>
                                                ) : (adminActivityLogs as any[]).map((log: any) => (
                                                    <div key={log._id} className="p-4 flex items-start gap-3">
                                                        <div className="w-8 h-8 bg-zinc-100 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-zinc-600">
                                                            {log.work_username?.[0]?.toUpperCase() ?? "?"}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-black text-sm">@{log.work_username}</span>
                                                                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold">{log.admin_role}</span>
                                                                <span className="text-xs text-gray-400">{log.action.replace(/_/g, " ")}</span>
                                                                {log.target_name && <span className="text-xs font-bold text-zinc-700 truncate">→ {log.target_name}</span>}
                                                            </div>
                                                            {log.details && <p className="text-[10px] text-gray-400 mt-0.5">{log.details}</p>}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(log.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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

                                {/* Campus Applications Review */}
                                {campusApplications.filter((a: any) => a.status === "pending").length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-lg flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Pending Applications
                                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{campusApplications.filter((a: any) => a.status === "pending").length}</span>
                                            </h3>
                                        </div>
                                        <div className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden">
                                            <div className="divide-y divide-black/5">
                                                {campusApplications.filter((a: any) => a.status === "pending").map((app: any) => (
                                                    <div key={app._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0">
                                                                {app.user_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-sm">{app.user_name}</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-full">{app.university}</span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 mb-2">{app.user_email} • {app.social_handle || "No social handle"}</div>
                                                                <p className="text-xs text-zinc-600 leading-relaxed max-w-lg">
                                                                    <span className="font-bold text-zinc-400 uppercase text-[9px] tracking-tighter">Reason:</span> {app.reason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end md:self-center">
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm(`Approve ${app.user_name}'s application?`)) return;
                                                                    try {
                                                                        await reviewCampusApplicationMut({ applicationId: app._id, status: "approved", adminId: currentUser!._id });
                                                                        toast.success("Application approved!");
                                                                    } catch (e: any) { toast.error(e.message); }
                                                                }}
                                                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all border border-emerald-100"
                                                            >Approve</button>
                                                            <button
                                                                onClick={async () => {
                                                                    const reason = prompt("Enter rejection reason (optional):");
                                                                    if (reason === null) return;
                                                                    try {
                                                                        await reviewCampusApplicationMut({ applicationId: app._id, status: "rejected", adminId: currentUser!._id });
                                                                        toast.error("Application rejected");
                                                                    } catch (e: any) { toast.error(e.message); }
                                                                }}
                                                                className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-100 transition-all border border-red-100"
                                                            >Reject</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                                <div className="space-y-4">
                                    <SectionHeader title="Campus Representatives" sub="Active program members" />
                                    {campusReps.length === 0 ? (
                                        <div className="bg-white rounded-3xl border border-black/5 p-16 text-center text-gray-400">
                                            <GraduationCap size={32} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold">No campus reps yet.</p>
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
                                                    <div className="text-right font-black text-emerald-600">{fmtCurrency(rep.total_earned)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ PAYMENTS REVIEW ═══ */}
                        {activeTab === "review_payments" && (
                            <motion.div key="review_payments" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Review Needed" value={pendingPaymentsCount} icon={<Clock size={18} />} color="bg-amber-500" />
                                    <StatCard label="Total Approved" value={paymentRequests.filter(r => r.status === 'Approved').length} icon={<CheckCircle2 size={18} />} color="bg-emerald-500" trend="up" sub="Processed transfer" />
                                    <StatCard label="Total Credited" value={fmtCurrency(paymentRequests.reduce((acc, r) => acc + (r.status === 'Approved' ? r.base_amount : 0), 0))} icon={<Wallet size={18} />} color="bg-blue-500" />
                                    <StatCard label="Verification Rev" value={fmtCurrency(paymentRequests.reduce((acc, r) => acc + (r.status === 'Approved' ? (r.unique_amount - r.base_amount) : 0), 0))} icon={<DollarSign size={18} />} color="bg-indigo-500" />
                                </div>

                                <div className="bg-white border border-black/5 rounded-[2rem] p-6 flex flex-wrap gap-4 items-end shadow-sm">
                                    <div className="flex-1 min-w-[200px] space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Filter</label>
                                        <div className="flex gap-2">
                                            {["All", "Awaiting Review", "Approved", "Rejected"].map(s => (
                                                <button key={s} onClick={() => setPaymentFilterStatus(s)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentFilterStatus === s ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-100 text-gray-400 hover:bg-zinc-200'}`}>{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-[2] min-w-[300px] space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Note / Rejection Reason</label>
                                        <input type="text" placeholder="Add a note before approving or rejecting..." value={paymentAdminNote} onChange={(e) => setPaymentAdminNote(e.target.value)} className="w-full bg-[#f8f9fa] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 ring-black/5 font-bold text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {paymentRequests.length === 0 ? (
                                        <div className="bg-white border border-black/5 rounded-[2rem] p-20 text-center text-gray-400">
                                            <ShieldCheck size={40} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold">No payment requests found</p>
                                        </div>
                                    ) : (
                                        paymentRequests.map((req: any) => (
                                            <div key={req._id} className="bg-white border border-black/5 rounded-[2.5rem] p-6 hover:shadow-xl transition-all flex flex-col lg:flex-row gap-8 items-start lg:items-center relative overflow-hidden shadow-sm">
                                                {req.status === 'Awaiting Review' && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />}
                                                <div className="flex items-center gap-4 min-w-[280px]">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">₦</div>
                                                    <div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-black text-xl text-indigo-600">₦{req.unique_amount.toLocaleString()}</span>
                                                            <span className="text-[10px] font-bold text-gray-400">Crediting ₦{req.base_amount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-600 flex items-center gap-1.5 mt-0.5"><Users size={12} className="text-gray-300" /> {req.sender_name}</div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:w-auto">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] uppercase font-black text-gray-300 tracking-widest">Bank</p>
                                                        <p className="font-bold text-xs text-gray-600">{req.bank_name || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] uppercase font-black text-gray-300 tracking-widest">Proof</p>
                                                        {req.screenshot_id ? (
                                                            <button onClick={() => setSelectedScreenshot(req.screenshot_id)} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 hover:scale-105 transition-transform"><Plus size={12} /> View Screenshot</button>
                                                        ) : <span className="text-[10px] font-black text-gray-200 uppercase">No Proof</span>}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] uppercase font-black text-gray-300 tracking-widest">Date</p>
                                                        <p className="font-bold text-[10px] text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="lg:w-72 flex gap-3 w-full border-l border-black/5 pl-8">
                                                    {req.status === 'Awaiting Review' ? (
                                                        <>
                                                            <button onClick={() => handleRejectPayment(req._id)} className="flex-1 py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors text-xs">Reject</button>
                                                            <button onClick={() => handleApprovePayment(req._id)} className="flex-[2] py-3.5 bg-zinc-900 text-white font-bold rounded-2xl hover:scale-105 transition-transform text-xs shadow-lg shadow-black/10">Approve</button>
                                                        </>
                                                    ) : (
                                                        <div className="p-3 bg-zinc-50 rounded-xl w-full text-[10px] text-gray-500 italic">
                                                            <span className="font-black uppercase not-italic text-gray-300 mr-2">Note:</span>
                                                            {req.admin_note || "No administrative notes."}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ LISTING REVIEW ═══ */}
                        {activeTab === "user_listings" && (
                            <motion.div key="user_listings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="New Submissions" value={userListings.filter(l => l.status === 'Pending Review').length} icon={<Clock size={18} />} color="bg-amber-500" />
                                    <StatCard label="Active Listings" value={userListings.filter(l => l.status === 'Active').length} icon={<CheckCircle2 size={18} />} color="bg-emerald-500" />
                                    <StatCard label="Total Slots Listed" value={userListings.reduce((acc, l) => acc + (l.total_slots || 0), 0)} icon={<Layers size={18} />} color="bg-blue-500" />
                                    <StatCard label="Est. Monthly Rev" value={fmtCurrency(userListings.reduce((acc, l) => acc + ((l.slot_price || 0) * (l.total_slots || 0)), 0))} icon={<DollarSign size={18} />} color="bg-indigo-500" />
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {["All", "Pending Review", "Active", "Rejected"].map(s => (
                                        <button key={s} onClick={() => setListingFilterStatus(s)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-nowrap ${listingFilterStatus === s ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-gray-400 border border-black/5 hover:bg-zinc-50'}`}>{s}</button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    {userListings.length === 0 ? (
                                        <div className="bg-white border border-black/5 rounded-[3rem] p-20 text-center text-gray-400 uppercase font-black text-xs tracking-widest">
                                            No listings found in this category
                                        </div>
                                    ) : (
                                        userListings.map((listing: any) => (
                                            <div key={listing._id} className="bg-white border border-black/5 rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center gap-10 hover:shadow-xl transition-all shadow-sm relative overflow-hidden">
                                                {listing.status === 'Pending Review' && <div className="absolute top-0 left-0 w-2 h-full bg-amber-400" />}
                                                <div className="flex items-center gap-6 min-w-[280px]">
                                                    <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">{listing.platform[0]}</div>
                                                    <div>
                                                        <h3 className="font-black text-lg">{listing.platform}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-full">{listing.status}</span>
                                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                                                <Calendar size={12} /> {listing.renewal_date}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Credentials</p>
                                                        <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {listing.email}</p>
                                                        <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Lock size={12} className="text-gray-300" /> ••••••••</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pricing</p>
                                                        <p className="text-xs font-black text-indigo-600">₦{(listing.price_per_slot || 0).toLocaleString()} / Slot</p>
                                                        <p className="text-[10px] font-bold text-gray-400">Payout: ₦{(listing.owner_payout_amount || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="space-y-1 col-span-2">
                                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Owner</p>
                                                        <p className="text-xs font-bold text-gray-500 truncate">{(listing as any).owner_name || listing.owner_id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {listing.status === 'Pending Review' ? (
                                                        <>
                                                            <button onClick={() => handleOpenApproveListing(listing)} className="px-6 py-3.5 bg-zinc-900 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-2 text-xs shadow-lg shadow-black/10"><ShieldCheck size={18} /> Approve</button>
                                                            <button onClick={async () => {
                                                                if (!confirm("Reject this listing?")) return;
                                                                try {
                                                                    await rejectListingMut({ listing_id: listing._id, admin_id: currentUser!._id as any, admin_note: "Rejected by admin" });
                                                                    toast.success("Listing rejected");
                                                                } catch (e: any) { toast.error(e.message); }
                                                            }} className="p-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"><X size={18} /></button>
                                                        </>
                                                    ) : (
                                                        <div className="text-[10px] font-black text-gray-300 uppercase py-2.5 px-6 border border-black/5 rounded-2xl bg-zinc-50">Handled</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ NOTIFICATIONS ═══ */}
                        {activeTab === "notifications" && (
                            <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader title="Send Notifications" sub="Broadcast updates to all users or a specific individual" />
                                <div className="bg-white rounded-[2.5rem] p-8 border border-black/5 space-y-6 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                                            <select
                                                value={notifForm.userId}
                                                onChange={e => setNotifForm({ ...notifForm, userId: e.target.value })}
                                                className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm appearance-none"
                                            >
                                                <option value="">All Users (Broadcast)</option>
                                                {allUsers.map((u: any) => (
                                                    <option key={u._id} value={u._id}>{u.full_name} ({u.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notification Type</label>
                                            <select
                                                value={notifForm.type}
                                                onChange={e => setNotifForm({ ...notifForm, type: e.target.value })}
                                                className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm appearance-none"
                                            >
                                                <option value="system">System Update</option>
                                                <option value="promotion">Promotion / Deal</option>
                                                <option value="alert">Critical Security Alert</option>
                                                <option value="subscription">Subscription Update</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                                        <input
                                            placeholder="e.g. Netflix Price Update"
                                            value={notifForm.title}
                                            onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                                            className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
                                        <textarea
                                            placeholder="Details of the update..."
                                            value={notifForm.message}
                                            onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                                            rows={4}
                                            className="w-full p-4 bg-[#f8f9fa] rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendNotification}
                                        className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-base hover:scale-[1.01] transition-transform shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                                    >
                                        <Zap size={20} className="text-yellow-400" /> Send Notification
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ LEAVE REQUESTS ═══ */}
                        {activeTab === "leave_requests" && (
                            <motion.div key="leave_requests" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                                <SectionHeader title="Leave Requests" sub="Approve users wanting to cancel or leave subscriptions" />

                                <div className="grid grid-cols-1 gap-4">
                                    {(pendingLeaveRequests.slots.length === 0 && pendingLeaveRequests.migrations.length === 0) ? (
                                        <div className="bg-white rounded-[3rem] p-20 text-center text-gray-400 uppercase font-black text-xs tracking-widest border border-dashed border-black/10">
                                            No pending leave requests
                                        </div>
                                    ) : (
                                        <>
                                            {/* Legacy Migrations */}
                                            {pendingLeaveRequests.migrations.map((req: any) => (
                                                <div key={req._id} className="bg-white border border-black/5 rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center gap-6 hover:shadow-xl transition-all shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-2 h-full bg-red-400" />
                                                    <div className="flex items-center gap-4 min-w-[280px]">
                                                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-xl">
                                                            <UserMinus size={24} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-black text-base truncate">{req.user_name}</h3>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Legacy</span>
                                                                <span className="text-[10px] font-bold text-gray-600 truncate">{req.user_email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Platform</div>
                                                            <div className="text-sm font-bold">{req.subscription_name}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Account Email</div>
                                                            <div className="text-sm font-bold truncate">{req.account_email}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Status</div>
                                                            <div className="text-sm font-bold text-amber-600">Leaving</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApproveLeave(req._id, "migration")}
                                                            className="px-6 py-3.5 bg-zinc-900 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-2 text-xs shadow-lg shadow-black/10"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Approve Exit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Standard Slots */}
                                            {pendingLeaveRequests.slots.map((req: any) => (
                                                <div key={req._id} className="bg-white border border-black/5 rounded-[2.5rem] p-6 flex flex-col lg:flex-row items-center gap-6 hover:shadow-xl transition-all shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-400" />
                                                    <div className="flex items-center gap-4 min-w-[280px]">
                                                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xl">
                                                            <UserMinus size={24} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-black text-base truncate">{req.user_name}</h3>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Slot</span>
                                                                <span className="text-[10px] font-bold text-gray-600 truncate">{req.user_email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Subscription</div>
                                                            <div className="text-sm font-bold truncate">{req.sub_name}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Slot Type</div>
                                                            <div className="text-sm font-bold truncate">{req.slot_name}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Price</div>
                                                            <div className="text-sm font-bold text-emerald-600">₦{req.price?.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Renewal</div>
                                                            <div className="text-sm font-bold">{req.renewal_date ? new Date(req.renewal_date).toLocaleDateString() : 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApproveLeave(req._id, "slot")}
                                                            className="px-6 py-3.5 bg-zinc-900 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-2 text-xs shadow-lg shadow-black/10"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Approve Exit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
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
                            <div className="sticky top-0 z-10 bg-white px-10 pt-10 pb-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create New Listing</h2>
                                        <p className="text-sm text-gray-500 mt-1">Add a premium subscription account to the catalog</p>
                                    </div>
                                    <button onClick={() => setShowListingModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                {/* Account Info */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 shadow-sm">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em] text-gray-400">
                                        <div className="w-1.5 h-6 bg-black rounded-full" /> Account Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Subscription Platform</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Netflix Premium"
                                                value={listingData.platform_name}
                                                onChange={e => setListingData({ ...listingData, platform_name: e.target.value })}
                                                className="w-full p-4.5 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none focus:ring-2 ring-black transition-all text-sm"
                                            />
                                        </div>

                                        {/* Category Connector Pills */}
                                        <div className="space-y-3 md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                                                <Tag size={12} /> Marketplace Category
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Streaming', 'Music', 'Design', 'AI', 'Productivity', 'Gaming', 'VPN', 'Software', 'Utility', 'Education'].map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setListingData({ ...listingData, category: cat })}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${listingData.category === cat
                                                            ? 'bg-black text-white border-black shadow-md'
                                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Renewal Date</label>
                                            <input
                                                type="date"
                                                value={listingData.admin_renewal_date}
                                                onChange={e => setListingData({ ...listingData, admin_renewal_date: e.target.value })}
                                                className="w-full p-4.5 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none focus:ring-2 ring-black transition-all text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Account Email</label>
                                            <input
                                                type="email"
                                                placeholder="account@email.com"
                                                value={listingData.account_email}
                                                onChange={e => setListingData({ ...listingData, account_email: e.target.value })}
                                                className="w-full p-4.5 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none focus:ring-2 ring-black transition-all text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Password</label>
                                            <input
                                                type="text"
                                                placeholder="••••••••"
                                                value={listingData.account_password}
                                                onChange={e => setListingData({ ...listingData, account_password: e.target.value })}
                                                className="w-full p-4.5 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none focus:ring-2 ring-black transition-all text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Provider Tag</label>
                                            <input
                                                placeholder="e.g. JoinTheQ"
                                                value={listingData.plan_owner}
                                                onChange={e => setListingData({ ...listingData, plan_owner: e.target.value })}
                                                className="w-full p-4.5 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none focus:ring-2 ring-black transition-all text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Base Subscription Cost (₦)</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={listingData.base_cost === 0 ? "" : listingData.base_cost}
                                                    onChange={e => setListingData({ ...listingData, base_cost: Number(e.target.value) })}
                                                    className="w-full py-4.5 pl-10 pr-6 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none focus:ring-2 ring-black transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">Member Instructions</label>
                                            <textarea
                                                placeholder="Detailed steps for members to access this account..."
                                                value={listingData.instructions_text}
                                                onChange={e => setListingData({ ...listingData, instructions_text: e.target.value })}
                                                className="w-full p-4.5 bg-gray-50 border border-gray-100 rounded-xl font-medium outline-none focus:ring-2 ring-black transition-all text-sm min-h-[100px] resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Slot Varieties */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 pb-6 border-b border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-bold text-gray-900 uppercase text-[10px] tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" /> Slot Varieties
                                            </h3>
                                            {/* Profitability Tracker */}
                                            <div className="flex gap-2">
                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 ${listingData.slots.reduce((sum, s) => sum + (s.price * (s.capacity || 1)), 0) > listingData.base_cost
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-red-50 text-red-500 border border-red-100'
                                                    }`}>
                                                    <AlertCircle size={12} />
                                                    Profit: ₦{(listingData.slots.reduce((sum, s) => sum + (s.price * (s.capacity || 1)), 0) - listingData.base_cost).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setListingData({
                                                ...listingData,
                                                slots: [...listingData.slots, { name: "", price: 0, capacity: 1, access_type: "code_access", downloads_enabled: true }]
                                            })}
                                            className="text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-100 px-5 py-2.5 rounded-xl border border-gray-100 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={14} /> Add Variety
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
                                    disabled={isCreatingListing || !listingData.platform_name || !listingData.account_email || !listingData.plan_owner || !listingData.admin_renewal_date}
                                    className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-base hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10"
                                >
                                    {isCreatingListing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🚀 Confirm & Publish to Marketplace'}
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

            {/* ── Invite Admin Modal ── */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black">Invite Admin</h2>
                                    <p className="text-xs text-gray-400 mt-1">They will receive an invitation link — valid 48 hours</p>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="w-9 h-9 bg-zinc-100 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform"><X size={16} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black mb-1.5 text-gray-600">Email Address</label>
                                    <input type="email" placeholder="jane@company.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-zinc-900/20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black mb-1.5 text-gray-600">Work Username</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-black/8 rounded-2xl">
                                        <span className="text-gray-400 font-bold">@</span>
                                        <input type="text" placeholder="support_jane" value={inviteForm.work_username} onChange={e => setInviteForm(f => ({ ...f, work_username: e.target.value.toLowerCase().replace(/\s/g, "_") }))} className="flex-1 bg-transparent text-sm font-bold outline-none" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Format: role_name e.g. support_jane, ops_mike, finance_david</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black mb-1.5 text-gray-600">Admin Role</label>
                                    <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-zinc-900/20">
                                        <option value="support">Support Admin — Tickets & user issues</option>
                                        <option value="operations">Operations Admin — Marketplace & subscriptions</option>
                                        <option value="finance">Finance Admin — Payments & withdrawals</option>
                                        <option value="campaigns">Campaign Admin — Campaigns & campus</option>
                                    </select>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                                    <p className="text-xs text-amber-700 font-bold">⚠️ Invitation link expires in 48 hours. The admin sets their password on first login.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!inviteForm.email || !inviteForm.work_username) return toast.error("Fill all fields");
                                        try {
                                            const result = await createInviteMut({ email: inviteForm.email, role: inviteForm.role, work_username: inviteForm.work_username, invited_by: currentUser!._id });
                                            navigator.clipboard.writeText(result.invite_link);
                                            toast.success("Invitation created! Link copied 🔗");
                                            setShowInviteModal(false);
                                            setInviteForm({ email: "", role: "support", work_username: "" });
                                        } catch (e: any) { toast.error(e.message); }
                                    }}
                                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black hover:scale-[1.01] transition-transform"
                                >Send Invitation</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create Task Modal ── */}
            <AnimatePresence>
                {showTaskModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black">Assign Task</h2>
                                    <p className="text-xs text-gray-400 mt-1">The admin will be notified immediately</p>
                                </div>
                                <button onClick={() => setShowTaskModal(false)} className="w-9 h-9 bg-zinc-100 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform"><X size={16} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black mb-1.5 text-gray-600">Task Title *</label>
                                    <input type="text" placeholder="Review suspicious referrals" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-zinc-900/20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black mb-1.5 text-gray-600">Description</label>
                                    <textarea placeholder="What needs to be done, and how..." value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-zinc-900/20 resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-black mb-1.5 text-gray-600">Assign To *</label>
                                        <select value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full px-3 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-bold outline-none">
                                            <option value="">Select admin...</option>
                                            {(workforceAdmins as any[]).filter((a: any) => a._id !== currentUser?._id).map((a: any) => (
                                                <option key={a._id} value={a._id}>@{a.work_username ?? a.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black mb-1.5 text-gray-600">Priority</label>
                                        <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-bold outline-none">
                                            <option value="low">🟢 Low</option>
                                            <option value="medium">🟡 Medium</option>
                                            <option value="high">🟠 High</option>
                                            <option value="urgent">🔴 Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-black mb-1.5 text-gray-600">Deadline *</label>
                                        <input type="date" value={taskForm.deadline} min={new Date().toISOString().split("T")[0]} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-bold outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black mb-1.5 text-gray-600">Category</label>
                                        <select value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-3 bg-zinc-50 border border-black/8 rounded-2xl text-sm font-bold outline-none">
                                            <option value="general">General</option>
                                            <option value="support">Support</option>
                                            <option value="operations">Operations</option>
                                            <option value="finance">Finance</option>
                                            <option value="campaigns">Campaigns</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!taskForm.title || !taskForm.assigned_to || !taskForm.deadline) return toast.error("Fill title, assignee, and deadline");
                                        try {
                                            await createTaskMut({
                                                title: taskForm.title,
                                                description: taskForm.description || undefined,
                                                assigned_to: taskForm.assigned_to as Id<"users">,
                                                assigned_by: currentUser!._id,
                                                deadline: new Date(taskForm.deadline).getTime(),
                                                priority: taskForm.priority,
                                                category: taskForm.category,
                                            });
                                            toast.success("Task assigned! Admin notified 📋");
                                            setShowTaskModal(false);
                                            setTaskForm({ title: "", description: "", assigned_to: "", deadline: "", priority: "medium", category: "general" });
                                        } catch (e: any) { toast.error(e.message); }
                                    }}
                                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black hover:scale-[1.01] transition-transform"
                                >Assign Task</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Screenshot Modal (Payments) ── */}
            <AnimatePresence>
                {selectedScreenshot && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setSelectedScreenshot(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="absolute top-6 right-6 z-10 text-white">
                                <button onClick={() => setSelectedScreenshot(null)} className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full"><X size={24} /></button>
                            </div>
                            <img src={`https://aromatic-ox-169.eu-west-1.convex.site/api/storage/${selectedScreenshot}`} alt="Transfer Proof" className="w-full h-full object-contain bg-zinc-900" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Listing Verification Modal ── */}
            <AnimatePresence>
                {selectedReviewListing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setSelectedReviewListing(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white max-w-lg w-full rounded-[3rem] p-10 relative z-10 shadow-2xl">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">{selectedReviewListing.platform?.[0] || 'S'}</div>
                                <div>
                                    <h2 className="text-xl font-black">Approve {selectedReviewListing.platform || 'Subscription'}</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verify & Set Payouts</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Slots</label>
                                        <input type="number" value={reviewTotalSlots} onChange={(e) => setReviewTotalSlots(Number(e.target.value))} className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 font-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Price / Slot (₦)</label>
                                        <input type="number" value={reviewPricePerSlot} onChange={(e) => setReviewPricePerSlot(Number(e.target.value))} className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 font-black" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-center py-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Monthly Owner Payout (₦)</label>
                                    <input type="number" value={reviewOwnerPayout} onChange={(e) => setReviewOwnerPayout(Number(e.target.value))} className="w-full bg-transparent border-none text-center text-3xl font-black text-indigo-600 outline-none" />
                                    <p className="text-[10px] font-bold text-indigo-400">Total Marketplace Rev: ₦{(reviewTotalSlots * reviewPricePerSlot).toLocaleString()}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Admin Note</label>
                                    <textarea placeholder="Internal notes..." value={reviewAdminNote} onChange={(e) => setReviewAdminNote(e.target.value)} className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm font-medium h-24" />
                                </div>
                                <button onClick={handleApproveListingSubmit} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"><ShieldCheck size={20} /> Verify & Launch Listing</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Reset Wallets Confirmation Modal ── */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-4 border-red-500">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-red-600">⚠️ Confirm Wallet Reset</h2>
                                    <p className="text-xs text-gray-400 mt-1">This action is IRREVERSIBLE</p>
                                </div>
                                <button onClick={() => setShowResetConfirm(false)} className="w-9 h-9 bg-zinc-100 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform"><X size={16} /></button>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                    <p className="text-sm font-bold text-red-800 mb-2">This will:</p>
                                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                                        <li>Set ALL user wallet balances to ₦0</li>
                                        <li>Clear all score history</li>
                                        <li>Delete ALL wallet transactions</li>
                                        <li>Delete ALL funding requests</li>
                                    </ul>
                                    <p className="text-xs text-red-600 font-bold mt-3">✓ Boots balances and history are NOT affected</p>
                                </div>
                                <p className="text-xs text-gray-500 font-bold">
                                    Type "CONFIRM RESET" to proceed:
                                </p>
                                <input
                                    type="text"
                                    placeholder="CONFIRM RESET"
                                    id="resetConfirmInput"
                                    className="w-full px-4 py-3 bg-zinc-50 border border-red-300 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-red-500"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    const input = (document.getElementById('resetConfirmInput') as HTMLInputElement)?.value;
                                    if (input !== 'CONFIRM RESET') {
                                        return toast.error('Type "CONFIRM RESET" exactly to proceed');
                                    }
                                    try {
                                        const result = await resetAllWalletsMut({ executed_by: currentUser!._id });
                                        toast.success(`Wallets reset! ${result.users_reset} users, ${result.transactions_cleared} transactions cleared`);
                                        setShowResetConfirm(false);
                                    } catch (e: any) {
                                        toast.error(e.message);
                                    }
                                }}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-colors"
                            >
                                Yes, Reset All Wallets
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-zinc-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0">
                                        {selectedUser.full_name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-black truncate">{selectedUser.full_name}</h2>
                                        <p className="text-sm font-medium text-gray-500 truncate">{selectedUser.email} {selectedUser.phone ? `· ${selectedUser.phone}` : ''} {selectedUser.username && `· @${selectedUser.username}`}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-black transition-colors border border-black/5 flex-shrink-0">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* Status Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-zinc-50 p-4 rounded-2xl">
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Status</div>
                                        <div className="font-bold text-sm">
                                            {selectedUser.is_banned ? <span className="text-red-500">Banned</span> : selectedUser.is_suspended ? <span className="text-amber-500">Suspended</span> : <span className="text-emerald-500">Active</span>}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-2xl">
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Joined</div>
                                        <div className="font-bold text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-2xl">
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Wallet</div>
                                        <div className="font-bold text-sm text-emerald-600">{fmtCurrency(selectedUser.wallet_balance || 0)}</div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-2xl">
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">BOOTS</div>
                                        <div className="font-bold text-sm text-amber-500">{(selectedUser.boots_balance || 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Activity */}
                                <div className="grid grid-cols-3 gap-4 border-t border-black/5 pt-6">
                                    <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-2xl font-black">{selectedUser.q_score || 0}</div>
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Q Score</div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-2xl font-black text-purple-600">{selectedUser.activeSubscriptions || 0}</div>
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Active Subs</div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-lg font-black text-emerald-600">{fmtCurrencyShort(selectedUser.totalPayments || 0)}</div>
                                        <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Total Paid</div>
                                    </div>
                                </div>

                                {/* Subscriptions List */}
                                <div className="border-t border-black/5 pt-6">
                                    <div className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Active Plan Slots</div>
                                    <div className="space-y-3">
                                        {selectedUserSlots.map((m: any, i: number) => (
                                            <div key={`${m._id || i}`} className="bg-white border border-black/5 p-4 rounded-2xl flex justify-between items-center hover:bg-black/[0.01]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-black">
                                                        {m.sub_name?.[0] || m.slot_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{m.sub_name || "Unknown"}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold">{m.slot_name || "Unknown Slot"}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-0.5">Renews</div>
                                                    <div className="text-xs font-bold">{m.renewal_date ? new Date(m.renewal_date).toLocaleDateString() : 'N/A'}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedUserSlots.length === 0 && (
                                            <div className="text-center py-6 text-gray-400 bg-zinc-50 rounded-2xl">
                                                <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                                                <div className="text-sm font-bold">No active subscriptions</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* God Mode Modal */}
            <AnimatePresence>
                {showGodModeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGodModeModal(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                        <Sparkles size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">God Mode</h2>
                                        <p className="text-sm text-white/80">Advanced user management</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowGodModeModal(false)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* User Info */}
                                <div className="bg-zinc-50 p-5 rounded-3xl border border-black/5">
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Target User</div>
                                    <div className="font-bold text-lg">
                                        {allUsers.find(u => u._id === godModeUserId)?.full_name || "Unknown"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {allUsers.find(u => u._id === godModeUserId)?.email}
                                    </div>
                                </div>

                                {/* Action Tabs */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-3xl border border-purple-100">
                                        <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center mb-3">
                                            <UserPlus size={20} />
                                        </div>
                                        <div className="font-bold text-sm mb-1">Assign to Slot</div>
                                        <div className="text-xs text-gray-500 mb-3">Add user to subscription</div>
                                        <select
                                            value={selectedSlotForAssignment || ""}
                                            onChange={(e) => setSelectedSlotForAssignment(e.target.value as Id<"slot_types">)}
                                            className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-purple-500"
                                        >
                                            <option value="">Select slot type...</option>
                                            {allSubscriptions.map((group: any) =>
                                                group.slot_types.map((st: any) => (
                                                    <option key={st._id} value={st._id}>
                                                        {st.name} - ₦{st.price.toLocaleString()}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <button
                                            onClick={handleAssignUserToSlot}
                                            disabled={!selectedSlotForAssignment}
                                            className="w-full mt-2 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
                                        >
                                            Assign Now
                                        </button>
                                    </div>

                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border border-amber-100">
                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-3">
                                            <CreditCard size={20} />
                                        </div>
                                        <div className="font-bold text-sm mb-1">Override Payment</div>
                                        <div className="text-xs text-gray-500 mb-3">Mark as PAID/FAILED</div>
                                        <select
                                            value={overridePaymentStatus}
                                            onChange={(e) => setOverridePaymentStatus(e.target.value)}
                                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-amber-500 mb-2"
                                        >
                                            <option value="filled">PAID</option>
                                            <option value="pending">PENDING</option>
                                            <option value="failed">FAILED</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Reason (required)"
                                            value={overrideReason}
                                            onChange={(e) => setOverrideReason(e.target.value)}
                                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-amber-500 mb-2"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Override amount (optional)"
                                            value={overrideAmount}
                                            onChange={(e) => setOverrideAmount(e.target.value)}
                                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-amber-500"
                                        />
                                    </div>

                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl border border-emerald-100">
                                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center mb-3">
                                            <Clock size={20} />
                                        </div>
                                        <div className="font-bold text-sm mb-1">Add to Waitlist</div>
                                        <div className="text-xs text-gray-500 mb-3">Queue for next slot</div>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleAddToWaitlist(e.target.value as Id<"subscription_catalog">);
                                                    e.target.value = "";
                                                }
                                            }}
                                            className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500"
                                        >
                                            <option value="">Select subscription...</option>
                                            {allSubscriptions.map((group: any) => (
                                                <option key={group._id} value={group.subscription_catalog_id || group._id}>
                                                    {group.subscription_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-3xl border border-blue-100">
                                        <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-3">
                                            <Activity size={20} />
                                        </div>
                                        <div className="font-bold text-sm mb-1">Quick Actions</div>
                                        <div className="text-xs text-gray-500 mb-3">User management</div>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => {
                                                    if (godModeUserId) {
                                                        setSelectedUser(allUsers.find(u => u._id === godModeUserId) || null);
                                                        setShowGodModeModal(false);
                                                    }
                                                }}
                                                className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors"
                                            >
                                                View Full Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    toast.success("Feature: Move to group coming soon");
                                                }}
                                                className="w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
                                            >
                                                Move to Group
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                                    <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-amber-800 text-sm">God Mode Actions are Logged</div>
                                        <div className="text-xs text-amber-700 mt-1">
                                            All actions taken in God mode are recorded in the activity logs with your admin ID, timestamp, and reason. Use responsibly.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
