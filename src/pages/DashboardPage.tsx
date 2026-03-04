
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
    Send
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";
import { UserSlot, SlotType } from "../types";
import toast from "react-hot-toast";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'wallet' | 'referrals' | 'history' | 'campaigns' | 'profile' | 'support' | 'admin'>('dashboard');
    const [useBootsForPayment, setUseBootsForPayment] = useState(false);
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

    // State for forms
    const [selectedChatUserId, setSelectedChatUserId] = useState<Id<"users"> | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('Phone');
    const [chatInput, setChatInput] = useState('');
    const [chatImage, setChatImage] = useState<string | null>(null);
    const [newPhone, setNewPhone] = useState('');
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
    const [adminInviteEmail, setAdminInviteEmail] = useState('');

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
    const resetQScoresMutation = useMutation(api.users.resetQScores);
    const seedMarketplaceMutation = useMutation(api.subscriptions.seedMarketplace);
    const participateInCampaignMutation = useMutation(api.campaigns.participate);
    const createCampaignMutation = useMutation(api.campaigns.create);
    const updateCampaignStatusMutation = useMutation(api.campaigns.updateStatus);
    const seedCampaignsMutation = useMutation(api.campaigns.seedDummy);
    const makeAdminMutation = useMutation(api.users.makeAdmin);
    const removeAdminMutation = useMutation(api.users.removeAdmin);

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

    const joinSlot = async (slotTypeId: string) => {
        if (!currentUser) return;
        try {
            const result = await joinSlotMutation({
                user_id: currentUser._id,
                slot_type_id: slotTypeId as Id<"slot_types">,
                use_boots: useBootsForPayment
            });
            if (result.success) {
                toast.success("Successfully joined slot!");
                setCheckoutSlot(null);
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
            await updateAllocationMutation({ id: slotId as Id<"slots">, allocation: val });
        } catch (error) {
            console.error("Error updating allocation:", error);
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
        <MainLayout activeTab={activeTab} setActiveTab={setActiveTab} qScore={currentUser?.q_score || 0}>
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
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marketplace</h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Discover premium subscription slots tailored for you.</p>
                            </div>
                        </header>
                        <div className="grid grid-cols-1 gap-10">
                            {subscriptions.map((sub) => (
                                <section key={sub._id}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] flex items-center justify-center  overflow-hidden p-2">
                                            {sub.logo_url ? (
                                                <img src={sub.logo_url} alt={sub.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="font-bold text-lg">{sub.name[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{sub.name}</h2>
                                            <p className="text-sm text-gray-500">{sub.description}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sub.slot_types.map((slot: any) => (
                                            <MarketplaceSlotCard
                                                key={slot._id}
                                                slot={slot}
                                                onJoin={() => setCheckoutSlot(slot)}
                                                userQScore={currentUser?.q_score || 0}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'wallet' && (
                    <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight">Your Wallet</h1>
                            <p className="text-gray-500 mt-1">Manage your funds and premium Boots.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]  text-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <Wallet size={32} />
                                </div>
                                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Available Balance</h3>
                                <div className="text-4xl font-bold mb-8">₦{currentUser?.wallet_balance?.toLocaleString() || 0}</div>

                                <div className="flex gap-4 max-w-xs mx-auto">
                                    <button
                                        onClick={() => fundWallet(5000)}
                                        className="flex-1 py-3 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full scale-100 hover:scale-[1.02] font-bold text-sm hover:scale-105 transition-transform"
                                    >
                                        Fund ₦5,000
                                    </button>
                                    <button
                                        onClick={() => fundWallet(10000)}
                                        className="flex-1 py-3 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full scale-100 hover:scale-[1.02] font-bold text-sm hover:scale-105 transition-transform"
                                    >
                                        Fund ₦10,000
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-6 italic">Paystack integration coming soon.</p>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)]  text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Boots Balance</h3>
                                <div className="text-4xl font-bold mb-8">{currentUser?.boots_balance?.toLocaleString() || 0}</div>

                                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                                    Earn more Boots by participating in campaigns and referring friends.
                                </p>
                                <button
                                    onClick={() => setActiveTab('campaigns')}
                                    className="px-6 py-3 bg-blue-50 text-blue-600 rounded-full scale-100 hover:scale-[1.02] font-bold text-sm hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                                >
                                    <Zap size={16} /> Earn Boots
                                </button>
                            </div>
                        </div>
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
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight">Active Campaigns</h1>
                            <p className="text-gray-500 mt-1">Join events to earn exclusive BOOTS and rewards.</p>
                        </header>

                        {campaigns.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {campaigns.map((camp: any) => (
                                    <CampaignCard
                                        key={camp._id}
                                        campaign={camp}
                                        onParticipate={() => currentUser && participateInCampaignMutation({ campaign_id: camp._id, user_id: currentUser._id })}
                                        userId={currentUser?._id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-black/20 rounded-[3rem] p-16 text-center max-w-2xl mx-auto">
                                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <Rocket size={40} />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">No Campaigns Yet</h2>
                                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                    Campaigns are special events where you can earn BOOTS, rewards, and exclusive subscription deals. Check back soon for new opportunities to participate.
                                </p>
                                {currentUser?.is_admin && (
                                    <button onClick={() => setActiveTab('admin')} className="px-8 py-4 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                                        <Plus size={20} /> Create First Campaign
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'support' && (
                    <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 h-[calc(100vh-10rem)] min-h-[500px] flex flex-col">
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
                            <p className="text-gray-500 mt-1">Get help from the jointheq team.</p>
                        </header>

                        <div className="flex-1 bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem]  overflow-hidden flex flex-col md:flex-row">
                            {currentUser?.is_admin && (
                                <div className="w-full md:w-80 border-b md:border-b-0 md:border-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto">
                                    <div className="p-6 border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] sticky top-0 bg-white z-10">
                                        <h3 className="font-bold text-lg">Chats</h3>
                                    </div>
                                    <div className="divide-y divide-black/5">
                                        {chatUsers.map((u: any) => (
                                            <button
                                                key={u._id}
                                                onClick={() => setSelectedChatUserId(u._id)}
                                                className={`w-full text-left p-4 hover:bg-black/5 transition-colors flex items-center gap-3 ${selectedChatUserId === u._id ? 'bg-black/5' : ''}`}
                                            >
                                                <div className="w-10 h-10 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full scale-100 hover:scale-[1.02] flex items-center justify-center font-bold flex-shrink-0">
                                                    {u.full_name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold truncate">{u.full_name} {u.is_admin && <span className="text-emerald-500 text-xs ml-1">(Admin)</span>}</div>
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 flex flex-col h-full bg-[#fdfdfd]/50">
                                {currentUser?.is_admin && !selectedChatUserId ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                        <MessageCircle size={48} className="mb-4 opacity-20 mx-auto" />
                                        <p>Select a user from the list to view their messages and reply.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
                                            {messages.length === 0 ? (
                                                <div className="m-auto text-center text-gray-400 p-8 flex flex-col justify-center items-center">
                                                    <MessageCircle size={48} className="mb-4 opacity-20" />
                                                    <p>No messages yet. {currentUser?.is_admin ? 'This user hasn\'t sent any messages.' : 'Send us a message and we will reply as soon as possible.'}</p>
                                                </div>
                                            ) : (
                                                messages.map((msg: any) => {
                                                    const isMe = msg.sender_id === currentUser._id;
                                                    return (
                                                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[75%] p-4 rounded-[2rem] ${isMe ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] ' : 'bg-white border border-black/10 text-black  '}`}>
                                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                                {msg.image_data && (
                                                                    <img src={msg.image_data} alt="Attached" className="mt-2 rounded-full scale-100 hover:scale-[1.02] max-w-full h-auto" />
                                                                )}
                                                                <div className={`text-[10px] mt-2 font-semibold opacity-50 ${isMe ? 'text-right text-white/70' : 'text-left'}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="p-4 bg-white border-t border-black/5 mt-auto">
                                            <div className="flex items-end gap-2 bg-[#fdfdfd] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-2 rounded-[2rem] focus-within:ring-2 ring-black/10 transition-shadow">
                                                <input
                                                    type="file"
                                                    id="chat-image"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                />
                                                <label htmlFor="chat-image" className="p-3 mb-1 text-gray-500 hover:text-black hover:bg-black/5 rounded-full scale-100 hover:scale-[1.02] cursor-pointer transition-colors">
                                                    <ImageIcon size={20} />
                                                </label>

                                                <div className="flex-1 flex flex-col">
                                                    {chatImage && (
                                                        <div className="relative inline-block m-2">
                                                            <img src={chatImage} alt="Preview" className="h-16 rounded-lg border border-black/10 w-fit" />
                                                            <button onClick={() => setChatImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:scale-110 transition-transform shadow-md">
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <textarea
                                                        value={chatInput}
                                                        onChange={(e) => setChatInput(e.target.value)}
                                                        placeholder={currentUser?.is_admin ? "Type your reply..." : "How can we help?"}
                                                        className="w-full bg-transparent border-none focus:outline-none p-3 resize-none max-h-32 text-sm"
                                                        rows={1}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                sendMessage();
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <button
                                                    onClick={sendMessage}
                                                    disabled={!chatInput.trim() && !chatImage}
                                                    className="p-3 mb-1 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full scale-100 hover:scale-[1.02] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:bg-black/20"
                                                >
                                                    <Send size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'admin' && currentUser?.is_admin && (
                    <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 pb-20">
                        <header className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                    <Shield className="text-blue-600" size={32} /> Admin Control Center
                                </h1>
                                <p className="text-gray-500 mt-1">Manage platform operations and ecosystem.</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <button className="bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-black/10 transition-all text-left group ">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={24} />
                                </div>
                                <h3 className="font-bold text-lg">Marketplace</h3>
                                <p className="text-sm text-gray-500 mt-2">Manage subscription slots and pricing.</p>
                            </button>
                            <button className="bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-black/10 transition-all text-left group ">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Zap size={24} />
                                </div>
                                <h3 className="font-bold text-lg">Campaigns</h3>
                                <p className="text-sm text-gray-500 mt-2">Create and monitor reward events.</p>
                            </button>
                            <button className="bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-black/10 transition-all text-left group ">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                                <h3 className="font-bold text-lg">Community</h3>
                                <p className="text-sm text-gray-500 mt-2">Support tickets and user bans.</p>
                            </button>
                        </div>

                        <section className="bg-white p-10 rounded-[3rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold">Quick Campaign Creator</h2>
                                <button className="text-sm font-bold opacity-30">View Analytics</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-400 ml-1">Campaign Type</label>
                                    <select className="w-full p-5 bg-[#fdfdfd] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none">
                                        <option>Reward Jar (Growth)</option>
                                        <option>Raffle Ticket (Engagement)</option>
                                        <option>Referral Storm (Viral)</option>
                                        <option>Payment Streak (Loyalty)</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-400 ml-1">Reward Amount (BOOTS)</label>
                                    <input type="number" placeholder="e.g. 50" className="w-full p-5 bg-[#fdfdfd] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <button
                                        onClick={() => createCampaignMutation({
                                            name: "Easter Reward Jar",
                                            type: "jar",
                                            description: "Help fill the jar by inviting friends to join subscriptions.",
                                            reward_type: "boots",
                                            reward_amount: 50,
                                            start_date: Date.now(),
                                            end_date: Date.now() + (5 * 24 * 60 * 60 * 1000),
                                            target_goal: 500
                                        })}
                                        className="w-full py-6 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold text-lg shadow-xl shadow-black/10 hover:scale-[1.01] transition-transform"
                                    >
                                        Launch New Campaign
                                    </button>
                                </div>
                            </div>
                        </section>

                        {currentUser.email === 'riderezzy@gmail.com' && (
                            <section className="bg-white p-10 rounded-[3rem] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] shadow-xl">
                                <h2 className="text-2xl font-bold mb-8">Manage Admins (Super Admin Only)</h2>
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <input
                                            type="email"
                                            placeholder="Enter user email to make admin"
                                            value={adminInviteEmail}
                                            onChange={(e) => setAdminInviteEmail(e.target.value)}
                                            className="flex-1 p-5 bg-[#fdfdfd] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] font-bold focus:ring-2 ring-black/5 outline-none"
                                        />
                                        <button
                                            onClick={handleMakeAdmin}
                                            className="py-5 px-8 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold shadow-xl shadow-black/10 hover:scale-[1.01] transition-transform whitespace-nowrap"
                                        >
                                            Add Admin
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold mb-4">Current Admins</h3>
                                        <div className="space-y-4">
                                            {adminsList.map((admin: any) => (
                                                <div key={admin._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#fdfdfd] border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[2rem] gap-4">
                                                    <div>
                                                        <div className="font-bold">{admin.full_name} {admin.email === 'riderezzy@gmail.com' && <span className="text-emerald-500 text-sm">(Super Admin)</span>}</div>
                                                        <div className="text-sm text-gray-500">{admin.email}</div>
                                                    </div>
                                                    {admin.email !== 'riderezzy@gmail.com' && (
                                                        <button
                                                            onClick={() => handleRemoveAdmin(admin._id)}
                                                            className="text-red-500 font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </motion.div>
                )}
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Profile</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your personal information and security.</p>
                        </header>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2rem] text-center ">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white ">
                                        <UserIcon size={40} className="sm:w-12 sm:h-12" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold">{currentUser?.full_name}</h2>
                                    <p className="text-xs sm:text-sm text-gray-500">{currentUser?.email}</p>
                                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">
                                        <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
                                        {currentUser?.q_rank || getRank(currentUser?.q_score || 0)} Member
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 rounded-[2rem] ">
                                    <h3 className="text-xl font-bold mb-6 text-red-600">Danger Zone</h3>
                                    <div className="space-y-4">
                                        <button onClick={resetQRank} className="w-full py-4 bg-orange-50 text-orange-600 rounded-[2rem] font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">
                                            <Sparkles size={20} /> Reset Q Rank to 100
                                        </button>
                                        <button onClick={() => seedMarketplaceMutation()} className="w-full py-4 bg-blue-50 text-blue-600 rounded-[2rem] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                            <ShoppingBag size={20} /> Seed Marketplace Data
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await seedCampaignsMutation({});
                                                toast.success("Dummy campaigns seeded!");
                                            }}
                                            className="w-full py-4 bg-purple-50 text-purple-600 rounded-[2rem] font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={20} /> Seed Dummy Campaigns
                                        </button>
                                        <button onClick={() => auth.logout()} className="w-full py-4 bg-red-50 text-red-600 rounded-[2rem] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                                            <LogOut size={20} /> Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                onClick={() => setCheckoutSlot(null)}
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
                                        <button onClick={() => setCheckoutSlot(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
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
            <div className="p-8 pb-4 flex items-start justify-between">
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

            <div className="p-8 pt-0 flex-1">
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
                        disabled={isParticipating || campaign.status !== 'active'}
                        className={`flex-1 py-4 rounded-[2rem] font-bold text-sm transition-all ${isParticipating
                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                            : 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:shadow-xl active:scale-95'
                            }`}
                    >
                        {isParticipating ? (
                            <span className="flex items-center justify-center gap-2"><Check size={16} /> Joined</span>
                        ) : 'Participate'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: ReactNode, color: string }) {
    return (
        <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 rounded-3xl ">
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

function ActiveSlotCard({ slot, onUpdateAllocation, onSupportClick }: { slot: UserSlot, onUpdateAllocation: (val: string) => void, onSupportClick: () => void }) {
    const daysLeft = Math.ceil((new Date(slot.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Formatting date
    const d = new Date(slot.renewal_date);
    const formattedRenewal = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
            case 'login_with_code':
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Login Email</div>
                        <div className="p-2 bg-white rounded-xl text-center font-mono text-sm mb-4 border border-black/5">{slot.sub_name.toLowerCase().replace(/\s/g, '')}@jointheq.com</div>

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

            <div className="mt-auto space-y-4">
                {slot.access_type === 'invite_link' && (
                    <div className="mb-4">
                        <div className="text-[10px] font-bold uppercase opacity-30 mb-1">Your Allocation/Address</div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input type="text" value={allocation} onChange={(e) => setAllocation(e.target.value)} placeholder="Enter home address" className="flex-1 p-3 bg-[#f4f5f8] rounded-2xl text-xs outline-none" />
                                <button onClick={() => { onUpdateAllocation(allocation); setIsEditing(false); }} className="bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] px-4 py-2 rounded-2xl text-xs font-bold">Save</button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-[#f4f5f8] rounded-2xl">
                                <span className="text-xs font-medium">{slot.allocation || 'Address not set'}</span>
                                <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600 pr-1">Edit</button>
                            </div>
                        )}
                    </div>
                )}
                <button onClick={onSupportClick} className="w-full py-4 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <MessageCircle size={16} /> Open Chat Support
                </button>
            </div>
        </motion.div>
    );
}

function MarketplaceSlotCard({ slot, onJoin, userQScore }: { slot: SlotType, onJoin: () => void, userQScore: number }) {
    const isEligible = userQScore >= slot.min_q_score;
    const capacity = slot.capacity || 5;
    const joined = slot.current_members || 0;

    return (
        <div className="bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 rounded-[2rem]  flex flex-col hover:border-black/20 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-xl">{slot.name}</h3>
                    <div className="text-2xl font-bold mt-1">₦{slot.price.toLocaleString()} <span className="text-sm font-normal text-black/30">/ month</span></div>
                </div>
            </div>

            <div className="flex-1 space-y-3 mb-8">
                {slot.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <div className="mt-1 w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={10} className="text-emerald-600" />
                        </div>
                        <span className="text-sm text-black/60">{feature}</span>
                    </div>
                ))}
                {!slot.features && (
                    <p className="text-sm text-gray-400 italic">Premium slot with standard benefits</p>
                )}
            </div>

            <div className="mb-6 p-4 bg-[#fdfdfd] rounded-[2rem]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Members joined</span>
                    <span className="text-xs font-bold text-black/60">{joined} / {capacity}</span>
                </div>
                <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-black transition-all duration-500"
                        style={{ width: `${(joined / capacity) * 100}%` }}
                    />
                </div>
            </div>

            <button
                onClick={onJoin}
                disabled={!isEligible}
                className={`w-full py-4 rounded-[2rem] font-bold transition-transform active:scale-95 ${isEligible ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:shadow-lg' : 'bg-black/5 text-black/30'}`}
            >
                {isEligible ? 'Join Slot' : `Requires ${slot.min_q_score} Q Score`}
            </button>
        </div>
    );
}

function ArrowUpRight({ size, className }: { size?: number, className?: string }) { return <Plus size={size} className={className} style={{ transform: 'rotate(45deg)' }} />; }
function ClockIcon({ size, className }: { size?: number, className?: string }) { return <Clock size={size} className={className} />; }
