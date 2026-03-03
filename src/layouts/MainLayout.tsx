
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
    ShieldCheck
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
        if (score >= 85) return 'Elite';
        if (score >= 70) return 'Priority';
        if (score >= 50) return 'Standard';
        return 'Risk';
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag size={20} /> },
        { id: 'campaigns', label: 'Campaigns', icon: <Sparkles size={20} /> },
        { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
        { id: 'referrals', label: 'Referrals', icon: <Users size={20} /> },
        { id: 'support', label: 'Support', icon: <MessageCircle size={20} /> },
        ...(auth.isAdmin() ? [{ id: 'admin', label: 'Admin', icon: <Lock size={20} /> }] : []),
        { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F4] text-[#141414] font-sans">
            {/* Sidebar / Navigation */}
            <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-black/5 hidden lg:flex flex-col p-6 z-50">
                <div className="flex items-center gap-3 mb-10">
                    <Logo className="w-10 h-10" />
                    <span className="text-xl font-bold tracking-tight">jointheq</span>
                </div>

                <div className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-black text-white shadow-lg shadow-black/10'
                                : 'text-black/50 hover:bg-black/5 hover:text-black'
                                }`}
                        >
                            {item.icon}
                            <span className="font-semibold">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="pt-6 border-t border-black/5">
                    <div className="bg-[#F5F5F4] p-4 rounded-2xl mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-50">Q Score</span>
                            <ShieldCheck size={16} className="text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold">{qScore}</div>
                        <div className="w-full bg-black/5 h-1.5 rounded-full mt-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${qScore}%` }}
                                className="bg-black h-full"
                            />
                        </div>
                    </div>
                    <button onClick={() => auth.logout()} className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
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
                        className="lg:hidden fixed top-16 left-0 w-full bg-white border-b border-black/5 p-4 z-40 space-y-2"
                    >
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activeTab === item.id
                                    ? 'bg-black text-white shadow-lg shadow-black/10'
                                    : 'text-black/50 hover:bg-black/5 hover:text-black'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-semibold">{item.label}</span>
                            </button>
                        ))}
                        <button onClick={() => auth.logout()} className="flex items-center gap-3 w-full p-3 text-red-500 rounded-xl font-bold">
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
