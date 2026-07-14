import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Ticket, Share2, Bell, Music, ShoppingBag, Settings, LogOut, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/auth";
import type { User as UserType } from "../../types";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onOpenNotifications: () => void;
}

export function ProfileDropdown({ isOpen, onClose, user, onOpenNotifications }: ProfileDropdownProps) {
  const navigate = useNavigate();

  if (!user) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    onClose();
    auth.logout();
  };

  const items = [
    { icon: <Ticket size={15} />, label: "My Tickets", action: () => { document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { icon: <Share2 size={15} />, label: "My Referrals", action: () => { document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" }); onClose(); } },
    { icon: <Bell size={15} />, label: "Notifications", action: () => { onClose(); onOpenNotifications(); } },
    { icon: <Music size={15} />, label: "Spotify Subscription", action: () => handleNav("/dashboard?tab=marketplace") },
    { icon: <ShoppingBag size={15} />, label: "Purchase History", action: () => handleNav("/dashboard?tab=history") },
    { icon: <Settings size={15} />, label: "Account Settings", action: () => handleNav("/dashboard") },
    { type: "divider" as const },
    { icon: <LogOut size={15} />, label: "Logout", action: handleLogout, danger: true },
  ];

  const initials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-40 w-64 bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DB954] to-[#169c46] flex items-center justify-center text-sm font-black text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black truncate">{user.full_name}</p>
                  <p className="text-[10px] text-white/40 truncate">@{user.username || user.email}</p>
                </div>
              </div>
            </div>

            <div className="py-1">
              {items.map((item, i) =>
                item.type === "divider" ? (
                  <div key={i} className="h-px bg-white/5 my-1" />
                ) : (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                      item.danger
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className={item.danger ? "text-red-400" : "text-white/40"}>{item.icon}</span>
                    {item.label}
                    {!item.danger && <ChevronRight size={12} className="ml-auto text-white/20" />}
                  </button>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
