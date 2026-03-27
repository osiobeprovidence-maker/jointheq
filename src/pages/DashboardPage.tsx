
import React, { useState, useEffect, ChangeEvent, Key, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Zap,
    TrendingUp,
    ShieldCheck,
    ChevronRight,
    ShoppingBag,
    Plus,
    Wallet,
    Sparkles,
    Trophy,
    Check,
    Gift,
    Rocket,
    Users,
    Activity,
    AlertCircle,
    Calendar,
    Settings,
    Shield,
    User as UserIcon,
    LogOut,
    X,
    Mail,
    Phone,
    Clock,
    Smartphone,
    Laptop,
    Monitor,
    Trash2,
    MessageCircle,
    ImageIcon,
    Send,
    ChevronLeft,
    MoreVertical,
    Info,
    CheckCircle2,
    Copy,
    ExternalLink as LinkIcon,
    Award,
    TrendingUp as ChartIcon,
    DollarSign,
    Users as TeamIcon,
    Target,
    Edit,
    BadgeDollarSign,
    Bell,
    Repeat
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";
import { UserSlot, SlotType } from "../types";
import toast from "react-hot-toast";
import SupportChatUser from "../components/chat/SupportChatUser";
import { fmtCurrency, fmtCurrencyShort } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import CampusJoinCard from "../components/campus/CampusJoinCard";
import CampusApplicationModal from "../components/campus/CampusApplicationModal";

export default function DashboardPage() {
    const navigate = useNavigate();
    const recommendedAvatars = [
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Nova",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Rex",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna"
    ];
    const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'wallet' | 'referrals' | 'history' | 'campaigns' | 'profile' | 'support' | 'notifications'>('dashboard');
    const [useBootsForPayment, setUseBootsForPayment] = useState(false);
    const [enableAutoDebit, setEnableAutoDebit] = useState(false);
    const [checkoutSlot, setCheckoutSlot] = useState<SlotType | null>(null);
    const [showVerificationWarning, setShowVerificationWarning] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const user = auth.getCurrentUser();

    // Check for verification warning on mount
    useEffect(() => {
        const storedDays = localStorage.getItem('verification_days_remaining');
        const userData = auth.getCurrentUser();

        if (storedDays && userData && !userData.is_verified) {
            setDaysRemaining(parseInt(storedDays, 10));
            setShowVerificationWarning(true);
        }
    }, []);

    // Convex Real-time Queries
    const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as Id<"users"> } : "skip");
    const subscriptions = useQuery(api.subscriptions.getActiveSubscriptions) || [];
    const activeSlots = useQuery(api.subscriptions.getSlotsByUserId, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const campaigns = useQuery(api.campaigns.list) || [];
    const devices = useQuery(api.devices.listByUserId, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const chatUsers = useQuery(api.users.list) || [];
    const invitedUsers = useQuery(api.users.getInvitedUsers, currentUser ? { userId: currentUser._id } : "skip") || [];
    const referrer = useQuery(api.users.getById, currentUser?.referred_by ? { id: currentUser.referred_by } : "skip");
    const adminsList = useQuery(api.users.getAdmins) || [];

    // Sync local auth with Convex state
    useEffect(() => {
        if (currentUser) {
            auth.login(currentUser as any);
        }
    }, [currentUser]);
    const adminMarketplace = useQuery(api.subscriptions.getAdminMarketplace) || [];
    const campusRepInfo = useQuery(api.users.getCampusRep, currentUser ? { userId: currentUser._id } : "skip");
    const transactions = useQuery(api.transactions.getTransactions, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const manualRequests = useQuery(api.funding.getUserManualRequests, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const notifications = useQuery(api.notifications.list, currentUser ? { user_id: currentUser._id } : "skip") || [];

    // State for forms
    const [selectedChatUserId, setSelectedChatUserId] = useState<Id<"users"> | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('Phone');
    const [chatInput, setChatInput] = useState('');
    const [chatImage, setChatImage] = useState<string | null>(null);
    const [newPhone, setNewPhone] = useState('');
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
    const [adminInviteEmail, setAdminInviteEmail] = useState('');
    const [showListingModal, setShowListingModal] = useState(false);
    const [listingData, setListingData] = useState({
        subscription_id: '',
        account_email: '',
        plan_owner: '',
        admin_renewal_date: '',
        slots: [{ name: '', price: 0, capacity: 1, access_type: 'code_access', downloads_enabled: true }]
    });
    const [isCreatingListing, setIsCreatingListing] = useState(false);
    const [campusModalOpen, setCampusModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Wallet State
    const [fundAmount, setFundAmount] = useState<string>('');
    const [bootsModalOpen, setBootsModalOpen] = useState(false);

    const handleFundSubmit = () => {
        navigate('/fund-wallet');
    };

    const messagesUserId = currentUser?.is_admin ? (selectedChatUserId || currentUser._id) : currentUser?._id;
    const messages = useQuery(api.messages.getMessages, messagesUserId ? { user_id: messagesUserId } : "skip") || [];

    // Mutations
    const joinSlotMutation = useMutation(api.subscriptions.joinSlot);
    const sendMessageMutation = useMutation(api.messages.sendMessage);
    const addTransactionMutation = useMutation(api.transactions.addTransaction);
    const addDeviceMutation = useMutation(api.devices.addDevice);
    const removeDeviceMutation = useMutation(api.devices.removeDevice);
    const updatePhoneMutation = useMutation(api.users.updatePhone);
    const updateAllocationMutation = useMutation(api.subscriptions.updateAllocation);
    const leaveSlotMutation = useMutation(api.subscriptions.leaveSlot);
    const resetQScoresMutation = useMutation(api.users.resetQScores);
    const seedMarketplaceMutation = useMutation(api.subscriptions.seedMarketplace);
    const participateInCampaignMutation = useMutation(api.campaigns.participate);
    const createCampaignMutation = useMutation(api.campaigns.create);
    const updateCampaignStatusMutation = useMutation(api.campaigns.updateStatus);
    const seedCampaignsMutation = useMutation(api.campaigns.seedDummy);
    const makeAdminMutation = useMutation(api.users.makeAdmin);
    const removeAdminMutation = useMutation(api.users.removeAdmin);
    const adminCreateListingMutation = useMutation(api.subscriptions.adminCreateListing);
    const updateCardMutation = useMutation(api.users.updateCard);
    const removeCardMutation = useMutation(api.users.removeCard);
    const updateUsernameMutation = useMutation(api.users.updateUsername);
    const updateProfileMutation = useMutation(api.users.updateProfile);
    const initializeSuperAdminMut = useMutation(api.users.initializeSuperAdmin);
    const renewSlotMutation = useMutation(api.subscriptions.renewSlot);
    const toggleAutoRenewMutation = useMutation(api.subscriptions.toggleAutoRenew);
    const markAsReadMutation = useMutation(api.notifications.markAsRead);
    const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
    const removeNotificationMutation = useMutation(api.notifications.remove);

    const walletResetPermission = useQuery(
        api.users.canResetWallets,
        currentUser?._id ? { user_id: currentUser._id } : "skip"
    );

    // Username edit state
    const [editingUsername, setEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [fullNameInput, setFullNameInput] = useState('');
    const [universityInput, setUniversityInput] = useState('');
    const [profileImagePreview, setProfileImagePreview] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [cancellingSlot, setCancellingSlot] = useState<{ id: string, name: string } | null>(null);
    const [lastNotifId, setLastNotifId] = useState<string | null>(null);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');


    const handleProfileImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const maxSizeBytes = 2 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            toast.error("Image too large. Max size is 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImagePreview((reader.result as string) || "");
        };
        reader.readAsDataURL(file);
    };

    const handleCreateListing = async () => {
        if (isCreatingListing) return;
        setIsCreatingListing(true);
        try {
            const selectedSub = subscriptions.find(s => s._id === listingData.subscription_id);
            if (!selectedSub && !listingData.subscription_id) return toast.error("Please select a platform");
            const normalizedPlanOwner = listingData.plan_owner.trim().replace(/^@+/, "") || "admin";

            // Generate a short unique request id to send to the backend for idempotency
            (window as any).__listingRequestId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

            await adminCreateListingMutation({
                platform_name: selectedSub ? selectedSub.name : listingData.subscription_id,
                account_email: listingData.account_email,
                plan_owner: normalizedPlanOwner,
                admin_renewal_date: listingData.admin_renewal_date,
                slot_types: listingData.slots,
                request_id: (window as any).__listingRequestId || undefined,
            });
            toast.success("Listing created successfully!");
            setShowListingModal(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to create listing");
        } finally {
            setIsCreatingListing(false);
        }
    };

    const handleMakeAdmin = async () => {
        if (!currentUser || !adminInviteEmail) return;
        try {
            await makeAdminMutation({ email: adminInviteEmail, executorId: currentUser._id });
            setAdminInviteEmail('');
            toast.success("Admin added successfully");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRemoveAdmin = async (adminId: Id<"users">) => {
        if (!currentUser) return;
        try {
            await removeAdminMutation({ userId: adminId, executorId: currentUser._id });
            toast.success("Admin removed successfully");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getRank = (score: number) => {
        if (score >= 1000) return 'Elite';
        if (score >= 600) return 'Pro';
        if (score >= 300) return 'Trusted';
        if (score >= 100) return 'Explorer';
        return 'Rookie';
    };

    const fundWallet = async (amount: number) => {
        if (!currentUser) return;
        try {
            await addTransactionMutation({
                user_id: currentUser._id,
                amount,
                type: 'funding',
                description: 'Wallet funding'
            });
        } catch (error) {
            console.error("Error funding wallet:", error);
        }
    };

    // Auto-initialize super admin for authorized emails
    useEffect(() => {
        const authorizedAdmins = ["riderezzy@gmail.com", "reinvoursehung@gmail.com"];
        if (currentUser?.email && authorizedAdmins.includes(currentUser.email) &&
            walletResetPermission !== undefined && walletResetPermission.role !== "super") {
            initializeSuperAdminMut({}).then(() => {
                toast.success("Super admin initialized! Refreshing...");
                setTimeout(() => {
                    // Force re-fetch user data or just reload
                    window.location.reload();
                }, 1500);
            }).catch(e => console.log("Init already done or error:", e.message));
        }
    }, [currentUser, walletResetPermission, initializeSuperAdminMut]);

    useEffect(() => {
        if (activeTab === 'notifications' && currentUser) {
            markAllAsReadMutation({ user_id: currentUser._id }).catch(console.error);
        }
    }, [activeTab, currentUser, markAllAsReadMutation]);

    const joinSlot = async (slotTypeId: string) => {
        if (!currentUser) return;
        try {
            const result = await joinSlotMutation({
                user_id: currentUser._id,
                slot_type_id: slotTypeId as Id<"slot_types">,
                use_boots: useBootsForPayment,
                auto_renew: enableAutoDebit
            });
            if (result.success) {
                toast.success("Successfully joined slot!");
                if (enableAutoDebit) {
                    toast.success("Auto-renewal enabled!");
                }
                setCheckoutSlot(null);
                setEnableAutoDebit(false);
                setActiveTab('dashboard');
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to join slot");
        }
    };

    const sendMessage = async () => {
        if (!currentUser || (!chatInput && !chatImage)) return;
        try {
            await sendMessageMutation({
                sender_id: currentUser._id,
                receiver_id: currentUser.is_admin ? selectedChatUserId || undefined : undefined,
                content: chatInput,
                image_data: chatImage || undefined,
                is_from_admin: currentUser.is_admin
            });
            setChatInput('');
            setChatImage(null);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const addDevice = async () => {
        if (!currentUser || !newDeviceName) return;
        try {
            await addDeviceMutation({
                user_id: currentUser._id,
                name: newDeviceName,
                type: newDeviceType
            });
            setNewDeviceName('');
        } catch (error) {
            console.error("Error adding device:", error);
        }
    };

    const deleteDevice = async (id: string) => {
        try {
            await removeDeviceMutation({ id: id as Id<"devices"> });
        } catch (error) {
            console.error("Error deleting device:", error);
        }
    };

    // Notification Permission & Watcher
    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            toast.error("Browser does not support desktop notifications");
            return;
        }

        const permission = await Notification.requestPermission();
        setNotifPermission(permission);

        if (permission === "granted") {
            toast.success("Notifications enabled!", { icon: '🔔' });
            // Show a test notification
            new Notification("Notifications Enabled", {
                body: "You will now receive real-time updates from JoinTheQ.",
                icon: "/logo.png"
            });
        } else if (permission === "denied") {
            toast.error("Notification permission denied");
        }
    };

    // Initialize notification permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotifPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        if (notifications.length > 0 && notifPermission === 'granted') {
            const latest = notifications[0];
            // Only notify if unread and we haven't shown it yet
            if (!latest.is_read && latest._id !== lastNotifId) {
                // Throttle/check to avoid spam if multiple arrive
                new Notification(latest.title, {
                    body: latest.message,
                    icon: "/logo.png"
                });
                setLastNotifId(latest._id);
            }
        }
    }, [notifications, notifPermission, lastNotifId]);

    const updatePhone = async () => {
        if (!currentUser || !newPhone) return;
        setIsUpdatingPhone(true);
        try {
            await updatePhoneMutation({ id: currentUser._id, phone: newPhone });
            setNewPhone('');
            toast.success("Phone number updated!");
        } catch (error) {
            console.error("Error updating phone:", error);
            toast.error("Error updating phone");
        } finally {
            setIsUpdatingPhone(false);
        }
    };

    const updateAllocation = async (slotId: string, val: string) => {
        try {
            await updateAllocationMutation({ id: slotId as Id<"subscription_slots">, allocation: val });
        } catch (error) {
            console.error("Error updating allocation:", error);
        }
    };

    const handleLeaveSlot = async (id: string, name: string) => {
        setCancellingSlot({ id, name });
    };

    const confirmLeaveSlot = async () => {
        if (!cancellingSlot) return;
        try {
            await leaveSlotMutation({ id: cancellingSlot.id as any });
            toast.success(`Successfully left ${cancellingSlot.name} subscription`);
            setCancellingSlot(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to leave subscription");
        }
    };

    const handleRenew = async (slotId: string) => {
        try {
            await renewSlotMutation({ id: slotId as Id<"subscription_slots"> });
            toast.success("Subscription renewed successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to renew subscription");
        }
    };

    const handleToggleAutoRenew = async (slotId: string, val: boolean) => {
        try {
            await toggleAutoRenewMutation({ id: slotId as any, auto_renew: val });
            toast.success(`Auto-renewal ${val ? 'enabled' : 'disabled'}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to update auto-renewal");
        }
    };



    const resetQRank = async () => {
        if (!currentUser) return;
        if (confirm("Setting Q Score to 100 will reset your premium eligibility. Continue?")) {
            try {
                await resetQScoresMutation({ userId: currentUser._id });
                toast.success("Q Rank reset to 100 successfully!");
            } catch (error) {
                console.error("Error resetting Q rank:", error);
                toast.error("Error resetting Q rank");
            }
        }
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setChatImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (currentUser === undefined) {
        return (
            <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-black border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <MainLayout
            activeTab={activeTab}
            setActiveTab={(tab: string) => {
                if (tab === 'admin') {
                    navigate('/admin');
                    return;
                }
                if (tab === 'migrate') {
                    navigate('/migrate');
                    return;
                }
                setActiveTab(tab as typeof activeTab);
            }}
            qScore={currentUser?.q_score || 0}
        >
            {/* Verification Warning Banner */}
            {showVerificationWarning && daysRemaining !== null && daysRemaining > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-[2rem] p-4 mb-6 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800">Verify your email</p>
                            <p className="text-sm text-amber-700">
                                You have <span className="font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> remaining to verify your email. Check your inbox for the magic link.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowVerificationWarning(false)}
                        className="text-amber-600 hover:text-amber-800 p-2"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser?.full_name || 'User'}</h1>
                                <p className="text-gray-500 mt-1">Here's what's happening with your subscriptions.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-4 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]  flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Coins</div>
                                        <div className="text-xl font-bold">₦{currentUser?.wallet_balance?.toLocaleString() || 0}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]  flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Boots</div>
                                        <div className="text-xl font-bold">{currentUser?.boots_balance?.toLocaleString() || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Active Slots" value={activeSlots.length.toString()} icon={<Zap size={20} />} color="bg-blue-500" />
                            <StatCard title="Monthly Spend" value={`₦${activeSlots.reduce((acc, s) => acc + s.price, 0).toLocaleString()}`} icon={<TrendingUp size={20} />} color="bg-purple-500" />
                            <StatCard title="Q Rank" value={currentUser?.q_rank || getRank(currentUser?.q_score || 0)} icon={<ShieldCheck size={20} />} color="bg-emerald-500" />
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Your Active Slots</h2>
                                <button onClick={() => setActiveTab('marketplace')} className="text-sm font-semibold text-gray-500 hover:text-black flex items-center gap-1">
                                    Browse More <ChevronRight size={16} />
                                </button>
                            </div>

                            {activeSlots.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeSlots.map((slot) => (
                                        <ActiveSlotCard
                                            key={slot._id}
                                            slot={slot}
                                            onUpdateAllocation={(val) => updateAllocation(slot._id, val)}
                                            onSupportClick={() => setActiveTab('support')}
                                            onLeave={() => handleLeaveSlot(slot._id, slot.sub_name || "subscription")}
                                            onRenew={() => handleRenew(slot._id)}
                                            onToggleAutoRenew={(val) => handleToggleAutoRenew(slot._id, val)}
                                        />

                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-black/20 rounded-3xl p-12 text-center">
                                    <div className="w-16 h-16 bg-[#f4f5f8] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag size={24} className="opacity-20" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">No active subscriptions</h3>
                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Join a subscription slot to start saving on your favorite premium services.</p>
                                    <button onClick={() => setActiveTab('marketplace')} className="bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] px-6 py-3 rounded-full scale-100 hover:scale-[1.02] font-bold hover:scale-105 transition-transform">
                                        Explore Marketplace
                                    </button>
                                </div>
                            )}
                        </section>
                    </motion.div>
                )}

                {/* ... Other tabs (Marketplace, Wallet, Referrals, Campaigns, Profile, Support) ... */}
                {activeTab === 'marketplace' && (
                    <motion.div key="marketplace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marketplace</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Discover premium subscription slots tailored for you.</p>
                        </div>

                        {/* List & Earn Banner */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 sm:p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-4 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <BadgeDollarSign size={12} /> New Feature
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Monetize Your <br className="hidden sm:block" /> Subscriptions</h2>
                                    <p className="text-indigo-100 text-sm font-medium max-w-md">
                                        Have a Netflix, Spotify, or AI account? List it here and let Q fill the slots while you earn monthly payouts.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => window.location.href = "/list-subscription"}
                                        className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl shadow-black/10 hover:scale-105 transition-all text-sm"
                                    >
                                        List Your Account
                                    </button>
                                    <button
                                        onClick={() => window.location.href = "/owner-dashboard"}
                                        className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black rounded-2xl hover:bg-white/20 transition-all text-sm"
                                    >
                                        Owner Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                    <ShoppingBag size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search subscriptions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/50 backdrop-blur-sm border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] py-5 pl-14 pr-6 rounded-[2rem] font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none"
                                />
                            </div>

                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="md:hidden w-full bg-white border border-black/10 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-black/10"
                                aria-label="Filter marketplace categories"
                            >
                                {['All', 'Streaming', 'Music', 'Design', 'AI', 'Productivity', 'Gaming', 'VPN', 'Software', 'Utility', 'Education'].map((filter) => (
                                    <option key={filter} value={filter}>
                                        {filter}
                                    </option>
                                ))}
                            </select>

                            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {['All', 'Streaming', 'Music', 'Design', 'AI', 'Productivity', 'Gaming', 'VPN', 'Software', 'Utility', 'Education'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeFilter === filter ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-black/5'}`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Marketplace Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {subscriptions
                                .flatMap(sub => sub.slot_types.map(st => ({ ...st, category: sub.category })))
                                .filter(slot => {
                                    const matchesSearch = slot.name.toLowerCase().includes(searchQuery.toLowerCase()) || slot.sub_name.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesFilter = activeFilter === 'All' || (slot.category === activeFilter);
                                    return matchesSearch && matchesFilter;
                                })
                                .map((slot) => (
                                    <MarketplaceSlotCard
                                        key={slot._id}
                                        slot={slot}
                                        onJoin={() => {
                                            setCheckoutSlot(slot as unknown as SlotType);
                                            setUseBootsForPayment(false);
                                            setEnableAutoDebit(false);
                                        }}
                                        userQScore={currentUser?.q_score || 0}
                                    />
                                ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'wallet' && (
                    <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
                            <p className="text-gray-500 mt-1">Manage your funds and rewards.</p>
                        </header>

                        {/* 1. WALLET BALANCE SECTION */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>

                            <div className="text-center mb-8">
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">Available Balance</h3>
                                <motion.div
                                    key={currentUser?.wallet_balance}
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.3 }}
                                    className="text-5xl font-extrabold text-zinc-900 tracking-tight"
                                >
                                    {fmtCurrency(currentUser?.wallet_balance || 0)}
                                </motion.div>
                            </div>

                            <div className="border-t border-gray-100 pt-8 max-w-sm mx-auto text-center">
                                <p className="text-zinc-400 text-sm font-medium mb-6">
                                    Top up your wallet instantly or via manual bank transfer.
                                </p>
                                <button
                                    onClick={handleFundSubmit}
                                    className="w-full py-5 bg-black text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Plus size={20} />
                                    Fund Wallet
                                </button>
                            </div>
                        </div>

                        {/* MANUAL FUNDING STATUS SECTION */}
                        {manualRequests.filter(r => r.status === 'Awaiting Review').length > 0 && (
                            <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-8">
                                <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 mb-6 flex items-center gap-2">
                                    <Clock size={16} /> Pending Verification
                                </h3>
                                <div className="space-y-4">
                                    {manualRequests.filter(r => r.status === 'Awaiting Review').map((req) => (
                                        <div key={req._id} className="bg-white p-6 rounded-2xl border border-amber-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                                                    <Wallet size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg text-indigo-600">{fmtCurrency(req.unique_amount)}</div>
                                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                        Sent for {fmtCurrency(req.base_amount)} Credit
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-medium text-amber-700 bg-amber-100/50 px-4 py-2 rounded-full border border-amber-200 italic">
                                                Your transfer has been received and is pending admin verification.
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 2. BOOTS WALLET (GAMIFIED REWARDS) */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(37,99,235,0.08)] relative overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-800/60">Boots Balance</h3>
                                        <button onClick={() => setBootsModalOpen(true)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                            <Info size={16} />
                                        </button>
                                    </div>
                                    <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center text-blue-500 shadow-sm backdrop-blur-sm">
                                        <Sparkles size={18} />
                                    </div>
                                </div>

                                <motion.div
                                    key={currentUser?.boots_balance}
                                    animate={{ scale: [1, 1.1, 1], filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] }}
                                    transition={{ duration: 0.5 }}
                                    className="text-4xl font-extrabold text-blue-900 mb-6"
                                >
                                    {(currentUser?.boots_balance || 0).toLocaleString()} BOOTS
                                </motion.div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-bold text-blue-800/60 mb-2">
                                        <span>Next reward at 100 BOOTS</span>
                                        <span>{Math.min((currentUser?.boots_balance || 0), 100)}/100</span>
                                    </div>
                                    <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(((currentUser?.boots_balance || 0) / 100) * 100, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setActiveTab('referrals')}
                                        className="flex-1 py-3 bg-white text-blue-600 font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all"
                                    >
                                        Earn Boots
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('marketplace')}
                                        className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-inner hover:bg-blue-700 transition-all"
                                    >
                                        Use Boots
                                    </button>
                                </div>
                            </div>

                            {/* 3. LINKED CARD FOR AUTO PAYMENTS */}
                            <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group flex flex-col justify-between">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>

                                <div className="relative z-10 z-[2]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">Auto Payment Card</h3>
                                            <p className="text-zinc-400 text-xs leading-relaxed max-w-[200px]">
                                                Link your card to enable automatic subscription renewals.
                                            </p>
                                        </div>
                                        {currentUser?.direct_debit_card ? (
                                            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">Active</div>
                                        ) : (
                                            <ShieldCheck size={24} className="opacity-50" />
                                        )}
                                    </div>

                                    {currentUser?.direct_debit_card ? (
                                        <div className="mb-6 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                            <div className="text-xl font-mono tracking-widest break-all mb-4">•••• •••• •••• {currentUser.direct_debit_card.last4}</div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Brand</div>
                                                    <div className="font-bold text-sm">{currentUser.direct_debit_card.brand}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Expiry</div>
                                                    <div className="font-bold text-sm">{currentUser.direct_debit_card.expiry}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 flex-1 flex items-center justify-center">
                                            <p className="text-zinc-500 text-sm font-medium italic">No card linked yet</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    {currentUser?.direct_debit_card ? (
                                        <div className="flex gap-2 w-full">
                                            <button className="flex-1 py-3 bg-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all border border-white/5">
                                                Manage Card
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to remove your card? Automatic renewals will be disabled.")) {
                                                        const tid = toast.loading("Removing card...");
                                                        try {
                                                            await removeCardMutation({ userId: currentUser._id });
                                                            toast.success("Card removed successfully", { id: tid });
                                                        } catch (e) {
                                                            toast.error("Failed to remove card", { id: tid });
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-3 bg-red-500/10 text-red-500 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const loadingToast = toast.loading("Securely connecting to payment gateway...");
                                                    setTimeout(async () => {
                                                        await updateCardMutation({
                                                            userId: currentUser!._id,
                                                            cardDetails: { last4: "4242", brand: "Visa", expiry: "12/26", auth_token: "simulated_auth_token_" + Date.now() }
                                                        });
                                                        toast.dismiss(loadingToast);
                                                        toast.success("Card linked automatically!", { icon: '💳' });
                                                    }, 2000);
                                                } catch (e: any) {
                                                    toast.error("Failed to link card");
                                                }
                                            }}
                                            className="w-full py-3 bg-white text-zinc-900 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Link Card
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. TRANSACTION HISTORY */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Activity className="text-gray-400" size={20} /> Recent Activity
                            </h3>

                            <div className="space-y-4">
                                {transactions && transactions.length > 0 ? (
                                    transactions.slice(0, 5).map((tx, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'funding' ? 'bg-emerald-100 text-emerald-600' :
                                                    tx.type === 'payment' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {tx.type === 'funding' ? <Plus size={16} /> : tx.type === 'payment' ? <Zap size={16} /> : <Sparkles size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm capitalize">{tx.description || tx.type.replace('_', ' ')}</div>
                                                    <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className={`font-bold ${tx.type === 'funding' ? 'text-emerald-600' : tx.type === 'payment' ? 'text-zinc-900' : 'text-blue-600'}`}>
                                                {tx.type === 'funding' ? '+' : tx.type === 'payment' ? '-' : ''}₦{(tx.amount || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        No recent activity to show.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BOOTS Info Modal */}
                        <AnimatePresence>
                            {bootsModalOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                    onClick={() => setBootsModalOpen(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                        onClick={e => e.stopPropagation()}
                                        className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative"
                                    >
                                        <button
                                            onClick={() => setBootsModalOpen(false)}
                                            className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                                        >
                                            <X size={20} />
                                        </button>

                                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6">
                                            <Sparkles size={28} />
                                        </div>

                                        <h2 className="text-2xl font-bold mb-2 text-zinc-900">What are BOOTS?</h2>
                                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                            BOOTS are reward points you earn on JoinTheQ for being an active community member.
                                        </p>

                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-600">
                                                    <Plus size={16} /> Ways to earn BOOTS
                                                </h4>
                                                <ul className="text-sm text-gray-600 space-y-2">
                                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Inviting friends</li>
                                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Participating in campaigns</li>
                                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Completing campus ambassador missions</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-blue-600">
                                                    <Check size={16} /> Ways to use BOOTS
                                                </h4>
                                                <ul className="text-sm text-gray-600 space-y-2">
                                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Subscription discounts</li>
                                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Special campaigns</li>
                                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Exclusive giveaways</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setBootsModalOpen(false)}
                                            className="w-full mt-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform"
                                        >
                                            Got it!
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {activeTab === 'referrals' && (
                    <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
                            <p className="text-gray-500 mt-1">Invite friends and earn premium Boots.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Referral Code Card */}
                            <div className="bg-white p-8 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]  text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Share the Circle</h3>
                                <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">
                                    When someone joins a slot via your code, you get <span className="text-black font-bold">5 Boots</span> instantly after their payment.
                                </p>
                                <div className="p-4 bg-[#fdfdfd] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] flex items-center justify-between group">
                                    <code className="text-lg font-bold tracking-wider">{currentUser?.referral_code}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`https://jointheq.sbs/?ref=${currentUser?.referral_code}`);
                                            toast.success("Link copied!");
                                        }}
                                        className="text-sm font-bold text-blue-600 hover:scale-105 transition-transform"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>

                            {/* Referrer Info */}
                            <div className="bg-white p-8 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] ">
                                <h3 className="text-lg font-bold mb-6">Invited By</h3>
                                {referrer ? (
                                    <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-[2rem]">
                                        <div className="w-12 h-12 bg-white rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center font-bold text-emerald-600 ">
                                            {referrer.full_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold">{referrer.full_name}</div>
                                            <div className="text-xs text-emerald-800/50">Verified Member</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-[#fdfdfd] border border-dashed border-black/10 rounded-[2rem] text-center text-sm text-gray-400 py-8">
                                        No one invited you. You're a pioneer!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invited People List */}
                        <section>
                            <h2 className="text-xl font-bold mb-6">Your Referrals ({invitedUsers.length})</h2>
                            {invitedUsers.length > 0 ? (
                                <div className="space-y-4">
                                    {invitedUsers.map((invited) => (
                                        <div key={invited._id} className="bg-white p-6 rounded-3xl border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]  flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center font-bold opacity-50">
                                                    {invited.full_name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{invited.full_name}</div>
                                                    <div className="text-xs text-gray-400">Joined {new Date(invited.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div>
                                                {invited.is_verified ? (
                                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">Verified</div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-100">Pending Verify</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-black/20 rounded-3xl p-12 text-center">
                                    <p className="text-gray-400">You haven't invited anyone yet.</p>
                                </div>
                            )}
                        </section>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
                            <p className="text-gray-500 mt-1">Track your reputation growth and rewards.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Score History */}
                            <div className="bg-white p-8 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] ">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ShieldCheck className="text-blue-600" size={20} /> Q Score Log
                                </h3>
                                <div className="space-y-4">
                                    {currentUser?.score_history && currentUser.score_history.length > 0 ? (
                                        currentUser.score_history.slice().reverse().map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-[#fdfdfd] rounded-[2rem]">
                                                <div>
                                                    <div className="font-bold text-sm capitalize">{item.type?.replace('_', ' ')}</div>
                                                    <div className="text-xs text-gray-400">{item.description}</div>
                                                </div>
                                                <div className={`font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {item.amount >= 0 ? '+' : ''}{item.amount}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-black/20 py-8">No score history yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Boots History */}
                            <div className="bg-white p-8 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] ">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Sparkles className="text-amber-500" size={20} /> Boots Log
                                </h3>
                                <div className="space-y-4">
                                    {currentUser?.boots_history && currentUser.boots_history.length > 0 ? (
                                        currentUser.boots_history.slice().reverse().map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-[#fdfdfd] rounded-[2rem]">
                                                <div>
                                                    <div className="font-bold text-sm capitalize">{item.type?.replace('_', ' ')}</div>
                                                    <div className="text-xs text-gray-400">{item.description}</div>
                                                </div>
                                                <div className={`font-bold ${item.amount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                    {item.amount >= 0 ? '+' : ''}{item.amount}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-black/20 py-8">No rewards yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Penalties */}
                        {currentUser?.penalty_history && currentUser.penalty_history.length > 0 && (
                            <section className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
                                <h3 className="text-xl font-bold text-red-700 mb-6 flex items-center gap-2">
                                    <X className="text-red-600" size={20} /> Penalty Records
                                </h3>
                                <div className="space-y-4">
                                    {currentUser?.penalty_history?.slice().reverse().map((item, i) => (
                                        <div key={i} className="bg-white p-4 rounded-[2rem] flex items-center justify-between border border-red-100 ">
                                            <div>
                                                <div className="font-bold text-red-600 text-sm">{item.type}</div>
                                                <div className="text-xs text-gray-500">{item.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-red-600">-{item.score_penalty} Score</div>
                                                <div className="text-xs font-bold text-red-400">-{item.boots_penalty} Boots</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </motion.div>
                )}

                {activeTab === 'campaigns' && (
                    <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div className="bg-white border border-dashed border-black/20 rounded-[3rem] p-16 text-center max-w-2xl mx-auto w-full">
                            <div className="w-20 h-20 bg-zinc-100 text-zinc-700 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                <Rocket size={40} />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Campaigns Coming Soon</h2>
                            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                                Campaigns are temporarily unavailable on this dashboard. We are preparing rewards and events for you.
                            </p>
                        </div>

                        <CampusApplicationModal
                            isOpen={campusModalOpen}
                            onClose={() => setCampusModalOpen(false)}
                            userId={currentUser._id}
                        />
                    </motion.div>
                )}

                {activeTab === 'support' && (
                    <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 sm:p-8">
                        <div className="max-w-4xl mx-auto">
                            <SupportChatUser userId={currentUser._id} />
                        </div>
                    </motion.div>
                )}
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto space-y-10 pb-20">
                        {/* 1. Profile Identity Card */}
                        <div className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10 rounded-[3rem] text-center relative overflow-hidden group">
                            {/* Decorative background gradient */}
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="relative pt-4">
                                <div className="w-28 h-28 bg-zinc-900 text-white shadow-2xl rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden border-4 border-white">
                                    {currentUser?.profile_image_url ? (
                                        <img
                                            src={currentUser.profile_image_url}
                                            alt={currentUser.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon size={48} />
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-zinc-900">{currentUser?.full_name}</h2>
                                <button
                                    onClick={() => {
                                        setUsernameInput(currentUser?.username ?? '');
                                        setFullNameInput(currentUser?.full_name ?? '');
                                        setUniversityInput(currentUser?.university ?? '');
                                        setProfileImagePreview(currentUser?.profile_image_url ?? '');
                                        setEditingUsername(true);
                                    }}
                                    className="mt-2 text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    @{currentUser?.username || 'set_username'}
                                </button>
                                <p className="text-gray-400 text-sm mt-2 font-medium">
                                    {currentUser?.university ? `${currentUser.university} • ` : ''}
                                    Member since {new Date(currentUser?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>

                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <div className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-xs font-bold flex items-center gap-2">
                                        <Shield size={12} /> Verified Member
                                    </div>
                                    {invitedUsers.length >= 10 && (
                                        <div className="px-4 py-1.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold flex items-center gap-2">
                                            <Trophy size={12} /> Top Referrer
                                        </div>
                                    )}
                                    {currentUser?.role === 'admin' && (
                                        <div className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex items-center gap-2">
                                            <ShieldCheck size={12} /> Campus Rep
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button
                                onClick={() => {
                                    setUsernameInput(currentUser?.username ?? '');
                                    setFullNameInput(currentUser?.full_name ?? '');
                                    setUniversityInput(currentUser?.university ?? '');
                                    setProfileImagePreview(currentUser?.profile_image_url ?? '');
                                    setEditingUsername(true);
                                }}
                                className="w-full py-5 bg-zinc-900 text-white shadow-xl rounded-[2.5rem] font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
                            >
                                <Edit size={20} /> Edit Profile
                            </button>
                            <button
                                onClick={() => {
                                    const link = `joinq.com/r/${currentUser?.username || 'join'}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success("Referral link copied!");
                                }}
                                className="w-full py-5 bg-white border border-black/5 text-zinc-900 shadow-sm rounded-[2.5rem] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                            >
                                <LinkIcon size={20} /> Invite Link
                            </button>
                            <button
                                onClick={requestNotificationPermission}
                                className={`w-full py-5 border rounded-[2.5rem] font-bold flex items-center justify-center gap-2 transition-all ${notifPermission === 'granted'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : 'bg-white border-black/5 text-zinc-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Bell size={20} />
                                {notifPermission === 'granted' ? 'Alerts On' : 'Enable Alerts'}
                            </button>
                        </div>

                        {/* 9. Campus Rep Panel (Conditional) */}
                        {campusRepInfo && (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Campus Q Ambassador</h3>
                                            <p className="text-blue-100 text-sm">{campusRepInfo.campus_name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Referred</div>
                                            <div className="text-2xl font-black">{campusRepInfo.total_referred}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Commission</div>
                                            <div className="text-2xl font-black">2%</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Earned</div>
                                            <div className="text-2xl font-black">₦{campusRepInfo.total_earned.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Rank</div>
                                            <div className="text-2xl font-black">#3</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 12. Level Progress Meter (Add-on) */}
                        <div className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10 rounded-[3rem]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold">Campus Q Status</h3>
                                    <p className="text-sm text-gray-500">Tier {getRank(currentUser?.q_score || 0)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-blue-600">{currentUser?.q_score}</span>
                                    <span className="text-xs font-bold text-gray-400 block uppercase pt-1">Q Score</span>
                                </div>
                            </div>
                            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, ((currentUser?.q_score || 0) / 1000) * 100)}%` }}
                                    className="h-full bg-blue-600 rounded-full"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span>Recruit</span>
                                <span>Connector</span>
                                <span>Campus Plug</span>
                                <span>Campus Leader</span>
                            </div>
                        </div>

                        {/* 3 & 4. Performance Stats & Indicators */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                title="Referrals"
                                value={invitedUsers.length.toString()}
                                icon={<TeamIcon size={20} />}
                                color="bg-blue-500"
                            />
                            <StatCard
                                title="BOOTS Earned"
                                value={currentUser?.boots_balance?.toLocaleString() || '0'}
                                icon={<Sparkles size={20} />}
                                color="bg-purple-500"
                            />
                            <StatCard
                                title="Active Subs"
                                value={activeSlots.length.toString()}
                                icon={<ShoppingBag size={20} />}
                                color="bg-zinc-900"
                            />
                            <StatCard
                                title="Success Rate"
                                value="78%"
                                icon={<Target size={20} />}
                                color="bg-emerald-500"
                            />
                        </div>

                        {/* 5. Earnings Section */}
                        <div className="bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl" />
                            <h3 className="text-lg font-bold mb-8 opacity-60">Earnings Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                                <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Earned</div>
                                    <div className="text-2xl font-bold text-emerald-400">₦{(currentUser?.wallet_balance || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Pending</div>
                                    <div className="text-2xl font-bold text-blue-400">₦6,000</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Available</div>
                                    <div className="text-2xl font-bold">₦{(currentUser?.wallet_balance || 0).toLocaleString()}</div>
                                </div>
                            </div>
                            <button
                                disabled={(currentUser?.wallet_balance || 0) < 5000}
                                className="w-full py-5 bg-white text-zinc-900 rounded-[2.5rem] font-bold hover:scale-[1.01] transition-transform disabled:opacity-30"
                            >
                                {(currentUser?.wallet_balance || 0) < 5000 ? "Minimum withdrawal ₦5,000" : "Withdraw Funds"}
                            </button>
                        </div>

                        {/* 6. Campaign Participation */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 px-2">
                                <Award size={20} className="text-purple-600" /> Active Campaigns
                            </h3>
                            <div className="space-y-4">
                                {campaigns.filter(c => c.status === 'active').slice(0, 2).map((c: any) => (
                                    <div key={c._id} className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                                <Target size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold">{c.name}</div>
                                                <div className="text-xs text-emerald-500 font-bold">Active Participation</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-gray-400 uppercase">Rank</div>
                                            <div className="font-black text-xl">#7</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 7. Referral Tracking */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 px-2">
                                <TeamIcon size={20} className="text-blue-600" /> Friends Referred
                            </h3>
                            <div className="bg-white rounded-[3rem] overflow-hidden shadow-sm">
                                {invitedUsers.map((u: any, i) => (
                                    <div key={i} className={`p-6 flex items-center justify-between ${i !== invitedUsers.length - 1 ? 'border-b border-black/5' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-xs">
                                                {u.full_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">@{u.username || u.full_name.split(' ')[0].toLowerCase()}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">Joined 2 days ago</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                                            Active
                                        </div>
                                    </div>
                                ))}
                                {invitedUsers.length === 0 && (
                                    <div className="p-10 text-center text-gray-400 italic text-sm">No referrals yet. Share your link to start earning!</div>
                                )}
                            </div>
                        </section>

                        {/* 8. Active Subscriptions */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 px-2">
                                <ShoppingBag size={20} className="text-zinc-900" /> Active Subscriptions
                            </h3>
                            <div className="space-y-4">
                                {activeSlots.map((slot: any) => (
                                    <div key={slot._id} className="bg-white p-8 rounded-[3rem] shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-zinc-100 rounded-[2rem] flex items-center justify-center">
                                                <ShoppingBag size={28} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">{slot.sub_name}</div>
                                                <div className="text-sm text-gray-400 font-medium">Renewal: {new Date(slot.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center">
                                            <ChevronRight size={20} className="text-gray-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 10 & 11. Settings & Security */}
                        <div className="space-y-8 pt-10">
                            <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 rounded-[3rem]">
                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                    <Settings size={20} /> Settings & Security
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[2rem] hover:bg-gray-100 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-zinc-900 transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <span className="font-bold text-gray-600">Email Address</span>
                                        </div>
                                        <span className="text-sm text-gray-400 mr-2">{currentUser?.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[2rem] hover:bg-gray-100 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-zinc-900 transition-colors">
                                                <Shield size={18} />
                                            </div>
                                            <span className="font-bold text-gray-600">Two-Factor Auth</span>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-500 bg-emerald-100 px-3 py-1 rounded-full mr-2">Enabled</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[2rem] hover:bg-gray-100 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-zinc-900 transition-colors">
                                                <Smartphone size={18} />
                                            </div>
                                            <span className="font-bold text-gray-600">Login Devices</span>
                                        </div>
                                        <span className="text-sm text-gray-400 mr-2">{devices.length} Devices</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100">
                                <h3 className="text-xl font-bold mb-6 text-red-600">Danger Zone</h3>
                                <div className="space-y-4">
                                    <button onClick={resetQRank} className="w-full py-5 bg-white text-red-600 rounded-[2.5rem] font-bold hover:bg-red-600 hover:text-white transition-all border border-red-200 shadow-sm flex items-center justify-center gap-2">
                                        <Activity size={20} /> Reset Account Q Rank
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to log out?")) {
                                                auth.logout();
                                            }
                                        }}
                                        className="w-full py-5 bg-zinc-900 text-white rounded-[2.5rem] font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={20} /> Log Out Securely
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Username Edit Modal */}
                        <AnimatePresence>
                            {editingUsername && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingUsername(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden p-10 max-h-[90vh] overflow-y-auto">
                                        <h3 className="text-2xl font-black mb-2">Edit Profile</h3>
                                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">Update your public identity and campus details.</p>
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profile Photo</label>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100 border border-black/10 flex items-center justify-center">
                                                        {profileImagePreview ? (
                                                            <img src={profileImagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon size={28} className="text-zinc-500" />
                                                        )}
                                                    </div>
                                                    <label className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity">
                                                        Upload Photo
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProfileImagePreview('')}
                                                        className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 pt-1">
                                                    {recommendedAvatars.map((avatar) => (
                                                        <button
                                                            key={avatar}
                                                            type="button"
                                                            onClick={() => setProfileImagePreview(avatar)}
                                                            className={`rounded-2xl border p-1 transition-all ${profileImagePreview === avatar ? 'border-zinc-900 shadow-sm' : 'border-black/10 hover:border-black/30'}`}
                                                        >
                                                            <img src={avatar} alt="Recommended avatar" className="w-full aspect-square rounded-xl object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                                <div className="flex items-center gap-3 bg-zinc-100 rounded-[2rem] px-6 py-5 focus-within:ring-2 ring-blue-600/20 transition-all">
                                                    <input
                                                        value={fullNameInput}
                                                        onChange={e => setFullNameInput(e.target.value)}
                                                        className="bg-transparent text-lg font-bold outline-none w-full"
                                                        placeholder="Your full name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Universal Handle</label>
                                                <div className="flex items-center gap-3 bg-zinc-100 rounded-[2rem] px-6 py-5 focus-within:ring-2 ring-blue-600/20 transition-all">
                                                    <span className="text-zinc-900 font-black text-xl">@</span>
                                                    <input
                                                        value={usernameInput}
                                                        onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                                        className="bg-transparent text-xl font-black outline-none w-full"
                                                        placeholder="riderezzy"
                                                        maxLength={30}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">University / Campus</label>
                                                <div className="flex items-center gap-3 bg-zinc-100 rounded-[2rem] px-6 py-5 focus-within:ring-2 ring-blue-600/20 transition-all">
                                                    <input
                                                        value={universityInput}
                                                        onChange={e => setUniversityInput(e.target.value)}
                                                        className="bg-transparent text-lg font-bold outline-none w-full"
                                                        placeholder="e.g. UNILAG"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 ml-4 italic">Important for Campus Q rewards.</p>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button onClick={() => setEditingUsername(false)} className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-[2rem] font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                                <button
                                                    onClick={async () => {
                                                        if (!usernameInput || usernameInput.length < 3) return toast.error("Min 3 characters for username");
                                                        setUsernameLoading(true);
                                                        try {
                                                            await updateUsernameMutation({ userId: currentUser!._id, username: usernameInput });
                                                            await updateProfileMutation({
                                                                userId: currentUser!._id,
                                                                full_name: fullNameInput,
                                                                university: universityInput,
                                                                profile_image_url: profileImagePreview || undefined
                                                            });
                                                            toast.success("Profile updated successfully!");
                                                            setEditingUsername(false);
                                                        } catch (e: any) { toast.error(e.message); }
                                                        finally { setUsernameLoading(false); }
                                                    }}
                                                    disabled={usernameLoading}
                                                    className="flex-[2] py-5 bg-zinc-900 text-white rounded-[2rem] font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {usernameLoading ? "Saving..." : "Save Changes"}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
                {/* Checkout Modal */}
                <AnimatePresence>
                    {checkoutSlot && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setCheckoutSlot(null);
                                    setEnableAutoDebit(false);
                                }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold">Checkout</h2>
                                        <button
                                            onClick={() => {
                                                setCheckoutSlot(null);
                                                setEnableAutoDebit(false);
                                            }}
                                            className="p-2 hover:bg-black/5 rounded-full transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <div className="bg-[#fdfdfd] p-6 rounded-3xl border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                            <div className="text-xs font-bold uppercase tracking-wider text-black/30 mb-2">Subscription</div>
                                            <div className="text-xl font-bold">{checkoutSlot.name}</div>
                                            <div className="text-sm text-gray-500 mt-1">Monthly renewal cycle</div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-sm font-bold text-gray-500 ml-1">Select Payment Method</label>
                                            <div
                                                onClick={() => setUseBootsForPayment(false)}
                                                className={`p-5 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between ${!useBootsForPayment ? 'border-black bg-black/5' : 'border-black/5 hover:border-black/20'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center">
                                                        <Wallet size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">100% Coins</div>
                                                        <div className="text-xs text-gray-400">Pay ₦{checkoutSlot.price.toLocaleString()} from your wallet</div>
                                                    </div>
                                                </div>
                                                {!useBootsForPayment && <Check size={20} className="text-black" />}
                                            </div>

                                            <div
                                                onClick={() => setUseBootsForPayment(true)}
                                                className={`p-5 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between ${useBootsForPayment ? 'border-black bg-black/5' : 'border-black/5 hover:border-black/20'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center">
                                                        <Sparkles size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">Boots + Coins (50/50)</div>
                                                        <div className="text-xs text-gray-400">₦{(checkoutSlot.price / 2).toLocaleString()} + {(checkoutSlot.price / 2).toLocaleString()} Boots</div>
                                                    </div>
                                                </div>
                                                {useBootsForPayment && <Check size={20} className="text-black" />}
                                            </div>
                                        </div>

                                        {/* Auto-Debit Toggle */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="flex items-start gap-4 p-4 bg-emerald-50 rounded-2xl cursor-pointer hover:bg-emerald-100/50 transition-colors group">
                                                <div className="relative flex items-center mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={enableAutoDebit}
                                                        onChange={() => setEnableAutoDebit(!enableAutoDebit)}
                                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-emerald-300 transition-all checked:bg-emerald-500 checked:border-emerald-500"
                                                    />
                                                    <Check size={14} className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Repeat size={16} className="text-emerald-600" />
                                                        <span className="text-sm font-bold text-emerald-800">Enable Auto-Debit</span>
                                                    </div>
                                                    <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                                                        Automatically renew this subscription from your wallet at the end of each cycle.
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => joinSlot(checkoutSlot._id)}
                                        className="w-full py-5 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10"
                                    >
                                        Confirm & Pay ₦{useBootsForPayment ? (checkoutSlot.price / 2).toLocaleString() : checkoutSlot.price.toLocaleString()}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Create Listing Modal */}
                <AnimatePresence>
                    {showListingModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowListingModal(false)}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-[#f4f5f8] w-full max-w-3xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col font-sans"
                            >
                                <div className="p-8 bg-white flex items-center justify-between border-b border-black/5">
                                    <div>
                                        <h2 className="text-2xl font-bold">Create Marketplace Listing</h2>
                                        <p className="text-sm text-gray-500 mt-1">Setup account groups and define slot varieties.</p>
                                    </div>
                                    <button onClick={() => setShowListingModal(false)} className="p-3 hover:bg-black/5 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                                    {/* Account Details */}
                                    <section>
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" /> Account Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Platform (Subscription)</label>
                                                <select
                                                    value={listingData.subscription_id}
                                                    onChange={(e) => setListingData({ ...listingData, subscription_id: e.target.value })}
                                                    className="w-full p-5 bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select Platform</option>
                                                    {subscriptions.map(sub => (
                                                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Account Owner/Provider</label>
                                                <input
                                                    placeholder="e.g. Riderezzy"
                                                    value={listingData.plan_owner}
                                                    onChange={(e) => setListingData({ ...listingData, plan_owner: e.target.value })}
                                                    className="w-full p-5 bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Account Login Email</label>
                                                <input
                                                    placeholder="netflix@jointheq.sbs"
                                                    value={listingData.account_email}
                                                    onChange={(e) => setListingData({ ...listingData, account_email: e.target.value })}
                                                    className="w-full p-5 bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Admin Renewal Date (Account Expiry)</label>
                                                <input
                                                    type="date"
                                                    value={listingData.admin_renewal_date}
                                                    onChange={(e) => setListingData({ ...listingData, admin_renewal_date: e.target.value })}
                                                    className="w-full p-5 bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Slot Types */}
                                    <section>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" /> Slot Varieties
                                            </h3>
                                            <button
                                                onClick={() => setListingData({
                                                    ...listingData,
                                                    slots: [...listingData.slots, { name: '', price: 0, capacity: 1, access_type: 'code_access', downloads_enabled: true }]
                                                })}
                                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full border border-blue-100 transition-colors"
                                            >
                                                + Add Variety
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            {listingData.slots.map((slot, index) => (
                                                <div key={index} className="bg-white p-6 sm:p-8 rounded-[3rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative group animate-in fade-in slide-in-from-bottom-2">
                                                    {listingData.slots.length > 1 && (
                                                        <button
                                                            onClick={() => {
                                                                const newSlots = [...listingData.slots];
                                                                newSlots.splice(index, 1);
                                                                setListingData({ ...listingData, slots: newSlots });
                                                            }}
                                                            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-90"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Slot Group Name</label>
                                                            <input
                                                                placeholder="e.g. Profile 1"
                                                                value={slot.name}
                                                                onChange={(e) => {
                                                                    const newSlots = [...listingData.slots];
                                                                    const val = e.target.value;
                                                                    newSlots[index] = { ...newSlots[index], name: val };
                                                                    setListingData({ ...listingData, slots: newSlots });
                                                                }}
                                                                className="w-full p-4 bg-[#fdfdfd] border-none shadow-sm rounded-[1.5rem] font-bold focus:ring-1 ring-black/5 outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Slot Price (₦)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="2500"
                                                                value={slot.price}
                                                                onChange={(e) => {
                                                                    const newSlots = [...listingData.slots];
                                                                    const val = Number(e.target.value);
                                                                    newSlots[index] = { ...newSlots[index], price: val };
                                                                    setListingData({ ...listingData, slots: newSlots });
                                                                }}
                                                                className="w-full p-4 bg-[#fdfdfd] border-none shadow-sm rounded-[1.5rem] font-bold focus:ring-1 ring-black/5 outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Capacity (Slots)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="1"
                                                                value={slot.capacity}
                                                                onChange={(e) => {
                                                                    const newSlots = [...listingData.slots];
                                                                    const val = Number(e.target.value);
                                                                    newSlots[index] = { ...newSlots[index], capacity: val };
                                                                    setListingData({ ...listingData, slots: newSlots });
                                                                }}
                                                                className="w-full p-4 bg-[#fdfdfd] border-none shadow-sm rounded-[1.5rem] font-bold focus:ring-1 ring-black/5 outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">Access Method</label>
                                                            <select
                                                                value={slot.access_type}
                                                                onChange={(e) => {
                                                                    const newSlots = [...listingData.slots];
                                                                    const val = e.target.value;
                                                                    newSlots[index] = { ...newSlots[index], access_type: val };
                                                                    setListingData({ ...listingData, slots: newSlots });
                                                                }}
                                                                className="w-full p-4 bg-[#fdfdfd] border-none shadow-sm rounded-[1.5rem] font-bold focus:ring-1 ring-black/5 outline-none text-sm appearance-none cursor-pointer"
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
                                    </section>
                                </div>

                                <div className="p-8 bg-white border-t border-black/5">
                                    <button
                                        onClick={handleCreateListing}
                                        disabled={isCreatingListing || !listingData.subscription_id || !listingData.account_email || !listingData.plan_owner || !listingData.admin_renewal_date}
                                        className="w-full py-6 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold text-lg hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isCreatingListing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Confirm & Publish to Marketplace'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Leave Confirmation Modal */}
                <AnimatePresence>
                    {cancellingSlot && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl"
                            >
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                                    <AlertCircle size={32} />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Cancel Subscription</h2>
                                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                    You are about to leave your <span className="font-bold text-black">{cancellingSlot.name}</span> subscription.
                                    Leaving means you will lose access to the service at the end of the current billing cycle.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmLeaveSlot}
                                        className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Confirm Leave
                                    </button>
                                    <button
                                        onClick={() => setCancellingSlot(null)}
                                        className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    {activeTab === 'notifications' && (
                        <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                                    <p className="text-gray-500 mt-1">Updates on your subscriptions and platform activity.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {notifications.some((n: any) => !n.is_read) && (
                                        <button
                                            onClick={() => markAllAsReadMutation({ user_id: currentUser!._id })}
                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            Mark All as Seen
                                        </button>
                                    )}
                                </div>
                            </header>

                            <div className="space-y-4">
                                {notifications.length > 0 ? (
                                    notifications.map((notif: any) => (
                                        <div key={notif._id} className={`p-6 rounded-[2rem] border transition-all ${notif.is_read ? 'bg-white border-black/5 opacity-60' : 'bg-white border-blue-500/20 shadow-lg shadow-blue-500/5'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'alert' ? 'bg-red-100 text-red-600' :
                                                    notif.type === 'promotion' ? 'bg-amber-100 text-amber-600' :
                                                        notif.type === 'subscription' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-zinc-100 text-zinc-600'
                                                    }`}>
                                                    <Bell size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-bold text-base">{notif.title}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">{new Date(notif.created_at).toLocaleDateString()}</span>
                                                            {!notif.is_read && (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        try {
                                                                            await markAsReadMutation({ notification_id: notif._id });
                                                                        } catch (e: any) { toast.error(e.message); }
                                                                    }}
                                                                    className="p-1 hover:bg-blue-50 rounded-full text-blue-500 hover:text-blue-700 transition-colors"
                                                                    title="Mark as seen"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={async (e) => {
                                                                    if (window.confirm("Remove this notification?")) {
                                                                        try {
                                                                            await removeNotificationMutation({ notification_id: notif._id });
                                                                        } catch (e: any) { toast.error(e.message); }
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-red-50 rounded-full text-zinc-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-[3rem] p-20 text-center text-gray-400 border border-dashed border-black/10">
                                        <Bell size={40} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">No notifications yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </MainLayout >
    );
}

function CampaignCard({ campaign, onParticipate, userId }: { campaign: any, onParticipate: () => void, userId: Id<"users"> | undefined }) {
    const participant = useQuery(api.campaigns.getParticipant, userId ? { campaign_id: campaign._id, user_id: userId } : "skip");
    const isParticipating = !!participant;
    const progressPercent = (campaign.current_progress / campaign.target_goal) * 100;
    const daysRemaining = Math.max(0, Math.ceil((campaign.end_date - Date.now()) / (1000 * 60 * 60 * 24)));

    const getIcon = () => {
        switch (campaign.type) {
            case 'jar': return <Gift size={24} className="text-amber-500" />;
            case 'raffle': return <Activity size={24} className="text-blue-500" />;
            case 'referral_storm': return <Zap size={24} className="text-purple-500" />;
            case 'streak': return <Calendar size={24} className="text-emerald-500" />;
            default: return <Rocket size={24} />;
        }
    };

    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden  flex flex-col group">
            <div className="p-6 sm:p-8 pb-4 sm:pb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#fdfdfd] rounded-[2rem] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-500">
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">{campaign.name}</h3>
                        <div className="text-xs font-bold text-black/30 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1 uppercase tracking-tight">
                            {campaign.type?.replace('_', ' ') || 'event'}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-black/20">Reward</div>
                    <div className="text-xl font-bold flex items-center gap-1">
                        <Sparkles size={16} className="text-blue-500" /> {campaign.reward_amount}
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8 pt-0 sm:pt-0 flex-1">
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    {campaign.description}
                </p>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Event Progress</span>
                        <span className="text-xs font-bold">{campaign.current_progress} / {campaign.target_goal}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-black"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-black/20" />
                        <span className="text-sm font-bold text-gray-400">{daysRemaining} days left</span>
                    </div>

                    <button
                        onClick={onParticipate}
                        disabled={campaign.status !== 'active'}
                        className={`flex-1 py-4 rounded-[2rem] font-bold text-sm transition-all ${isParticipating
                            ? 'bg-zinc-100 text-zinc-600'
                            : 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:shadow-xl active:scale-95'
                            }`}
                    >
                        {isParticipating ? (
                            <span className="flex items-center justify-center gap-2"><Activity size={16} /> Manage Task</span>
                        ) : 'Participate'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: ReactNode, color: string }) {
    return (
        <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 sm:p-6 rounded-3xl ">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${color} text-white rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center`}>
                    {icon}
                </div>
                <ArrowUpRight size={16} className="text-black/20" />
            </div>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">{title}</div>
            <div className="text-xl sm:text-2xl font-bold">{value}</div>
        </div>
    );
}

function ActiveSlotCard({ slot, onUpdateAllocation, onSupportClick, onLeave, onRenew, onToggleAutoRenew }: {
    slot: UserSlot,
    onUpdateAllocation: (val: string) => void,
    onSupportClick: () => void,
    onLeave: () => void,
    onRenew: () => void,
    onToggleAutoRenew: (val: boolean) => void
}) {

    const getDateSafely = (dateStr?: string) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const targetDate = getDateSafely(slot.renewal_date);
    const daysLeft = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const formattedRenewal = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const [isEditing, setIsEditing] = useState(false);
    const [allocation, setAllocation] = useState(slot.allocation || '');

    const renderAccessInstructions = () => {
        switch (slot.access_type) {
            case 'code_access':
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</div>
                        <ul className="text-sm space-y-2 mb-4">
                            <li className="flex gap-2 items-start"><span className="text-black/30 text-xs mt-0.5">•</span> Click "Open Chat Support"</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 text-xs mt-0.5">•</span> Admin will send your {slot.sub_name} access code</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 text-xs mt-0.5">•</span> Enter the code when prompted on {slot.sub_name}</li>
                        </ul>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rules</div>
                        <ul className="text-sm space-y-2 text-black/60">
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Use only your assigned profile</li>
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not change the account settings</li>
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not add new profiles</li>
                        </ul>
                    </div>
                );
            case 'invite_link':
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</div>
                        <ul className="text-sm space-y-2 mb-4">
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">1.</span> Open Chat Support for your invite link</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">2.</span> Accept the {slot.sub_name} family invitation</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">3.</span> Use your provided home address</li>
                        </ul>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rules</div>
                        <ul className="text-sm space-y-2 text-black/60">
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not change family address</li>
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not leave the plan without notice</li>
                        </ul>
                    </div>
                );
            case 'email_invite':
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</div>
                        <ul className="text-sm space-y-2 mb-4">
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">1.</span> Open Chat Support</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">2.</span> Send your Google email address</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">3.</span> Admin will send a family invite</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">4.</span> Accept the invitation</li>
                        </ul>
                    </div>
                );
            case 'migrated':
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</div>
                        <ul className="text-sm space-y-2 mb-4">
                            <li className="flex gap-2 items-start"><span className="text-indigo-500 opacity-80 text-[10px] mt-1 font-mono">1.</span> Your subscription is being migrated</li>
                            <li className="flex gap-2 items-start"><span className="text-indigo-500 opacity-80 text-[10px] mt-1 font-mono">2.</span> Status: <span className="font-bold text-indigo-600">{slot.status}</span></li>
                            <li className="flex gap-2 items-start"><span className="text-indigo-500 opacity-80 text-[10px] mt-1 font-mono">3.</span> Open Chat Support if you have questions</li>
                        </ul>
                    </div>
                );
            case 'login_with_code':
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Login Email</div>
                        <div className="p-2 bg-white rounded-xl text-center font-mono text-sm mb-4 border border-black/5">{slot.sub_name.toLowerCase().replace(/\s/g, '')}@jointheq.sbs</div>

                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</div>
                        <ul className="text-sm space-y-2 mb-4">
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">1.</span> Login using the email above</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">2.</span> Request verification code</li>
                            <li className="flex gap-2 items-start"><span className="text-black/30 opacity-80 text-[10px] mt-1 font-mono">3.</span> Open Chat Support to receive the code</li>
                        </ul>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rules</div>
                        <ul className="text-sm space-y-2 text-black/60">
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not change password</li>
                            <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not remove profiles</li>
                        </ul>
                    </div>
                );
            default:
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Access</div>
                        <p className="text-sm text-gray-500">
                            Open Chat Support to activate your slot or if you need any assistance getting started.
                        </p>
                    </div>
                );
        }
    };

    const getAccessMethodName = () => {
        switch (slot.access_type) {
            case 'code_access': return "Code Access (via Support)";
            case 'invite_link': return "Family Invite Link";
            case 'email_invite': return "Email Invitation";
            case 'login_with_code': return "Account Login + Verif. Code";
            default: return "Pending";
        }
    }

    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 rounded-[2rem] flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{slot.status}</div>
                <div className="text-xs font-bold text-gray-400">Renewal: {formattedRenewal}</div>
            </div>

            <h3 className="font-bold text-xl leading-tight mb-1">{slot.sub_name} Slot</h3>
            <p className="text-sm text-gray-400 mb-6 pb-6 border-b border-black/5">Plan: {slot.slot_name}</p>

            <div className="mb-4">
                <div className="text-[10px] font-bold uppercase opacity-30 mb-1">Access Method</div>
                <div className="text-sm font-semibold text-blue-600">{getAccessMethodName()}</div>
            </div>

            <div className="flex-1">
                {renderAccessInstructions()}
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-black/5">
                {/* Auto-Renewal Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl">
                    <div>
                        <div className="text-[10px] font-bold uppercase opacity-40">Auto Renewal</div>
                        <div className="text-xs font-semibold">{slot.auto_renew ? 'Enabled' : 'Disabled'}</div>
                    </div>
                    <button
                        onClick={() => onToggleAutoRenew(!slot.auto_renew)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${slot.auto_renew ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${slot.auto_renew ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onRenew}
                        disabled={slot.auto_renew}
                        className={`flex-1 py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${slot.auto_renew ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                        <Zap size={16} /> Renew
                    </button>
                    <button
                        onClick={onLeave}
                        className="flex-1 py-4 bg-red-50 text-red-500 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-[0.98]"
                    >
                        <LogOut size={16} /> Leave
                    </button>
                </div>

                <button onClick={onSupportClick} className="w-full py-4 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <MessageCircle size={16} /> Open Chat Support
                </button>
            </div>

        </motion.div>
    );
}

function MarketplaceSlotCard({ slot, onJoin, userQScore }: { slot: any, onJoin: () => void, userQScore: number }) {
    const isEligible = userQScore >= (slot.min_q_score || 0);
    const capacity = slot.total_capacity || slot.capacity || 0;
    const joined = slot.current_members || 0;
    const isPopular = slot.sub_name === "Netflix" || slot.sub_name === "Spotify";
    const fallbackOwnerAvatars = [
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Kairo",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Mina",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Tobi",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Zara",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Nox",
        "https://api.dicebear.com/9.x/adventurer/svg?seed=Ari",
    ];
    const ownerName = ((slot.owner_name as string | undefined) || "admin").trim().replace(/^@+/, "") || "admin";
    const ownerProfileImage = ((slot.owner_profile_image_url as string | undefined) || "").trim();
    const ownerHash = ownerName.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const ownerFallbackAvatar = fallbackOwnerAvatars[ownerHash % fallbackOwnerAvatars.length];
    const useBlackFallback = !ownerProfileImage && ownerName.toLowerCase() === "admin";

    // A slot is actually sold out if joined >= capacity AND capacity > 0
    const isSoldOut = capacity > 0 && joined >= capacity;

    return (
        <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 sm:p-7 rounded-[2.5rem] flex flex-col hover:shadow-xl transition-all duration-300 relative group overflow-hidden border border-transparent hover:border-black/5">
            {/* Header with Logo */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#f4f5f8] rounded-2xl flex items-center justify-center overflow-hidden p-2.5">
                        {slot.sub_logo ? (
                            <img src={slot.sub_logo} alt={slot.sub_name} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black text-xs">
                                {slot.sub_name?.[0]}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-base">{slot.sub_name}</h3>
                            {isPopular && (
                                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                    🔥 Popular
                                </span>
                            )}
                            {slot.category && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-indigo-100/50">
                                    {slot.category}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-black/40 font-bold">{slot.name}</div>
                    </div>
                </div>
            </div>

            {/* Owner Info */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center overflow-hidden border border-white">
                    {ownerProfileImage ? (
                        <img src={ownerProfileImage} alt={ownerName} className="w-full h-full object-cover" />
                    ) : useBlackFallback ? (
                        <div className="w-full h-full bg-black" />
                    ) : (
                        <img src={ownerFallbackAvatar} alt={ownerName} className="w-full h-full object-cover" />
                    )}
                </div>
                <span className="text-xs font-bold text-black/40 tracking-tight">System Node: <span className="text-black/80">{ownerName}</span></span>
            </div>

            {/* Features (Hidden or truncated for cleaner look) */}
            <div className="flex-1 space-y-2 mb-8">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-3">Subscription Benefits</div>
                <div className="grid grid-cols-1 gap-2">
                    {(slot.features || ["Premium Slot", "Instant Access"]).slice(0, 3).map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-black/20 rounded-full" />
                            <span className="text-xs text-black/60 font-medium">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Section */}
            <div className="mb-8">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Profile Slot</div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">{fmtCurrency(slot.price)}</span>
                    <span className="text-xs font-bold text-black/30">/ month</span>
                </div>
            </div>

            {/* Capacity Section */}
            {capacity > 0 && (
                <div className="mb-8 p-5 bg-[#fdfdfd] rounded-[2rem] border border-black/5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">Market Availability</span>
                        <span className="text-xs font-black">{joined} / {capacity}</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/[0.03] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 rounded-full ${isSoldOut ? 'bg-red-500' : 'bg-zinc-900'}`}
                            style={{ width: `${(joined / capacity) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <button
                onClick={onJoin}
                disabled={!isEligible || joined === capacity}
                className={`w-full py-4.5 rounded-[2rem] font-black text-sm transition-all active:scale-[0.98] ${!isEligible
                    ? 'bg-black/5 text-black/20 cursor-not-allowed'
                    : joined === capacity
                        ? 'bg-red-50 text-red-500 border border-red-100'
                        : 'bg-zinc-900 text-white shadow-xl shadow-black/10 hover:shadow-2xl hover:bg-black'
                    }`}
            >
                {joined === capacity ? 'Sold Out' : isEligible ? 'Join Slot' : `Lv.${slot.min_q_score} Required`}
            </button>
        </div>
    );
}

function ArrowUpRight({ size, className }: { size?: number, className?: string }) { return <Plus size={size} className={className} style={{ transform: 'rotate(45deg)' }} />; }
function ClockIcon({ size, className }: { size?: number, className?: string }) { return <Clock size={size} className={className} />; }
