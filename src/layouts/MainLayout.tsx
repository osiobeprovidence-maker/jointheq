
import React, { ReactNode, useState } from "react";
import {
    LayoutDashboard,
    ShoppingBag,
    Sparkles,
    Wallet,
    Users,
    MessageCircle,
    Lock,
    User as UserIcon,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Clock,
    Bell,
    User,
    ChevronRight,
    Settings
} from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/auth";
import { Logo } from "../components/ui/Logo";

interface MainLayoutProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const qScore = user?.q_score || 0;
    const isAdminMode = location.pathname.startsWith('/admin');

    const getRank = (score: number) => {
        if (score >= 1000) return 'Elite';
        if (score >= 600) return 'Pro';
        if (score >= 300) return 'Trusted';
        if (score >= 100) return 'Explorer';
        return 'Rookie';
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'migrate', label: 'Migrate Account', icon: <ShieldCheck size={20} /> },
        { id: 'campaigns', label: 'Campaigns', icon: <Sparkles size={20} /> },
        { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
        { id: 'referrals', label: 'Referrals', icon: <Users size={20} /> },
        { id: 'history', label: 'History', icon: <Clock size={20} /> },
        { id: 'support', label: 'Support', icon: <MessageCircle size={20} /> },
        { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
    ];

    const adminNavItem = { id: 'admin', label: 'Admin', icon: <Lock size={20} /> };

    return (
        <div className="min-h-screen bg-[#f4f5f8] text-[#1A1A1A] font-sans">
            {/* Sidebar / Navigation */}
            <nav className="fixed top-0 left-0 h-full w-64 bg-white border-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] hidden lg:flex flex-col p-6 z-50">
                <div className="flex items-center gap-3 mb-2">
                    <Logo className="w-10 h-10" />
                    <span className="text-xl font-bold tracking-tight">jointheq</span>
                </div>
                <div className="mb-10 px-1">
                    <div className="text-xs font-bold text-black/30 bg-black/5 px-2 py-0.5 rounded-md inline-block uppercase tracking-tight">
                        @{user?.username || 'member'}
                    </div>
                </div>

                <div className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center justify-between w-full p-3 rounded-full scale-100 hover:scale-[1.02] transition-all group ${activeTab === item.id
                                ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] shadow-lg shadow-black/10'
                                : 'text-gray-500 hover:bg-black/5 hover:text-black'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span className="font-semibold">{item.label}</span>
                            </div>
                            {item.id === 'notifications' && (
                                <NotificationBadge unreadCount={useQuery(api.notifications.getUnreadCount, user?._id ? { user_id: user._id } : "skip") || 0} />
                            )}
                        </button>
                    ))}
                    {auth.isAdmin() && (
                        <button
                            onClick={() => setActiveTab(adminNavItem.id)}
                            className={`flex items-center gap-3 w-full p-3 rounded-full scale-100 hover:scale-[1.02] transition-all ${activeTab === adminNavItem.id
                                ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] shadow-lg shadow-black/10'
                                : 'text-gray-500 hover:bg-black/5 hover:text-black'
                                }`}
                        >
                            {adminNavItem.icon}
                            <span className="font-semibold">{adminNavItem.label}</span>
                        </button>
                    )}
                </div>

                <div className="pt-6 border-t border-black/5">
                    <div className="bg-[#F5F5F4] p-4 rounded-[2rem] mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-50">Q Score</span>
                            <ShieldCheck size={16} className="text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold">{qScore}</div>
                        <div className="w-full bg-black/5 h-1.5 rounded-full mt-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (qScore / 1000) * 100)}%` }}
                                className="bg-black h-full"
                            />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider font-bold opacity-30 mt-2">
                            Rank: {getRank(qScore)}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to log out?")) {
                                auth.logout();
                            }
                        }}
                        className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-full scale-100 hover:scale-[1.02] transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Mobile/Desktop Top Header (Fixed) */}
            <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-4 sm:px-8 z-40 transition-all duration-300">
                <div className="flex items-center gap-3 lg:hidden">
                    <Logo className="w-8 h-8" />
                    <span className="font-extrabold tracking-tighter text-xl">Q</span>
                </div>
                
                <div className="hidden lg:block">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {isAdminMode ? 'System Control' : 'User Terminal'}
                    </h2>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Notification Alert Shortcut */}
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className="p-3 hover:bg-black/5 rounded-full relative transition-colors"
                    >
                        <Bell size={20} className="text-zinc-600" />
                        <NotificationBadge unreadCount={useQuery(api.notifications.getUnreadCount, user?._id ? { user_id: user._id } : "skip") || 0} />
                    </button>

                    <button 
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-2 p-1.5 pr-3 hover:bg-black/5 rounded-full transition-all group"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white overflow-hidden shadow-lg shadow-black/10 group-active:scale-95 transition-transform">
                            {user?.profile_image_url ? (
                                <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} />
                            )}
                        </div>
                        <span className="hidden sm:block text-sm font-bold text-zinc-900">
                            {user?.username || 'Profile'}
                        </span>
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-3 hover:bg-black/5 rounded-full transition-colors">
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Profile Drawer Overlay */}
            <AnimatePresence>
                {isProfileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsProfileOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
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
                                        {user?.profile_image_url ? (
                                            <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} className="text-gray-300" />
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold">{user?.full_name || user?.username}</h3>
                                    <p className="text-sm text-gray-500 font-medium">@{user?.username}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Account Mode</div>
                                    {auth.isAdmin() && (
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                navigate(isAdminMode ? '/dashboard' : '/admin');
                                            }}
                                            className="w-full p-4 bg-zinc-900 text-white rounded-3xl font-bold flex items-center justify-between group hover:bg-black transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                                                    {isAdminMode ? <LayoutDashboard size={16} /> : <ShieldCheck size={16} />}
                                                </div>
                                                <span className="text-sm">
                                                    {isAdminMode ? 'Switch to User View' : 'Go to Admin Panel'}
                                                </span>
                                            </div>
                                            <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Quick Stats</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-3xl">
                                            <div className="text-sm font-bold">{user?.q_score}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Q Score</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-3xl">
                                            <div className="text-sm font-bold">₦{user?.wallet_balance?.toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Wallet</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-black/5 bg-gray-50/50">
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to log out?")) {
                                            auth.logout();
                                        }
                                    }}
                                    className="w-full py-5 bg-white border border-red-50 text-red-500 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    <LogOut size={20} />
                                    Logout Session
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden fixed top-16 left-0 w-full bg-white border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-4 z-40 space-y-2"
                    >
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                className={`flex items-center gap-3 w-full p-3 rounded-full scale-100 hover:scale-[1.02] transition-all ${activeTab === item.id
                                    ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] shadow-lg shadow-black/10'
                                    : 'text-gray-500 hover:bg-black/5 hover:text-black'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-semibold">{item.label}</span>
                            </button>
                        ))}
                        {auth.isAdmin() && (
                            <button
                                onClick={() => { setActiveTab(adminNavItem.id); setIsMobileMenuOpen(false); }}
                                className={`flex items-center gap-3 w-full p-3 rounded-full scale-100 hover:scale-[1.02] transition-all ${activeTab === adminNavItem.id
                                    ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] shadow-lg shadow-black/10'
                                    : 'text-gray-500 hover:bg-black/5 hover:text-black'
                                    }`}
                            >
                                {adminNavItem.icon}
                                <span className="font-semibold">{adminNavItem.label}</span>
                            </button>
                        )}
                        <div className="pt-2 mt-2 border-t border-black/5">
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to log out?")) {
                                        auth.logout();
                                    }
                                }}
                                className="flex items-center gap-3 w-full p-3 text-red-500 rounded-full scale-100 hover:scale-[1.02] font-bold hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="lg:ml-64 pt-20 sm:pt-24 lg:pt-32 min-h-screen overflow-x-hidden transition-all duration-300">
                <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
                    {children}
                </div>
            </main>
        </div>
    );
};
function NotificationBadge({ unreadCount }: { unreadCount: number }) {
    if (unreadCount <= 0) return null;
    return (
        <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    );
}
