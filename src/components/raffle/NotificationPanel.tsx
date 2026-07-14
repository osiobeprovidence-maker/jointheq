import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell, CheckCheck, CheckCircle2, Trash2, AlertCircle, Music, CreditCard, Shield, MessageCircle, Gift, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users"> | "";
}

const typeIcons: Record<string, React.ReactNode> = {
  admin: <Shield size={14} />,
  alert: <AlertCircle size={14} />,
  payment: <CreditCard size={14} />,
  subscription: <Music size={14} />,
  promotion: <Gift size={14} />,
  system: <Sparkles size={14} />,
  message: <MessageCircle size={14} />,
};

const typeColors: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-400",
  alert: "bg-red-500/20 text-red-400",
  payment: "bg-emerald-500/20 text-emerald-400",
  subscription: "bg-[#1DB954]/20 text-[#1DB954]",
  promotion: "bg-amber-500/20 text-amber-400",
  system: "bg-blue-500/20 text-blue-400",
  message: "bg-cyan-500/20 text-cyan-400",
};

export function NotificationPanel({ isOpen, onClose, userId }: NotificationPanelProps) {
  const notifications = useQuery(
    api.notifications.list,
    userId ? { user_id: userId as Id<"users"> } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.remove);

  if (!userId) return null;

  const sorted = notifications ? [...notifications].sort((a, b) => b.created_at - a.created_at) : [];

  const handleMarkRead = async (id: Id<"notifications">) => {
    try { await markAsRead({ notification_id: id }); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await markAllAsRead({ user_id: userId as Id<"users"> }); } catch {}
  };

  const handleDelete = async (id: Id<"notifications">) => {
    try { await removeNotification({ notification_id: id }); } catch {}
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-gradient-to-b from-zinc-900 to-black border-l border-white/10 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-[#1DB954]" />
                  <h2 className="text-base font-black">Notifications</h2>
                  {sorted.length > 0 && (
                    <span className="text-[10px] text-white/40 font-bold">({sorted.length})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sorted.some((n) => !n.is_read) && (
                    <button
                      onClick={handleMarkAllRead}
                      className="h-8 px-3 rounded-xl bg-white/10 text-[10px] font-black hover:bg-white/20 flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCheck size={12} /> Mark All Read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!notifications ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin" />
                  </div>
                ) : sorted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <Bell size={40} className="text-white/10 mb-4" />
                    <p className="text-white/40 text-sm font-bold">No notifications yet</p>
                    <p className="text-white/20 text-xs mt-1">You'll see updates here for payments, referrals, and more.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {sorted.map((n) => (
                      <div
                        key={n._id}
                        className={`p-4 transition-colors ${n.is_read ? "opacity-60" : "bg-white/[0.02]"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            typeColors[n.type] || "bg-white/10 text-white/50"
                          }`}>
                            {typeIcons[n.type] || <Bell size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs ${n.is_read ? "font-bold" : "font-black"} leading-snug`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {!n.is_read && (
                                  <button
                                    onClick={() => handleMarkRead(n._id as Id<"notifications">)}
                                    className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCircle2 size={12} className="text-white/30" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n._id as Id<"notifications">)}
                                  className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={12} className="text-white/30" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-white/20 mt-1 font-bold">
                              {new Date(n.created_at).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                            {n.cta_text && n.cta_url && (
                              <a
                                href={n.cta_url}
                                className="inline-block mt-2 text-[10px] font-black text-[#1DB954] hover:underline"
                              >
                                {n.cta_text} →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
