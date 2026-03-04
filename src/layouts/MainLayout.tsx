
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
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/auth";
import { Logo } from "../components/ui/Logo";

interface MainLayoutProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    qScore: number;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, setActiveTab, qScore }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const user = auth.getCurrentUser();

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
        { id: 'campaigns', label: 'Campaigns', icon: <Sparkles size={20} /> },
        { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
        { id: 'referrals', label: 'Referrals', icon: <Users size={20} /> },
        { id: 'history', label: 'History', icon: <Clock size={20} /> },
        { id: 'support', label: 'Support', icon: <MessageCircle size={20} /> },
        ...(auth.isAdmin() ? [{ id: 'admin', label: 'Admin', icon: <Lock size={20} /> }] : []),
        { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-[#f4f5f8] text-[#1A1A1A] font-sans">
            {/* Sidebar / Navigation */}
            <nav className="fixed top-0 left-0 h-full w-64 bg-white border-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] hidden lg:flex flex-col p-6 z-50">
                <div className="flex items-center gap-3 mb-10">
                    <Logo className="w-10 h-10" />
                    <span className="text-xl font-bold tracking-tight">jointheq</span>
                </div>

                <div className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 w-full p-3 rounded-full scale-100 hover:scale-[1.02] transition-all ${activeTab === item.id
                                ? 'bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] shadow-lg shadow-black/10'
                                : 'text-gray-500 hover:bg-black/5 hover:text-black'
                                }`}
                        >
                            {item.icon}
                            <span className="font-semibold">{item.label}</span>
                        </button>
                    ))}
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
                    <button onClick={() => auth.logout()} className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-full scale-100 hover:scale-[1.02] transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 w-full bg-white border-bottom border-black/5 p-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8" />
                    <span className="font-bold">jointheq</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => auth.logout()} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <LogOut size={20} />
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

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
                        <button onClick={() => auth.logout()} className="flex items-center gap-3 w-full p-3 text-red-500 rounded-full scale-100 hover:scale-[1.02] font-bold">
                            <LogOut size={20} />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="lg:ml-64 pt-20 lg:pt-0 min-h-screen overflow-x-hidden">
                <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
