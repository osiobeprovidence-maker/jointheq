import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Music, Users, Ticket, Gift, Share2, Copy, CheckCircle2,
  Loader2, Clock, ChevronRight, Sparkles, TrendingUp,
  ChevronDown, X, Award, ExternalLink, LogIn, UserPlus,
  MessageCircle, Instagram, Twitter, Download, QrCode,
  RefreshCw, AlertCircle, Info, Star, ListOrdered,
  Shield, BarChart3, Crown, Medal, Globe, Smartphone,
  Youtube, Link2, ThumbsUp, CheckCircle, Target, Zap,
  Menu
} from "lucide-react";
import { auth } from "../lib/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { RaffleHeader } from "../components/raffle/RaffleHeader";
import { SpotifyPurchaseModal } from "../components/raffle/SpotifyPurchaseModal";
import { useSubscriptionStatus } from "../hooks/useSubscription";

const SPOTIFY_GREEN = "#1DB954";
const SPOTIFY_DARK = "#191414";
const BASE_URL = "https://jointheq.sbs";

function getTimeRemaining(targetDate: number) {
  const now = Date.now();
  const diff = targetDate - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

function FloatingNotes() {
  const notes = useMemo(() => {
    const symbols = ["♩", "♪", "♫", "♬", "🎵", "🎶"];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      symbol: symbols[i % symbols.length],
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 10 + Math.random() * 15,
      size: 14 + Math.random() * 20,
      opacity: 0.08 + Math.random() * 0.12,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {notes.map((n) => (
        <motion.div
          key={n.id}
          className="absolute text-white"
          style={{ left: `${n.left}%`, fontSize: n.size, opacity: n.opacity }}
          animate={{ y: [0, -window.innerHeight * 0.6], rotate: [0, 360] }}
          transition={{ duration: n.duration, repeat: Infinity, delay: n.delay, ease: "linear" }}
        >
          {n.symbol}
        </motion.div>
      ))}
    </div>
  );
}

function VinylRecord({ size = 120 }: { size?: number }) {
  return (
    <motion.div
      className="relative rounded-full flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
        style={{ boxShadow: "0 0 30px rgba(0,0,0,0.5)" }}
      />
      <div
        className="absolute rounded-full border border-gray-700"
        style={{ inset: "15%", borderWidth: 1 }}
      />
      <div
        className="absolute rounded-full border border-gray-700"
        style={{ inset: "30%", borderWidth: 1 }}
      />
      <div
        className="absolute rounded-full bg-spotify"
        style={{ width: "22%", height: "22%" }}
      />
    </motion.div>
  );
}

function AudioWave({ color = "#1DB954" }: { color?: string }) {
  const bars = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i,
    height: 0.2 + Math.random() * 0.6,
    delay: Math.random() * 0.5,
  })), []);

  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{ height: ["20%", `${bar.height * 100}%`, "20%"] }}
          transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: bar.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#1DB954", "#191414", "#ffffff", "#FFD700", "#FF6B6B", "#4ECDC4"][i % 6],
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            rotate: p.rotation,
          }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "100vh", opacity: 0, rotate: p.rotation + 360 }}
          transition={{ duration: 2 + Math.random() * 2, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

function CountdownTimer({ targetDate, expired, showWinner, raffle }: { targetDate?: number; expired: boolean; showWinner?: boolean; raffle?: any }) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(targetDate || Date.now() + 86400000));

  useEffect(() => {
    if (expired) return;
    const tick = () => setRemaining(getTimeRemaining(targetDate || Date.now() + 86400000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expired, targetDate]);

  if (showWinner) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Crown size={32} className="text-yellow-400" />
        </div>
        <p className="text-yellow-400 font-black text-lg">Winner Announced</p>
      </div>
    );
  }

  if (expired) {
    if (raffle?.frequency && raffle.frequency !== "one_time" && raffle.nextDrawDate && raffle.nextDrawDate > Date.now()) {
      return <CountdownTimer targetDate={raffle.nextDrawDate} expired={false} raffle={raffle} />;
    }
    const accent = raffle?.accentColor || SPOTIFY_GREEN;
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${accent}20` }}>
          <Sparkles size={32} style={{ color: accent }} />
        </div>
        <p className="font-black text-lg" style={{ color: accent }}>Draw In Progress</p>
      </div>
    );
  }

  const targetDateObj = targetDate ? new Date(targetDate) : new Date();
  const drawLabel = raffle?.frequency === "weekly"
    ? ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][targetDateObj.getDay()]
    : raffle?.frequency === "monthly"
    ? `${targetDateObj.getDate()} ${targetDateObj.toLocaleString('default', { month: 'short' })}`
    : "Draw";

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hours", value: remaining.hours },
    { label: "Minutes", value: remaining.minutes },
    { label: "Seconds", value: remaining.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-center mb-1">
        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
          {raffle?.frequency && raffle.frequency !== "one_time" ? `Next Draw` : `Draw`}
        </p>
        <p className="text-sm font-black text-white mt-0.5">
          {drawLabel}
          {raffle?.drawTime && ` at ${raffle.drawTime}`}
        </p>
      </div>
    <div className="flex gap-3 sm:gap-4">
      {units.map((u) => (
        <div key={u.label} className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {String(u.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/60 mt-1 block uppercase tracking-widest">
            {u.label}
          </span>
        </div>
      ))}
    </div>
    </div>
  );
}

function ReferralQrModal({ link, onClose }: { link: string; onClose: () => void }) {
  const [qrLoaded, setQrLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setQrLoaded(true);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
  }, [link]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(link)}`
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "raffle-referral-qr.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Failed to download QR code");
    }
  }, [link]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black">Referral QR Code</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 flex items-center justify-center min-h-[220px]">
          {qrLoaded ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`}
              alt="Referral QR Code"
              className="w-full max-w-[220px]"
            />
          ) : (
            <Loader2 size={32} className="animate-spin text-zinc-400" />
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex-1 h-10 rounded-xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied!"); }}
            className="flex-1 h-10 rounded-xl border border-black/10 text-xs font-black hover:bg-zinc-50 flex items-center justify-center gap-1.5"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const FAQ_DATA = [
  {
    q: "Who can join?",
    a: "Anyone with an active subscription on Q can enter the raffle. You must have a verified account and meet the eligibility requirements.",
  },
  {
    q: "How are winners selected?",
    a: "Winners are selected using a weighted random draw. Every ticket counts as one entry, so more tickets = higher chance of winning. The draw runs securely on our servers with a complete audit log.",
  },
  {
    q: "How do referrals work?",
    a: "After qualifying, you're automatically entered. Share your unique referral link — every friend who purchases through your link earns you an additional raffle ticket.",
  },
  {
    q: "Can I transfer tickets?",
    a: "No, raffle tickets are non-transferable and tied to your account. They cannot be sold, traded, or transferred to another user.",
  },
  {
    q: "What if my subscription ends?",
    a: "You must maintain an active subscription until the draw date. If your subscription is cancelled or refunded, your entry may be invalidated.",
  },
];

function StarRating({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={s <= level ? "text-yellow-400 fill-yellow-400" : "text-white/20"}
        />
      ))}
    </div>
  );
}

function XCircle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function RafflePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.getCurrentUser());
  const [raffle, setRaffle] = useState<any>(null);
  const [userEntry, setUserEntry] = useState<any>(null);
  const [userTickets, setUserTickets] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [entryResult, setEntryResult] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoEnterAttempted, setAutoEnterAttempted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [verifyingStates, setVerifyingStates] = useState<Record<string, { step: string; timerEnd: number }>>({});
  const [showNav, setShowNav] = useState(false);

  const convexUserId = (currentUser?._id || "") as Id<"users">;

  const userSlotsQuery = useQuery(
    api.subscriptions.getSlotsByUserId,
    convexUserId ? { user_id: convexUserId } : "skip"
  );
  const activeSpotifySlot = (userSlotsQuery || []).find(
    (s: any) => s.sub_name?.toLowerCase().includes("spotify") && (s.status === "filled" || s.status === "closing")
  );

  const raffleQuery = useQuery(api.raffle.getActiveRaffle);
  const raffleId = raffleQuery?._id as Id<"raffles"> | undefined;

  const entryQuery = useQuery(
    api.raffle.getUserEntry,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );
  const ticketsQuery = useQuery(
    api.raffle.getUserTickets,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );
  const referralsQuery = useQuery(
    api.raffle.getUserReferrals,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );
  const statsQuery = useQuery(
    api.raffle.getRaffleStats,
    raffleId ? { raffleId } : "skip"
  );
  const leaderboardQuery = useQuery(
    api.raffle.getLeaderboard,
    raffleId ? { raffleId, limit: 10 } : "skip"
  );
  const ticketHistoryQuery = useQuery(
    api.raffle.getTicketHistory,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );
  const winnersQuery = useQuery(
    api.raffle.getRaffleWinnersWithUsers,
    raffleId ? { raffleId } : "skip"
  );
  const queryEligibility = useQuery(
    api.raffle.checkEligibility,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );

  const autoEnterMutation = useMutation(api.raffle.autoEnterForSpotifyPurchase);

  const { hasActive: hasSpotifySubscription, isLoading: loadingSubscription } = useSubscriptionStatus(convexUserId, "spotify");

  const bonusTasksQuery = useQuery(
    api.raffle.getBonusTasks,
    raffleId ? { raffleId } : "skip"
  );
  const userBonusCompletionsQuery = useQuery(
    api.raffle.getUserBonusCompletions,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );
  const recordBonusTaskVisitMutation = useMutation(api.raffle.recordBonusTaskVisit);
  const verifyBonusTaskMutation = useMutation(api.raffle.verifyBonusTask);

  useEffect(() => {
    if (raffleQuery !== undefined) {
      setRaffle(raffleQuery);
      setLoading(false);
    }
  }, [raffleQuery]);

  useEffect(() => {
    if (entryQuery !== undefined) setUserEntry(entryQuery);
  }, [entryQuery]);

  useEffect(() => {
    if (ticketsQuery !== undefined) setUserTickets(ticketsQuery);
  }, [ticketsQuery]);

  useEffect(() => {
    if (referralsQuery !== undefined) setReferrals(referralsQuery);
  }, [referralsQuery]);

  useEffect(() => {
    if (queryEligibility !== undefined) setEligibility(queryEligibility);
  }, [queryEligibility]);

  useEffect(() => {
    const interval = setInterval(() => {
      const u = auth.getCurrentUser();
      if (u?._id !== currentUser?._id) setCurrentUser(u);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Auto-enter raffle when user has Spotify but hasn't entered yet
  useEffect(() => {
    if (!raffleId || !currentUser || autoEnterAttempted) return;
    if (eligibility === null || eligibility === undefined) return;
    if (eligibility.eligible === true && !eligibility.reason?.includes("already")) {
      setAutoEnterAttempted(true);
      autoEnterMutation({ userId: convexUserId })
        .then((result) => {
          if (result.entered) {
            setShowCelebration(true);
            setEntryResult({ raffleNumber: result.raffleNumber, ticketCount: 1 });
            toast.success("You're automatically entered in the raffle!");
          }
        })
        .catch(() => {});
    } else {
      setAutoEnterAttempted(true);
    }
  }, [raffleId, currentUser, eligibility, convexUserId, autoEnterMutation, autoEnterAttempted]);

  const raffleAccent = raffle?.accentColor || SPOTIFY_GREEN;
  const referralLink = currentUser
    ? `${BASE_URL}/raffle?ref=${currentUser.referral_code}`
    : "";
  const referralCode = currentUser?.referral_code || "";

  const handleCopyReferralLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy"));
  }, [referralLink]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopiedCode(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }).catch(() => toast.error("Failed to copy"));
  }, [referralCode]);

  const handleShare = useCallback((platform: string) => {
    const text = `🎵 I'm in the ${raffle?.title || "Raffle"} on Q! ${raffle?.description ? raffle.description.slice(0, 60) : "Join and you could win"} ₦${(raffle?.prizeAmount || 5000).toLocaleString()}. Use my link: ${referralLink}`;
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(text);
      toast.success("Copied!");
      return;
    }
    if (urls[platform]) window.open(urls[platform], "_blank");
  }, [referralLink, raffle]);

  const handleRecordVisit = useCallback(async (taskId: string, destinationUrl?: string) => {
    if (!raffleId || !currentUser || completingTaskId) return;
    setCompletingTaskId(taskId);
    try {
      await recordBonusTaskVisitMutation({
        raffleId,
        taskId: taskId as any,
        userId: convexUserId,
      });

      if (destinationUrl) {
        window.open(destinationUrl, "_blank", "noopener,noreferrer");
      }

      const timerDuration = 25000;
      setVerifyingStates(prev => ({
        ...prev,
        [taskId]: { step: "waiting", timerEnd: Date.now() + timerDuration },
      }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to start task");
    } finally {
      setCompletingTaskId(null);
    }
  }, [raffleId, currentUser, convexUserId, recordBonusTaskVisitMutation, completingTaskId]);

  const handleVerifyTask = useCallback(async (taskId: string) => {
    if (!raffleId || !currentUser || completingTaskId) return;
    setCompletingTaskId(taskId);
    try {
      const result = await verifyBonusTaskMutation({
        raffleId,
        taskId: taskId as any,
        userId: convexUserId,
      });
      toast.success(`You earned +${result.ticketsAwarded} raffle tickets!`);
      setVerifyingStates(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify task");
    } finally {
      setCompletingTaskId(null);
    }
  }, [raffleId, currentUser, convexUserId, verifyBonusTaskMutation, completingTaskId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setVerifyingStates(prev => {
        const next: Record<string, { step: string; timerEnd: number }> = {};
        let changed = false;
        for (const [taskId, state] of Object.entries(prev)) {
          if (state.step === "waiting" && now >= state.timerEnd) {
            next[taskId] = { ...state, step: "verify" };
            changed = true;
          } else {
            next[taskId] = state;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const completionMap = useMemo(() => {
    const map = new Map<string, any>();
    (userBonusCompletionsQuery || []).forEach((c: any) => {
      map.set(c.taskId, c);
    });
    return map;
  }, [userBonusCompletionsQuery]);

  const permanentTasks = useMemo(() =>
    (bonusTasksQuery || []).filter((t: any) => t.type !== "daily"),
    [bonusTasksQuery]
  );

  const dailyTasks = useMemo(() =>
    (bonusTasksQuery || []).filter((t: any) => t.type === "daily"),
    [bonusTasksQuery]
  );

  const getNextDailyReset = useCallback(() => {
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return nextReset.getTime();
  }, []);

  const [dailyResetCountdown, setDailyResetCountdown] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const nextReset = getNextDailyReset();
      const diff = Math.max(0, nextReset - now);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDailyResetCountdown(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [getNextDailyReset]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191414] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: `${raffleAccent}30`, borderTopColor: raffleAccent }} />
          <p className="text-white/60 text-sm font-bold">Loading raffle...</p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-[#191414] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Music size={48} style={{ color: raffleAccent }} className="mb-4 mx-auto" />
          <h1 className="text-2xl font-black text-white mb-2">No Active Raffle</h1>
          <p className="text-white/60 text-sm">There's no active raffle right now. Check back later!</p>
        </div>
      </div>
    );
  }

  const isEligible = eligibility?.eligible === true;
  const isAlreadyEntered = eligibility?.reason === "already_entered" || !!userEntry;
  const needsSubscription = eligibility?.reason === "no_spotify_subscription";
  const needsAuth = !currentUser;
  const raffleExpired = (raffle.drawDate || 0) < Date.now();
  const isCompleted = raffle.status === "completed";
  const isWinnerAnnounced = raffle.winnerAnnounced;
  const totalTickets = userTickets?.totalTickets ?? 0;
  const completedReferrals = referrals.filter((r: any) => r.status === "completed");
  const chanceLevel = Math.min(5, Math.ceil(totalTickets / 3) || 1);

  return (
    <div className="min-h-screen bg-[#191414] text-white">
      <Confetti active={showCelebration} />

      <RaffleHeader
        currentUser={currentUser}
        onUserChange={(u) => setCurrentUser(u)}
        showLogin={showLogin}
        setShowLogin={setShowLogin}
        showRegister={showRegister}
        setShowRegister={setShowRegister}
      />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-[#0d0d0d] to-[#191414]">
        <FloatingNotes />
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${raffleAccent}08` }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: `${raffleAccent}08` }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
                  style={{ backgroundColor: `${raffleAccent}15`, borderColor: `${raffleAccent}30`, color: raffleAccent }}
                >
                  <Music size={12} /> {raffle?.title || "Active Raffle"}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
                  {raffle?.heroTitle?.split("|")[0] || "Buy Spotify."}
                  <br />
                  <span style={{ color: raffleAccent }}>{raffle?.heroTitle?.split("|")[1] || "Invite Friends."}</span>
                  <br />
                  Win <span style={{ color: raffleAccent }}>₦{(raffle?.prizeAmount || 5000).toLocaleString()}</span>.
                </h1>
                <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto lg:mx-0 mb-6">
                  {raffle?.description
                    ? raffle.description
                    : `Purchase Spotify Premium on Q to receive your first raffle ticket. Every successful referral earns you even more tickets, increasing your chances of winning ₦${(raffle?.prizeAmount || 5000).toLocaleString()} cash.`}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  {needsAuth ? (
                    <>
                      <button
                        onClick={() => setShowLogin(true)}
                        className="h-12 px-8 rounded-2xl text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg"
                        style={{ backgroundColor: raffleAccent, boxShadow: `0 10px 15px -3px ${raffleAccent}30` }}
                      >
                        <LogIn size={16} /> Log In
                      </button>
                      <button
                        onClick={() => setShowRegister(true)}
                        className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black hover:bg-white/20 transition-all flex items-center gap-2"
                      >
                        <UserPlus size={16} /> Create Account
                      </button>
                    </>
                  ) : isAlreadyEntered || isCompleted ? (
                    <button
                      onClick={() => document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" })}
                      className="h-12 px-8 rounded-2xl text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg"
                      style={{ backgroundColor: raffleAccent, boxShadow: `0 10px 15px -3px ${raffleAccent}30` }}
                    >
                      <CheckCircle2 size={16} /> You're Entered
                    </button>
                  ) : queryEligibility === undefined && currentUser ? (
                    <div className="h-12 px-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white/40 text-xs font-black flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Checking eligibility...
                    </div>
                  ) : isEligible && !autoEnterAttempted ? (
                    <div className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Auto-Entering...
                    </div>
                  ) : needsSubscription && !hasSpotifySubscription ? (
                    <button
                      onClick={() => setShowPurchaseModal(true)}
                      className="h-12 px-8 rounded-2xl text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg"
                      style={{ backgroundColor: raffleAccent, boxShadow: `0 10px 15px -3px ${raffleAccent}30` }}
                    >
                      <Music size={16} /> Get {raffle?.purchaseLabel || "Spotify Premium"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                      <AlertCircle size={16} /> Enter Raffle
                    </div>
                  )}
                  <button
                    onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                    className="h-12 px-6 rounded-2xl text-white/60 text-xs font-bold hover:text-white transition-all flex items-center gap-1"
                  >
                    How It Works <ChevronDown size={14} />
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="flex-shrink-0 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative flex items-center justify-center">
                {/* Glow behind mascot */}
                <div
                  className="absolute rounded-full blur-3xl"
                  style={{
                    width: "120%",
                    height: "120%",
                    backgroundColor: `${raffleAccent}20`,
                  }}
                />
                {raffle?.banner ? (
                  <motion.img
                    src={raffle.banner}
                    alt="Campaign artwork"
                    className="relative object-contain"
                    style={{
                      width: "clamp(220px, 35vw, 480px)",
                      height: "auto",
                      aspectRatio: "1/1",
                    }}
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 1, 0],
                    }}
                    transition={{
                      y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                    }}
                    loading="eager"
                  />
                ) : (
                  <motion.div
                    className="relative flex items-center justify-center"
                    style={{
                      width: "clamp(220px, 35vw, 480px)",
                      aspectRatio: "1/1",
                    }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                  >
                    <svg width="60%" height="60%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="40" width="100" height="65" rx="8" stroke={`${raffleAccent}60`} strokeWidth="3" fill={`${raffleAccent}08`} />
                      <path d="M10 55h100" stroke={`${raffleAccent}60`} strokeWidth="3" />
                      <path d="M40 30L60 40L80 30" stroke={`${raffleAccent}60`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <circle cx="60" cy="65" r="8" stroke={`${raffleAccent}50`} strokeWidth="2.5" fill="none" />
                      <circle cx="60" cy="85" r="8" stroke={`${raffleAccent}50`} strokeWidth="2.5" fill="none" />
                    </svg>
                  </motion.div>
                )}
                <div
                  className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 text-white text-xs font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg z-10"
                  style={{ backgroundColor: raffleAccent, boxShadow: `0 10px 15px -3px ${raffleAccent}40` }}
                >
                  ₦{(raffle?.prizeAmount || 5000).toLocaleString()} Prize
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AudioWave color={raffleAccent} />
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
              {raffle?.frequency && raffle.frequency !== "one_time" ? "Recurring Draw" : `Draw: ${raffle?.drawDate ? new Date(raffle.drawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}`}
            </p>
            <AudioWave color={raffleAccent} />
          </motion.div>

          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <CountdownTimer targetDate={raffle?.nextDrawDate || raffle?.drawDate} expired={raffleExpired && !isWinnerAnnounced} showWinner={isWinnerAnnounced} raffle={raffle} />
          </motion.div>
        </div>
      </section>

      {/* ===== ALREADY ENTERED BANNER ===== */}
      {isAlreadyEntered && !raffleExpired && (
        <section className="py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-3xl p-4 sm:p-6 flex items-center gap-4"
              style={{ backgroundColor: `${raffleAccent}10`, borderColor: `${raffleAccent}20` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${raffleAccent}20` }}
              >
                <CheckCircle2 size={24} style={{ color: raffleAccent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm sm:text-base">You already qualify for this raffle.</p>
                <p className="text-white/60 text-xs mt-0.5">Share your referral link to earn more tickets and increase your chances.</p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== SPOTIFY SUBSCRIPTION STATUS ===== */}
      {currentUser && activeSpotifySlot && (
        <section className="py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5"
            >
              <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                <Music size={16} style={{ color: raffleAccent }} /> Spotify Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: raffleAccent }} />
                    <span className="text-sm font-black" style={{ color: raffleAccent }}>Active</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Plan</p>
                  <p className="text-sm font-black">{activeSpotifySlot.slot_name || activeSpotifySlot.sub_name || "Spotify Premium"}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Renewal</p>
                  <p className="text-sm font-black">
                    {(() => {
                      if (!activeSpotifySlot.renewal_date) return "N/A";
                      const d = new Date(activeSpotifySlot.renewal_date);
                      const now = Date.now();
                      const daysLeft = Math.ceil((d.getTime() - now) / (1000 * 60 * 60 * 24));
                      if (daysLeft <= 0) return <span className="text-red-400">Expired</span>;
                      return <>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>;
                    })()}
                  </p>
                  {(() => {
                    if (!activeSpotifySlot.renewal_date) return null;
                    const daysLeft = Math.ceil((new Date(activeSpotifySlot.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 0) return null;
                    return <p className="text-[9px] text-white/40 mt-0.5">{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</p>;
                  })()}
                </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tickets</p>
                  <p className="text-sm font-black" style={{ color: raffleAccent }}>{totalTickets}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== SECTION NAVIGATION ===== */}
      {raffle && (
        <div className="sticky top-0 z-40 bg-[#191414]/90 backdrop-blur-xl border-b border-white/5 overflow-x-auto">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-0.5 py-2">
            {(() => {
              const items = [
                { id: "stats", label: "Overview", icon: <BarChart3 size={12} /> },
                { id: "how-it-works", label: "How It Works", icon: <Info size={12} /> },
                { id: "leaderboard", label: "Leaderboard", icon: <Users size={12} /> },
                { id: "prize-section", label: "Prizes", icon: <Award size={12} /> },
                { id: "winners-section", label: "Winners", icon: <Crown size={12} /> },
              ];
              if (isAlreadyEntered || isCompleted) {
                items.push({ id: "earn-more-tickets", label: "Earn More Tickets", icon: <Zap size={12} /> });
              }
              return items;
            })().map((section) => (
              <button key={section.id} onClick={() => {
                const el = document.getElementById(section.id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
                className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10"
                style={{ color: raffleAccent }}>
                {section.icon} {section.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== CAMPAIGN STATISTICS ===== */}
      <section id="stats" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
              Campaign <span style={{ color: raffleAccent }}>Statistics</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: "Prize Amount", value: `₦${(statsQuery?.prizeAmount || raffle.prizeAmount || 5000).toLocaleString()}`, icon: <Award size={18} /> },
                { label: "Draw Date", value: raffle.drawDate ? new Date(raffle.drawDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "TBA", icon: <Clock size={18} /> },
                { label: "Participants", value: statsQuery?.totalParticipants ?? raffle.totalEntrants ?? 0, icon: <Users size={18} /> },
                { label: "Total Tickets", value: statsQuery?.totalTickets ?? raffle.totalTickets ?? 0, icon: <Ticket size={18} /> },
                { label: "Days Remaining", value: statsQuery?.daysRemaining ?? 0, icon: <TrendingUp size={18} /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: raffleAccent }}>
                    {stat.icon}
                  </div>
                  <div className="text-xl sm:text-2xl font-black">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== MY TICKETS + REFERRAL ===== */}
      {currentUser && (
        <section id="my-tickets" className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
                My <span style={{ color: raffleAccent }}>Tickets</span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{raffle?.purchaseLabel || "Spotify Purchase"}</div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={20} style={{ color: raffleAccent }} />
                      <motion.div
                        className="text-3xl font-black"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                      >
                        1
                      </motion.div>
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden">
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8"
                      style={{ backgroundColor: `${raffleAccent}10` }}
                    />
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Successful Referrals</div>
                    <motion.div
                      className="text-3xl font-black"
                      style={{ color: raffleAccent }}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                    >
                      {completedReferrals.length}
                    </motion.div>
                  </div>
                  <div
                    className="rounded-3xl p-6 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${raffleAccent}30, transparent)`,
                      borderColor: `${raffleAccent}40`,
                      borderWidth: 1,
                    }}
                  >
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total Tickets</div>
                    <motion.div
                      className="text-4xl font-black"
                      style={{ color: raffleAccent }}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                    >
                      {totalTickets}
                    </motion.div>
                  </div>
                </div>

                {/* Referral Card */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                  <h3 className="text-sm font-black mb-1 flex items-center gap-2">
                    <Share2 size={16} style={{ color: raffleAccent }} /> Invite Friends
                  </h3>
                  <p className="text-white/50 text-xs mb-4">
                    {raffle?.referralDescription || `Earn one additional ticket every time someone buys ${raffle?.purchaseLabel || "Spotify"} using your referral.`}
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-white/70 truncate">{referralLink}</code>
                        <button
                          onClick={handleCopyReferralLink}
                          className="shrink-0 h-8 px-3 rounded-lg text-white text-[10px] font-black flex items-center gap-1"
                          style={{ backgroundColor: raffleAccent }}
                        >
                          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center justify-between">
                      <span className="text-xs text-white/60 font-bold">Your Code: <span className="text-white font-black">{referralCode}</span></span>
                      <button
                        onClick={handleCopyCode}
                        className="shrink-0 h-7 px-2.5 rounded-lg bg-white/10 text-white text-[10px] font-black hover:bg-white/20 flex items-center gap-1"
                      >
                        {copiedCode ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleShare("whatsapp")} className="flex-1 h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] text-[10px] font-black hover:bg-[#25D366]/30 flex items-center justify-center gap-1.5">
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                      <button onClick={() => handleShare("telegram")} className="flex-1 h-9 rounded-xl bg-[#0088cc]/20 text-[#0088cc] text-[10px] font-black hover:bg-[#0088cc]/30 flex items-center justify-center gap-1.5">
                        <SendIcon size={14} /> Telegram
                      </button>
                      <button onClick={() => setShowQrModal(true)} className="h-9 w-9 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">
                        <QrCode size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== USER PROGRESS ===== */}
      {currentUser && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
            >
               <h3 className="text-base font-black mb-4">Your Progress</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1"
                    style={{ backgroundColor: userTickets?.spotifyPurchased ? `${raffleAccent}20` : "rgba(255,255,255,0.05)" }}>
                    {userTickets?.spotifyPurchased ? (
                      <CheckCircle2 size={18} style={{ color: raffleAccent }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{raffle?.purchaseLabel || "Spotify"} Purchased</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1"
                    style={{ backgroundColor: totalTickets > 0 ? `${raffleAccent}20` : "rgba(255,255,255,0.05)" }}>
                    {totalTickets > 0 ? (
                      <CheckCircle2 size={18} style={{ color: raffleAccent }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Entered Raffle</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-1">
                    <span className="text-amber-400 font-black text-sm">{completedReferrals.length}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Referrals</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-1">
                    <span className="text-purple-400 font-black text-sm">{totalTickets}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Tickets</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white/60">Chance Level</span>
                <StarRating level={chanceLevel} />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== EARN MORE TICKETS ===== */}
      {isAlreadyEntered && (
        <section id="earn-more-tickets" className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${raffleAccent}20` }}>
                  <Zap size={28} style={{ color: raffleAccent }} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-2">
                  Earn More <span style={{ color: raffleAccent }}>Tickets</span>
                </h2>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  Complete simple tasks to earn bonus raffle tickets and increase your chances of winning.
                </p>
              </div>

              {/* Ticket Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Base Tickets", value: userTickets?.initialEntry ?? 0, icon: <Ticket size={14} />, color: raffleAccent },
                  { label: "Referral Tickets", value: userTickets?.referralBonus ?? 0, icon: <Users size={14} />, color: "#f59e0b" },
                  { label: "Bonus Task Tickets", value: userTickets?.bonusTaskTickets ?? 0, icon: <Zap size={14} />, color: "#8b5cf6" },
                  { label: "Total Tickets", value: totalTickets, icon: <Award size={14} />, color: raffleAccent },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: s.color }}>
                      {s.icon}
                    </div>
                    <div className="text-xl sm:text-2xl font-black">{s.value}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress Card */}
              {(permanentTasks.length > 0 || dailyTasks.length > 0) && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black flex items-center gap-2">
                        <Target size={16} style={{ color: raffleAccent }} /> Bonus Challenges
                      </h3>
                      {(() => {
                        const allTasks = [...permanentTasks, ...dailyTasks];
                        const completedCount = allTasks.filter((t: any) => {
                          const c = completionMap.get(t._id);
                          return c && (c.status === "verified" || c.status === "completed");
                        }).length;
                        const totalCount = allTasks.length;
                        const totalPotential = allTasks.reduce((sum: number, t: any) => sum + t.rewardTickets, 0);
                        const earnedBonus = userTickets?.bonusTaskTickets ?? 0;
                        const remaining = totalPotential - earnedBonus;
                        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                        return (
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <span className="text-xs text-white/60">Completed: <strong className="text-white font-black">{completedCount}</strong> / {totalCount}</span>
                              <span className="text-xs text-white/60">Bonus Earned: <strong className="text-white font-black" style={{ color: raffleAccent }}>+{earnedBonus}</strong></span>
                              {remaining > 0 && (
                                <span className="text-xs text-white/60">Potential Remaining: <strong className="text-white font-black">+{remaining}</strong></span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: raffleAccent }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${progress}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Task Cards */}
              {!bonusTasksQuery ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin" style={{ color: raffleAccent }} />
                </div>
              ) : bonusTasksQuery.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center">
                  <Zap size={32} className="mx-auto text-white/20 mb-3" />
                  <p className="text-white/40 text-sm font-bold">There are no bonus ticket challenges available right now. Check back soon!</p>
                </div>
              ) : (
                <>
                  {/* Permanent Challenges */}
                  {permanentTasks.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Permanent Challenges</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {permanentTasks.map((task: any) => {
                          const completion = completionMap.get(task._id);
                          const isVerified = completion && (completion.status === "verified" || completion.status === "completed");
                          const vState = verifyingStates[task._id];
                          const isLoading = completingTaskId === task._id;
                          const countdown = vState && vState.step === "waiting" ? Math.max(0, Math.ceil((vState.timerEnd - Date.now()) / 1000)) : 0;
                          return (
                            <div key={task._id}
                              className={`rounded-2xl p-5 border transition-all ${isVerified ? "border-emerald-500/30 bg-emerald-500/5" : vState?.step === "verify" ? "border-violet-500/30 bg-violet-500/10" : "bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20"}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? "bg-emerald-500/20" : "bg-white/10"}`}
                                  style={!isVerified ? { color: raffleAccent } : { color: "#10b981" }}>
                                  {isVerified ? <CheckCircle size={18} /> : PLATFORM_ICONS[task.platform] || <Zap size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-black truncate">{task.name}</h4>
                                    {isVerified && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black shrink-0">Completed</span>
                                    )}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-black shrink-0">Permanent</span>
                                  </div>
                                  {task.description && <p className="text-xs text-white/50 mt-0.5">{task.description}</p>}
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-black" style={{ color: raffleAccent }}>+{task.rewardTickets} ticket{task.rewardTickets !== 1 ? "s" : ""}</span>
                                    <span className="text-[9px] text-white/30 font-medium">{task.platform}</span>
                                  </div>
                                </div>
                              </div>
                              {!isVerified && (
                                <div className="mt-4">
                                  {!vState ? (
                                    <button onClick={() => handleRecordVisit(task._id, task.destinationUrl)} disabled={isLoading}
                                      className="w-full h-9 rounded-xl bg-white/10 text-white text-[10px] font-black hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                                      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                                      {isLoading ? "Starting..." : "Complete Task"}
                                    </button>
                                  ) : vState.step === "waiting" ? (
                                    <button disabled
                                      className="w-full h-9 rounded-xl bg-white/5 text-white/50 text-[10px] font-black flex items-center justify-center gap-1.5 cursor-not-allowed">
                                      <Loader2 size={12} className="animate-spin" />
                                      Wait {countdown}s
                                    </button>
                                  ) : vState.step === "verify" ? (
                                    <button onClick={() => handleVerifyTask(task._id)} disabled={isLoading}
                                      className="w-full h-9 rounded-xl bg-violet-500/30 text-violet-300 text-[10px] font-black hover:bg-violet-500/40 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                                      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                      {isLoading ? "Verifying..." : "Verify Task"}
                                    </button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Daily Challenges */}
                  {dailyTasks.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Daily Challenges</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold">
                          <Clock size={12} />
                          Resets in <span className="text-white font-black">{dailyResetCountdown}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dailyTasks.map((task: any) => {
                          const completion = completionMap.get(task._id);
                          const todayStart = new Date();
                          todayStart.setUTCHours(0, 0, 0, 0);
                          const completedToday = completion && completion.completedAt >= todayStart.getTime();
                          const isVerified = completion && (completion.status === "verified" || completion.status === "completed") && completedToday;
                          const vState = verifyingStates[task._id];
                          const isLoading = completingTaskId === task._id;
                          const countdown = vState && vState.step === "waiting" ? Math.max(0, Math.ceil((vState.timerEnd - Date.now()) / 1000)) : 0;
                          return (
                            <div key={task._id}
                              className={`rounded-2xl p-5 border transition-all ${isVerified ? "border-emerald-500/30 bg-emerald-500/5" : vState?.step === "verify" ? "border-violet-500/30 bg-violet-500/10" : "bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20"}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? "bg-emerald-500/20" : "bg-white/10"}`}
                                  style={!isVerified ? { color: raffleAccent } : { color: "#10b981" }}>
                                  {isVerified ? <CheckCircle size={18} /> : <RefreshCw size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-black truncate">{task.name}</h4>
                                    {isVerified && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black shrink-0">Completed</span>
                                    )}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 font-black shrink-0">Daily</span>
                                  </div>
                                  {task.description && <p className="text-xs text-white/50 mt-0.5">{task.description}</p>}
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-black" style={{ color: raffleAccent }}>+{task.rewardTickets} ticket{task.rewardTickets !== 1 ? "s" : ""}</span>
                                    <span className="text-[9px] text-white/30 font-medium">{task.platform}</span>
                                  </div>
                                </div>
                              </div>
                              {!isVerified && (
                                <div className="mt-4">
                                  {!vState ? (
                                    <button onClick={() => handleRecordVisit(task._id, task.destinationUrl)} disabled={isLoading}
                                      className="w-full h-9 rounded-xl bg-white/10 text-white text-[10px] font-black hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                                      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                                      {isLoading ? "Starting..." : "Complete Task"}
                                    </button>
                                  ) : vState.step === "waiting" ? (
                                    <button disabled
                                      className="w-full h-9 rounded-xl bg-white/5 text-white/50 text-[10px] font-black flex items-center justify-center gap-1.5 cursor-not-allowed">
                                      <Loader2 size={12} className="animate-spin" />
                                      Wait {countdown}s
                                    </button>
                                  ) : vState.step === "verify" ? (
                                    <button onClick={() => handleVerifyTask(task._id)} disabled={isLoading}
                                      className="w-full h-9 rounded-xl bg-violet-500/30 text-violet-300 text-[10px] font-black hover:bg-violet-500/40 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                                      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                      {isLoading ? "Verifying..." : "Verify Task"}
                                    </button>
                                  ) : null}
                                </div>
                              )}
                              </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Not joined message */}
      {currentUser && !isAlreadyEntered && !isCompleted && raffle && (
        <section className="py-16 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
              <Zap size={32} className="mx-auto text-white/20 mb-3" />
              <h3 className="text-lg font-black mb-1">Earn More Tickets</h3>
              <p className="text-white/50 text-sm mb-4">Join the raffle first to unlock bonus ticket challenges.</p>
              {loadingSubscription && queryEligibility === undefined ? (
                <div className="h-11 px-6 rounded-xl bg-white/10 text-white/40 text-xs font-black inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Checking...
                </div>
              ) : needsSubscription && !hasSpotifySubscription ? (
                <button onClick={() => setShowPurchaseModal(true)}
                  className="h-11 px-6 rounded-xl text-white text-xs font-black inline-flex items-center gap-2"
                  style={{ backgroundColor: raffleAccent }}>
                  <Music size={16} /> Join Raffle
                </button>
              ) : needsAuth ? (
                <button onClick={() => setShowLogin(true)}
                  className="h-11 px-6 rounded-xl text-white text-xs font-black inline-flex items-center gap-2"
                  style={{ backgroundColor: raffleAccent }}>
                  <LogIn size={16} /> Log In to Join
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ===== TICKET HISTORY ===== */}
      {currentUser && ticketHistoryQuery && ticketHistoryQuery.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-base font-black mb-4">Ticket History</h3>
              <div className="space-y-2">
                {ticketHistoryQuery.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === "purchase" ? "" : "bg-amber-500/20"
                      }`}
                        style={item.type === "purchase" ? { backgroundColor: `${raffleAccent}20` } : undefined}>
                        {item.type === "purchase" ? (
                          <Music size={14} style={{ color: raffleAccent }} />
                        ) : (
                          <Users size={14} className="text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.label}</p>
                        <p className="text-[10px] text-white/40">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-black" style={{ color: raffleAccent }}>+{item.tickets}</span>
                  </div>
                ))}
                <div
                  className="rounded-xl px-4 py-3 border flex items-center justify-between"
                  style={{
                    background: `linear-gradient(90deg, ${raffleAccent}10, transparent)`,
                    borderColor: `${raffleAccent}20`,
                  }}
                >
                  <span className="text-sm font-black">Total</span>
                  <span className="font-black text-lg" style={{ color: raffleAccent }}>{totalTickets} Ticket{totalTickets !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== REFERRAL HISTORY ===== */}
      {referrals.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-xl sm:text-2xl font-black mb-6">
                Referral <span style={{ color: raffleAccent }}>History</span>
              </h2>
              <div className="overflow-x-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Friend", "Status", "Reward", "Date"].map((h) => (
                        <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r: any) => (
                      <tr key={r._id} className="border-b border-white/5 last:border-0">
                        <td className="p-4 text-sm font-bold">{r.inviteeName}</td>
                        <td className="p-4">
                          <span
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black"
                            style={{
                              backgroundColor: r.status === "completed" ? `${raffleAccent}20` : r.status === "pending" ? "#f59e0b20" : "#ef444420",
                              color: r.status === "completed" ? raffleAccent : r.status === "pending" ? "#f59e0b" : "#ef4444",
                            }}
                          >
                            {r.status === "completed" ? <CheckCircle2 size={12} /> :
                             r.status === "pending" ? <Clock size={12} /> : <XCircle size={12} />}
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-black">
                          {r.rewardGranted ? `+${r.rewardTickets} tickets` : "\u2014"}
                        </td>
                        <td className="p-4 text-xs text-white/40">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== LEADERBOARD ===== */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
              Top <span style={{ color: raffleAccent }}>Referrers</span>
            </h2>
            {!leaderboardQuery ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} style={{ color: raffleAccent }} />
              </div>
            ) : leaderboardQuery.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center">
                <Users size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm font-bold">No entrants yet. Be the first!</p>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden">
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                  {leaderboardQuery.map((entry: any) => (
                    <div key={entry.userId} className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        entry.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                        entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                        entry.rank === 3 ? "bg-amber-700/20 text-amber-600" :
                        "bg-white/10 text-white/50"
                      }`}>
                        {entry.rank <= 3 ? ["", "🥇", "🥈", "🥉"][entry.rank] : `#${entry.rank}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate">@{entry.username}</p>
                        <p className="text-[10px] text-white/40">{entry.raffleNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: raffleAccent }}>{entry.ticketCount}</p>
                        <p className="text-[10px] text-white/40">Tickets</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-black mb-2">
              How It <span style={{ color: raffleAccent }}>Works</span>
            </h2>
            <p className="text-white/60 text-sm">{raffle?.howItWorksSubtitle || "Four simple steps to win big."}</p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/5 -translate-x-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  step: "01",
                  title: raffle?.step1Title || `Buy ${raffle?.purchaseLabel || "Spotify Premium"}`,
                  desc: raffle?.step1Desc || `Purchase ${raffle?.purchaseLabel || "Spotify Premium"} on Q through our marketplace. You'll automatically receive your first raffle ticket.`,
                  icon: <Music size={28} />,
                },
                {
                  step: "02",
                  title: raffle?.step2Title || "Auto-Enter the Raffle",
                  desc: raffle?.step2Desc || "Once your subscription is verified, you're automatically entered. No manual entry required.",
                  icon: <CheckCircle2 size={28} />,
                },
                {
                  step: "03",
                  title: raffle?.step3Title || "Invite Friends",
                  desc: raffle?.step3Desc || `Share your unique referral link. Every friend who buys ${raffle?.purchaseLabel || "Spotify"} through your link earns you +${raffle?.referralReward || 1} additional ticket.`,
                  icon: <Users size={28} />,
                },
                {
                  step: "04",
                  title: raffle?.step4Title || "Win Big",
                  desc: raffle?.step4Desc || `More tickets = higher chances of winning ₦${(raffle?.prizeAmount || 5000).toLocaleString()} cash.${raffle.drawDate ? ` The winner is drawn on ${new Date(raffle.drawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}`,
                  icon: <Award size={28} />,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 text-center md:text-left md:flex md:items-start md:gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-4 md:mb-0 shrink-0"
                    style={{ backgroundColor: `${raffleAccent}10` }}
                  >
                    <div style={{ color: raffleAccent }}>{s.icon}</div>
                  </div>
                  <div>
                    <div
                      className="text-[10px] font-black uppercase tracking-widest mb-1"
                      style={{ color: raffleAccent }}
                    >{s.step}</div>
                    <h3 className="text-lg font-black mb-2">{s.title}</h3>
                    <p className="text-white/60 text-sm">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center rounded-3xl p-6 max-w-lg mx-auto"
            style={{
              background: `linear-gradient(90deg, ${raffleAccent}10, transparent)`,
              borderColor: `${raffleAccent}20`,
              borderWidth: 1,
            }}>
            <p className="text-white/90 text-sm font-bold">
              {raffle?.referralCtaText || `Every successful referral gives you `}
              <span style={{ color: raffleAccent }}>+{raffle?.referralReward || 1} Ticket{raffle?.referralReward !== 1 ? "s" : ""}</span>.
            </p>
            <p className="text-white/40 text-xs mt-1">{raffle?.referralCtaSubtext || `More tickets = higher chance of winning ₦${(raffle?.prizeAmount || 5000).toLocaleString()}.`}</p>
          </div>
        </div>
      </section>

      {/* ===== ELIGIBILITY CARD ===== */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
          >
            <h3 className="text-base font-black mb-4 flex items-center gap-2">
              <Info size={18} style={{ color: raffleAccent }} /> Requirements & Eligibility
            </h3>
            <ul className="space-y-3">
              {(raffle?.eligibilityRules && raffle.eligibilityRules.length > 0
                ? raffle.eligibilityRules.map((r: any) => {
                    const labels: Record<string, string> = {
                      has_spotify: `Must purchase ${raffle?.purchaseLabel || "Spotify Premium"} through Q to enter.`,
                      min_subscription_age: `Referrals only count after successful payment by the referred friend.`,
                      account_status: "Fake or duplicate accounts are removed from the raffle.",
                      not_disqualified: "Winner must have an active subscription when the raffle ends.",
                      country: "Self-referrals and fraudulent entries are strictly prohibited.",
                    };
                    return labels[r.field] || `${r.field}: ${r.operator} ${r.value}`;
                  })
                : [
                    `Must purchase ${raffle?.purchaseLabel || "Spotify Premium"} through Q to enter.`,
                    "Referrals only count after successful payment by the referred friend.",
                    "Fake or duplicate accounts are removed from the raffle.",
                    `Winner must have an active subscription when the raffle ends.`,
                    "Self-referrals and fraudulent entries are strictly prohibited.",
                  ]
              ).map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${raffleAccent}10` }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: raffleAccent }}
                    />
                  </div>
                  <span className="text-white/70">{typeof req === "string" ? req : ""}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ===== WINNER ANNOUNCEMENT ===== */}
      {isWinnerAnnounced && winnersQuery && winnersQuery.length > 0 && (
        <section id="winners-section" className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${raffleAccent}10, transparent)`,
                borderColor: `${raffleAccent}20`,
                borderWidth: 1,
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10">
                <Crown size={48} className="mx-auto text-yellow-400 mb-4" />
                <h2 className="text-2xl sm:text-3xl font-black mb-2">Winner Announced!</h2>
                <p className="text-white/60 text-sm mb-6">Congratulations to our lucky winner!</p>
                {winnersQuery.map((w: any) => (
                  <div key={w._id} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 max-w-sm mx-auto">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white">
                      {w.position}
                    </div>
                    <p className="text-xl font-black">{w.user?.full_name || w.user?.username || "Winner"}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Award size={16} className="text-yellow-400" />
                      <span className="text-lg font-black text-yellow-400">₦{w.prize.toLocaleString()}</span>
                    </div>
                    <p className="text-white/40 text-xs mt-2">Drawn on {new Date(w.announcedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== PRIZE SECTION ===== */}
      <section id="prize-section" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${raffleAccent}10, rgba(0,0,0,0.5), #000)`,
              borderColor: `${raffleAccent}20`,
              borderWidth: 1,
            }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl"
              style={{ backgroundColor: `${raffleAccent}10` }}
            />
            <div className="relative z-10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${raffleAccent}20` }}
              >
                <Award size={28} style={{ color: raffleAccent }} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Prize Pool</h2>
              <div className="text-5xl sm:text-6xl font-black my-4" style={{ color: raffleAccent }}>
                ₦{(statsQuery?.prizeAmount || raffle.prizeAmount || 5000).toLocaleString()}
              </div>
              <p className="text-white/60 text-sm">Cash prize for the winner</p>
              {raffle.prizes && raffle.prizes.length > 0 && (
                <div className="mt-6 max-w-sm mx-auto space-y-2">
                  {raffle.prizes.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-bold">{p.label}</span>
                      <span className="font-black" style={{ color: raffleAccent }}>₦{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                <Clock size={14} /> {raffle?.drawDate ? `Winner announced ${new Date(raffle.drawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : "Draw date TBA"}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== PREVIOUS WINNERS ===== */}
      {raffle.previousWinners && raffle.previousWinners.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
                Previous <span style={{ color: raffleAccent }}>Winners</span>
              </h2>
              <div className="space-y-3">
                {raffle.previousWinners.map((w: any) => (
                  <div key={w._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                      style={{ backgroundColor: `${raffleAccent}20`, color: raffleAccent }}
                    >
                      #{w.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{w.winner?.full_name || w.winner?.username || "Winner"}</p>
                      <p className="text-[10px] text-white/40">{new Date(w.announcedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black" style={{ color: raffleAccent }}>₦{w.prize.toLocaleString()}</p>
                      <p className="text-[10px] text-white/40">Prize</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
              Frequently Asked <span style={{ color: raffleAccent }}>Questions</span>
            </h2>
            <div className="space-y-3">
              {FAQ_DATA.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <span className="font-bold text-sm">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-white/40 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-white/60 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== ENTRANTS COUNT ===== */}
      <section className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            {statsQuery?.totalParticipants ?? raffle.totalEntrants ?? 0} participants ·
            {statsQuery?.totalTickets ?? raffle.totalTickets ?? 0} total tickets
          </p>
        </div>
      </section>

      {/* ===== PURCHASE MODAL ===== */}
      <SpotifyPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        currentUser={currentUser}
        onPurchaseComplete={() => {
          setShowPurchaseModal(false);
          setAutoEnterAttempted(false);
        }}
        onRequireAuth={(action) => {
          setShowPurchaseModal(false);
          setTimeout(() => {
            if (action === "login") setShowLogin(true);
            else setShowRegister(true);
          }, 100);
        }}
      />

      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {showQrModal && (
          <ReferralQrModal link={referralLink} onClose={() => setShowQrModal(false)} />
        )}
      </AnimatePresence>

      {/* ===== CELEBRATION OVERLAY ===== */}
      <AnimatePresence>
        {showCelebration && entryResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="rounded-3xl p-8 sm:p-12 max-w-md w-full text-center shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${raffleAccent}20, #000)`,
                borderColor: `${raffleAccent}30`,
                borderWidth: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${raffleAccent}20` }}>
                <CheckCircle2 size={40} style={{ color: raffleAccent }} />
              </div>
              <h2 className="text-2xl font-black mb-2">You're Entered!</h2>
              <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Raffle Number</span>
                  <span className="font-black" style={{ color: raffleAccent }}>{entryResult.raffleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tickets</span>
                  <span className="font-black">{entryResult.ticketCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Entry Date</span>
                  <span className="font-black">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setShowCelebration(false); handleCopyReferralLink(); }}
                  className="w-full h-11 rounded-2xl text-white text-xs font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: raffleAccent }}
                >
                  <Share2 size={16} /> Share Referral Link
                </button>
                <button
                  onClick={() => { setShowCelebration(false); }}
                  className="w-full h-11 rounded-2xl bg-white/10 text-white text-xs font-black hover:bg-white/20 flex items-center justify-center gap-2"
                >
                  <Ticket size={16} /> View My Tickets
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  X: <Twitter size={16} />,
  Instagram: <Instagram size={16} />,
  TikTok: <Music size={16} />,
  Facebook: <Users size={16} />,
  YouTube: <Youtube size={16} />,
  WhatsApp: <MessageCircle size={16} />,
  Telegram: <SendIcon size={16} />,
  Discord: <Smartphone size={16} />,
  Spotify: <Music size={16} />,
  Website: <Globe size={16} />,
  Custom: <Link2 size={16} />,
};
