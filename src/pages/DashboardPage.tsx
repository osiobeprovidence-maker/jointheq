
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
    ArrowUpRight,
    Clock,
    Tv,
    Smartphone,
    Laptop,
    Monitor,
    Trash2,
    User as UserIcon,
    LogOut,
    MessageCircle,
    ImageIcon,
    Send,
    X,
    Mail
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";
import { UserSlot } from "../types";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'wallet' | 'referrals' | 'campaigns' | 'profile' | 'support' | 'admin'>('dashboard');
    const [useBootsForPayment, setUseBootsForPayment] = useState(false);
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
    const messages = useQuery(api.messages.getMessages, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const devices = useQuery(api.devices.listByUserId, currentUser ? { user_id: currentUser._id } : "skip") || [];
    const chatUsers = useQuery(api.users.list) || [];

    // State for forms
    const [selectedChatUserId, setSelectedChatUserId] = useState<Id<"users"> | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('Phone');
    const [chatInput, setChatInput] = useState('');
    const [chatImage, setChatImage] = useState<string | null>(null);
    const [newPhone, setNewPhone] = useState('');
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

    // Mutations
    const joinSlotMutation = useMutation(api.subscriptions.joinSlot);
    const sendMessageMutation = useMutation(api.messages.sendMessage);
    const addTransactionMutation = useMutation(api.transactions.addTransaction);
    const addDeviceMutation = useMutation(api.devices.addDevice);
    const removeDeviceMutation = useMutation(api.devices.removeDevice);
    const updatePhoneMutation = useMutation(api.users.updatePhone);
    const updateAllocationMutation = useMutation(api.subscriptions.updateAllocation);

    const getRank = (score: number) => {
        if (score >= 85) return 'Elite';
        if (score >= 70) return 'Priority';
        if (score >= 50) return 'Standard';
        return 'Risk';
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
                alert("Successfully joined slot!");
                setActiveTab('dashboard');
            }
        } catch (error: any) {
            alert(error.message || "Failed to join slot");
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
            alert("Phone number updated!");
        } catch (error) {
            console.error("Error updating phone:", error);
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
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
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
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
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
                                <p className="text-black/50 mt-1">Here's what's happening with your subscriptions.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Coins</div>
                                        <div className="text-xl font-bold">₦{currentUser?.wallet_balance?.toLocaleString() || 0}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wider opacity-50">Boots</div>
                                        <div className="text-xl font-bold">{currentUser?.boot_balance?.toLocaleString() || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Active Slots" value={activeSlots.length.toString()} icon={<Zap size={20} />} color="bg-blue-500" />
                            <StatCard title="Monthly Spend" value={`₦${activeSlots.reduce((acc, s) => acc + s.price, 0).toLocaleString()}`} icon={<TrendingUp size={20} />} color="bg-purple-500" />
                            <StatCard title="Q Rank" value={getRank(currentUser?.q_score || 0)} icon={<ShieldCheck size={20} />} color="bg-emerald-500" />
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Your Active Slots</h2>
                                <button onClick={() => setActiveTab('marketplace')} className="text-sm font-semibold text-black/50 hover:text-black flex items-center gap-1">
                                    Browse More <ChevronRight size={16} />
                                </button>
                            </div>

                            {activeSlots.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeSlots.map((slot) => (
                                        <ActiveSlotCard key={slot._id} slot={slot} onUpdateAllocation={(val) => updateAllocation(slot._id, val)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-black/20 rounded-3xl p-12 text-center">
                                    <div className="w-16 h-16 bg-[#FAFAF9] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag size={24} className="opacity-20" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">No active subscriptions</h3>
                                    <p className="text-black/50 mb-6 max-w-xs mx-auto">Join a subscription slot to start saving on your favorite premium services.</p>
                                    <button onClick={() => setActiveTab('marketplace')} className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
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
                                <p className="text-xs sm:text-sm text-black/50 mt-1">Find the perfect slot for your favorite subscriptions.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-black/5 shadow-sm overflow-x-auto no-scrollbar">
                                <button onClick={() => setUseBootsForPayment(false)} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${!useBootsForPayment ? 'bg-black text-white shadow-md' : 'text-black/50 hover:bg-black/5'}`}>100% Coins</button>
                                <button onClick={() => setUseBootsForPayment(true)} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${useBootsForPayment ? 'bg-black text-white shadow-md' : 'text-black/50 hover:bg-black/5'}`}>50/50 Split</button>
                            </div>
                        </header>
                        <div className="grid grid-cols-1 gap-10">
                            {subscriptions.map((sub) => (
                                <section key={sub._id}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center shadow-sm">
                                            <span className="font-bold text-lg">{sub.name[0]}</span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{sub.name}</h2>
                                            <p className="text-sm text-black/50">{sub.description}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sub.slot_types.map((slot: any) => (
                                            <MarketplaceSlotCard key={slot._id} slot={slot} onJoin={() => joinSlot(slot._id)} userQScore={currentUser?.q_score || 0} useBoots={useBootsForPayment} />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <header>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Profile</h1>
                            <p className="text-xs sm:text-sm text-black/50 mt-1">Manage your personal information and security.</p>
                        </header>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-center shadow-sm">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-sm">
                                        <UserIcon size={40} className="sm:w-12 sm:h-12" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold">{currentUser?.full_name}</h2>
                                    <p className="text-xs sm:text-sm text-black/50">{currentUser?.email}</p>
                                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">
                                        <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
                                        {getRank(currentUser?.q_score || 0)} Member
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white border border-black/5 p-8 rounded-[2.5rem] shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 text-red-600">Danger Zone</h3>
                                    <button onClick={() => auth.logout()} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                                        <LogOut size={20} /> Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
}

// ... Helpher components like StatCard, ActiveSlotCard etc. from App.tsx ...
function StatCard({ title, value, icon, color }: { title: string, value: string, icon: ReactNode, color: string }) {
    return (
        <div className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center`}>
                    {icon}
                </div>
                <ArrowUpRight size={16} className="text-black/20" />
            </div>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">{title}</div>
            <div className="text-xl sm:text-2xl font-bold">{value}</div>
        </div>
    );
}

function ActiveSlotCard({ slot, onUpdateAllocation }: { slot: UserSlot, onUpdateAllocation: (val: string) => void }) {
    const daysLeft = Math.ceil((new Date(slot.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const [isEditing, setIsEditing] = useState(false);
    const [allocation, setAllocation] = useState(slot.allocation || '');

    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-[#FAFAF9] rounded-2xl flex items-center justify-center font-bold">{slot.sub_name[0]}</div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">Active</div>
            </div>
            <h3 className="font-bold text-lg mb-1">{slot.sub_name}</h3>
            <p className="text-sm text-black/50 mb-4">{slot.slot_name}</p>
            <div className="mb-6">
                <div className="text-[10px] font-bold uppercase opacity-30 mb-1">Your Allocation</div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <input type="text" value={allocation} onChange={(e) => setAllocation(e.target.value)} className="flex-1 p-2 bg-[#FAFAF9] rounded-lg text-xs" />
                        <button onClick={() => { onUpdateAllocation(allocation); setIsEditing(false); }} className="bg-black text-white px-3 py-1 rounded-lg text-xs">Save</button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-2 bg-[#FAFAF9] rounded-lg">
                        <span className="text-xs font-medium">{slot.allocation || 'Not set'}</span>
                        <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600">Edit</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function MarketplaceSlotCard({ slot, onJoin, userQScore, useBoots }: { slot: any, onJoin: () => void, userQScore: number, useBoots: boolean }) {
    const isEligible = userQScore >= slot.min_q_score;
    return (
        <div className="bg-white border border-black/5 p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg">{slot.name}</h3>
                <div className="text-right">
                    {useBoots ? (
                        <div className="text-lg font-bold">₦{(slot.price / 2).toLocaleString()} <span className="text-[10px] opacity-40">Coins</span></div>
                    ) : (
                        <div className="text-xl font-bold">₦{slot.price.toLocaleString()}</div>
                    )}
                </div>
            </div>
            <button onClick={onJoin} disabled={!isEligible} className={`w-full py-4 rounded-2xl font-bold ${isEligible ? 'bg-black text-white' : 'bg-black/5 text-black/30'}`}>
                {isEligible ? 'Join Slot' : `Requires ${slot.min_q_score} Q Score`}
            </button>
        </div>
    );
}
