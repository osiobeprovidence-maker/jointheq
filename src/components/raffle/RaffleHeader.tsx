import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Bell, LogIn, UserPlus, ChevronDown, Ticket, Share2, Music, ShoppingBag, Settings, LogOut } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Logo } from "../ui/Logo";
import { auth } from "../../lib/auth";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { NotificationPanel } from "./NotificationPanel";
import { ProfileDropdown } from "./ProfileDropdown";
import type { User as UserType } from "../../types";

interface RaffleHeaderProps {
  currentUser: UserType | null;
  onUserChange: (user: UserType | null) => void;
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
  showRegister: boolean;
  setShowRegister: (v: boolean) => void;
  raffleLogoUrl?: string;
}

export function RaffleHeader({ currentUser, onUserChange, showLogin, setShowLogin, showRegister, setShowRegister, raffleLogoUrl }: RaffleHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const convexUserId = (currentUser?._id || "") as Id<"users">;
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    convexUserId ? { user_id: convexUserId } : "skip"
  );

  const referralCode = new URLSearchParams(window.location.search).get("ref") || undefined;

  const handleLoginSuccess = () => {
    const u = auth.getCurrentUser();
    if (u) onUserChange(u);
  };

  const handleRegisterSuccess = () => {
    const u = auth.getCurrentUser();
    if (u) onUserChange(u);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    auth.clearSession();
    onUserChange(null);
  };

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser?.email?.slice(0, 2).toUpperCase() || "U";

  const mobileMenuItems = currentUser
    ? [
        { icon: <Ticket size={16} />, label: "My Tickets", action: () => { document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" }); setShowMobileMenu(false); } },
        { icon: <Share2 size={16} />, label: "My Referrals", action: () => { document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" }); setShowMobileMenu(false); } },
        { icon: <Bell size={16} />, label: "Notifications", action: () => { setShowMobileMenu(false); setShowNotifications(true); }, badge: unreadCount },
        { icon: <Music size={16} />, label: "Spotify Subscription", action: () => { window.location.href = "/dashboard?tab=marketplace"; } },
        { icon: <ShoppingBag size={16} />, label: "Purchase History", action: () => { window.location.href = "/dashboard?tab=history"; } },
        { icon: <Settings size={16} />, label: "Account Settings", action: () => { window.location.href = "/dashboard"; } },
        { type: "divider" as const },
        { icon: <LogOut size={16} />, label: "Logout", action: handleLogout, danger: true },
      ]
    : [
        { icon: <LogIn size={16} />, label: "Log In", action: () => { setShowMobileMenu(false); setShowLogin(true); } },
        { icon: <UserPlus size={16} />, label: "Create Account", action: () => { setShowMobileMenu(false); setShowRegister(true); } },
      ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/raffle" className="flex items-center gap-2.5 shrink-0">
            {raffleLogoUrl ? (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={raffleLogoUrl} alt="Raffle Logo" className="h-7 w-auto object-contain" loading="lazy"
              />
            ) : (
              <Logo className="w-7 h-7" />
            )}
            <span className="text-sm font-black text-white hidden sm:block">join<em className="text-[#1DB954] not-italic">the</em>Q</span>
          </a>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Bell size={16} className="text-white/70" />
                  {unreadCount !== undefined && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-[#0d0d0d]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1DB954] to-[#169c46] flex items-center justify-center text-[9px] font-black text-white">
                      {initials}
                    </div>
                    <span className="text-xs font-bold text-white/80 max-w-[80px] truncate">
                      {currentUser.full_name?.split(" ")[0]}
                    </span>
                    <ChevronDown size={12} className="text-white/40" />
                  </button>
                  <ProfileDropdown
                    isOpen={showProfileMenu}
                    onClose={() => setShowProfileMenu(false)}
                    user={currentUser}
                    onOpenNotifications={() => setShowNotifications(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLogin(true)}
                  className="h-9 px-4 rounded-xl border border-white/20 text-white text-[11px] font-black hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  <LogIn size={14} /> Log In
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="h-9 px-4 rounded-xl bg-[#1DB954] text-white text-[11px] font-black hover:bg-[#169c46] transition-all flex items-center gap-1.5 shadow-lg shadow-[#1DB954]/20"
                >
                  <UserPlus size={14} /> Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && (
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <Bell size={16} className="text-white/70" />
                {unreadCount !== undefined && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-[#0d0d0d]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              {showMobileMenu ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-14 right-0 z-50 h-[calc(100vh-3.5rem)] w-[280px] bg-gradient-to-b from-zinc-900 to-black border-l border-white/10 shadow-2xl md:hidden"
            >
              {currentUser && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DB954] to-[#169c46] flex items-center justify-center text-sm font-black text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-black">{currentUser.full_name}</p>
                      <p className="text-[10px] text-white/40">@{currentUser.username || currentUser.email}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="py-2 overflow-y-auto h-[calc(100%-5rem)]">
                {mobileMenuItems.map((item: any, i) =>
                  item.type === "divider" ? (
                    <div key={i} className="h-px bg-white/5 my-2" />
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-bold transition-colors ${
                        item.danger ? "text-red-400 hover:bg-red-500/10" : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <span className={item.danger ? "text-red-400" : "text-white/40"}>{item.icon}</span>
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => { setShowLogin(false); setTimeout(() => setShowRegister(true), 100); }}
        onSuccess={handleLoginSuccess}
        referralCode={referralCode}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => { setShowRegister(false); setTimeout(() => setShowLogin(true), 100); }}
        onSuccess={handleRegisterSuccess}
        referralCode={referralCode}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={convexUserId}
      />
    </>
  );
}
