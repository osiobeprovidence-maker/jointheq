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
  Shield, BarChart3, Crown, Medal
} from "lucide-react";
import { auth } from "../lib/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import { RaffleHeader } from "../components/raffle/RaffleHeader";
import { SpotifyPurchaseModal } from "../components/raffle/SpotifyPurchaseModal";

const SPOTIFY_GREEN = "#1DB954";
const SPOTIFY_DARK = "#191414";
const DRAW_DATE = new Date("2026-07-18T23:59:59+01:00");
const BASE_URL = "https://jointheq.sbs";

function getTimeRemaining() {
  const now = Date.now();
  const diff = DRAW_DATE.getTime() - now;
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

function CountdownTimer({ expired, showWinner }: { expired: boolean; showWinner?: boolean }) {
  const [remaining, setRemaining] = useState(getTimeRemaining);

  useEffect(() => {
    if (expired) return;
    const interval = setInterval(() => setRemaining(getTimeRemaining()), 1000);
    return () => clearInterval(interval);
  }, [expired]);

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
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
          <Sparkles size={32} className="text-[#1DB954]" />
        </div>
        <p className="text-[#1DB954] font-black text-lg">Winner Being Selected</p>
      </div>
    );
  }

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hours", value: remaining.hours },
    { label: "Minutes", value: remaining.minutes },
    { label: "Seconds", value: remaining.seconds },
  ];

  return (
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
    a: "Anyone with an active Spotify Premium subscription on Q can enter the raffle. You must have a verified account and an active subscription slot.",
  },
  {
    q: "How are winners selected?",
    a: "Winners are selected using a weighted random draw. Every ticket counts as one entry, so more tickets = higher chance of winning. The draw runs securely on our servers with a complete audit log.",
  },
  {
    q: "How do referrals work?",
    a: "After purchasing Spotify, you're automatically entered. Share your unique referral link — every friend who buys Spotify through your link earns you +1 additional raffle ticket.",
  },
  {
    q: "Can I transfer tickets?",
    a: "No, raffle tickets are non-transferable and tied to your account. They cannot be sold, traded, or transferred to another user.",
  },
  {
    q: "What if my subscription ends?",
    a: "You must maintain an active Spotify subscription until the draw date. If your subscription is cancelled or refunded, your entry may be invalidated.",
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
    const text = `🎵 I'm in the Spotify Raffle on Q! Buy Spotify and you could win ₦5,000. Use my link: ${referralLink}`;
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
  }, [referralLink]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191414] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm font-bold">Loading raffle...</p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-[#191414] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Music size={48} className="mx-auto text-[#1DB954] mb-4" />
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
  const totalTickets = userTickets?.totalTickets || (isAlreadyEntered ? 1 : 0);
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1DB954]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1DB954]/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 text-[10px] font-black uppercase tracking-widest text-[#1DB954] mb-4">
                  <Music size={12} /> Spotify Premium Raffle
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
                  Buy Spotify.
                  <br />
                  <span className="text-[#1DB954]">Invite Friends.</span>
                  <br />
                  Win <span className="text-[#1DB954]">₦5,000</span>.
                </h1>
                <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto lg:mx-0 mb-6">
                  Purchase Spotify Premium on Q to receive your first raffle ticket.
                  Every successful referral earns you even more tickets, increasing
                  your chances of winning ₦5,000 cash.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  {needsAuth ? (
                    <>
                      <button
                        onClick={() => setShowLogin(true)}
                        className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
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
                      className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
                    >
                      <CheckCircle2 size={16} /> You're Entered
                    </button>
                  ) : isEligible && !autoEnterAttempted ? (
                    <div className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Auto-Entering...
                    </div>
                  ) : needsSubscription ? (
                    <button
                      onClick={() => setShowPurchaseModal(true)}
                      className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
                    >
                      <Music size={16} /> Get Spotify Premium
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                      <AlertCircle size={16} /> Verification Pending
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
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <VinylRecord size={160} />
                <div className="absolute -bottom-4 -right-4 bg-[#1DB954] text-white text-xs font-black px-4 py-2 rounded-full shadow-lg shadow-[#1DB954]/30">
                  ₦5,000 Prize
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
            <AudioWave />
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Draw Date: 18 July 2026</p>
            <AudioWave />
          </motion.div>

          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <CountdownTimer expired={raffleExpired && !isWinnerAnnounced} showWinner={isWinnerAnnounced} />
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
              className="bg-gradient-to-r from-[#1DB954]/10 via-[#1DB954]/5 to-transparent border border-[#1DB954]/20 rounded-3xl p-4 sm:p-6 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-[#1DB954]" />
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
                <Music size={16} className="text-[#1DB954]" /> Spotify Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
                    <span className="text-sm font-black text-[#1DB954]">Active</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Plan</p>
                  <p className="text-sm font-black">{activeSpotifySlot.slot_name || activeSpotifySlot.sub_name || "Spotify Premium"}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Renewal</p>
                  <p className="text-sm font-black">
                    {activeSpotifySlot.renewal_date
                      ? new Date(activeSpotifySlot.renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tickets</p>
                  <p className="text-sm font-black text-[#1DB954]">{totalTickets}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== CAMPAIGN STATISTICS ===== */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
              Campaign <span className="text-[#1DB954]">Statistics</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: "Prize Amount", value: `₦${(statsQuery?.prizeAmount || raffle.prizeAmount || 5000).toLocaleString()}`, icon: <Award size={18} /> },
                { label: "Draw Date", value: new Date(statsQuery?.drawDate || raffle.drawDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), icon: <Clock size={18} /> },
                { label: "Participants", value: statsQuery?.totalParticipants ?? raffle.totalEntrants ?? 0, icon: <Users size={18} /> },
                { label: "Total Tickets", value: statsQuery?.totalTickets ?? raffle.totalTickets ?? 0, icon: <Ticket size={18} /> },
                { label: "Days Remaining", value: statsQuery?.daysRemaining ?? 0, icon: <TrendingUp size={18} /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#1DB954] mb-1">
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
      {(isAlreadyEntered || isCompleted) && (
        <section id="my-tickets" className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
                My <span className="text-[#1DB954]">Tickets</span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Spotify Purchase</div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={20} className="text-[#1DB954]" />
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
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#1DB954]/10 rounded-full -mr-8 -mt-8" />
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Successful Referrals</div>
                    <motion.div
                      className="text-3xl font-black text-[#1DB954]"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                    >
                      {completedReferrals.length}
                    </motion.div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1DB954]/20 to-transparent border border-[#1DB954]/30 rounded-3xl p-6 text-center">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total Tickets</div>
                    <motion.div
                      className="text-4xl font-black text-[#1DB954]"
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
                    <Share2 size={16} className="text-[#1DB954]" /> Invite Friends
                  </h3>
                  <p className="text-white/50 text-xs mb-4">
                    Earn one additional ticket every time someone buys Spotify using your referral.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-white/70 truncate">{referralLink}</code>
                        <button
                          onClick={handleCopyReferralLink}
                          className="shrink-0 h-8 px-3 rounded-lg bg-[#1DB954] text-white text-[10px] font-black hover:bg-[#169c46] flex items-center gap-1"
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
      {(isAlreadyEntered || isCompleted) && (
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
                  <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 size={18} className="text-[#1DB954]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Spotify Purchased</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 size={18} className="text-[#1DB954]" />
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

      {/* ===== TICKET HISTORY ===== */}
      {(isAlreadyEntered || isCompleted) && ticketHistoryQuery && ticketHistoryQuery.length > 0 && (
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
                        item.type === "purchase" ? "bg-[#1DB954]/20" : "bg-amber-500/20"
                      }`}>
                        {item.type === "purchase" ? (
                          <Music size={14} className="text-[#1DB954]" />
                        ) : (
                          <Users size={14} className="text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.label}</p>
                        <p className="text-[10px] text-white/40">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-[#1DB954] font-black">+{item.tickets}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#1DB954]/10 to-transparent rounded-xl px-4 py-3 border border-[#1DB954]/20">
                  <span className="text-sm font-black">Total</span>
                  <span className="text-[#1DB954] font-black text-lg">{totalTickets} Ticket{totalTickets !== 1 ? "s" : ""}</span>
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
                Referral <span className="text-[#1DB954]">History</span>
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
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black ${
                            r.status === "completed" ? "bg-[#1DB954]/20 text-[#1DB954]" :
                            r.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
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
              Top <span className="text-[#1DB954]">Referrers</span>
            </h2>
            {!leaderboardQuery ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#1DB954]" />
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
                        <p className="text-sm font-black text-[#1DB954]">{entry.ticketCount}</p>
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
              How It <span className="text-[#1DB954]">Works</span>
            </h2>
            <p className="text-white/60 text-sm">Four simple steps to win big.</p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/5 -translate-x-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  step: "01",
                  title: "Buy Spotify Premium",
                  desc: "Purchase Spotify Premium on Q through our marketplace. You'll automatically receive your first raffle ticket.",
                  icon: <Music size={28} />,
                },
                {
                  step: "02",
                  title: "Auto-Enter the Raffle",
                  desc: "Once your subscription is verified, you're automatically entered. No manual entry required.",
                  icon: <CheckCircle2 size={28} />,
                },
                {
                  step: "03",
                  title: "Invite Friends",
                  desc: "Share your unique referral link. Every friend who buys Spotify through your link earns you +1 additional ticket.",
                  icon: <Users size={28} />,
                },
                {
                  step: "04",
                  title: "Win Big",
                  desc: "More tickets = higher chances of winning ₦5,000 cash. The winner is drawn on 18 July 2026.",
                  icon: <Award size={28} />,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 text-center md:text-left md:flex md:items-start md:gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1DB954]/10 flex items-center justify-center mx-auto md:mx-0 mb-4 md:mb-0 shrink-0">
                    <div className="text-[#1DB954]">{s.icon}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-[#1DB954] uppercase tracking-widest mb-1">{s.step}</div>
                    <h3 className="text-lg font-black mb-2">{s.title}</h3>
                    <p className="text-white/60 text-sm">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center bg-gradient-to-r from-[#1DB954]/10 to-transparent border border-[#1DB954]/20 rounded-3xl p-6 max-w-lg mx-auto">
            <p className="text-white/90 text-sm font-bold">
              Every successful referral gives you <span className="text-[#1DB954]">+1 Ticket</span>.
            </p>
            <p className="text-white/40 text-xs mt-1">More tickets = higher chance of winning ₦5,000.</p>
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
              <Info size={18} className="text-[#1DB954]" /> Requirements & Eligibility
            </h3>
            <ul className="space-y-3">
              {[
                "Must purchase Spotify Premium through Q to enter.",
                "Referrals only count after successful payment by the referred friend.",
                "Fake or duplicate accounts are removed from the raffle.",
                "Winner must have an active Spotify subscription when the raffle ends.",
                "Self-referrals and fraudulent entries are strictly prohibited.",
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[#1DB954]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
                  </div>
                  <span className="text-white/70">{req}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ===== WINNER ANNOUNCEMENT ===== */}
      {isWinnerAnnounced && winnersQuery && winnersQuery.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-yellow-500/10 via-[#1DB954]/5 to-transparent border border-yellow-500/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
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
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1DB954]/10 via-black/50 to-black border border-[#1DB954]/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1DB954]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                <Award size={28} className="text-[#1DB954]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Prize Pool</h2>
              <div className="text-5xl sm:text-6xl font-black text-[#1DB954] my-4">
                ₦{(statsQuery?.prizeAmount || raffle.prizeAmount || 5000).toLocaleString()}
              </div>
              <p className="text-white/60 text-sm">Cash prize for the winner</p>
              {raffle.prizes && raffle.prizes.length > 0 && (
                <div className="mt-6 max-w-sm mx-auto space-y-2">
                  {raffle.prizes.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-bold">{p.label}</span>
                      <span className="text-[#1DB954] font-black">₦{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                <Clock size={14} /> Winner announced 18 July 2026
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
                Previous <span className="text-[#1DB954]">Winners</span>
              </h2>
              <div className="space-y-3">
                {raffle.previousWinners.map((w: any) => (
                  <div key={w._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954] font-black text-sm">
                      #{w.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{w.winner?.full_name || w.winner?.username || "Winner"}</p>
                      <p className="text-[10px] text-white/40">{new Date(w.announcedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#1DB954] font-black">₦{w.prize.toLocaleString()}</p>
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
              Frequently Asked <span className="text-[#1DB954]">Questions</span>
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
              className="bg-gradient-to-br from-[#1DB954]/20 to-black border border-[#1DB954]/30 rounded-3xl p-8 sm:p-12 max-w-md w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-[#1DB954]" />
              </div>
              <h2 className="text-2xl font-black mb-2">You're Entered!</h2>
              <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Raffle Number</span>
                  <span className="font-black text-[#1DB954]">{entryResult.raffleNumber}</span>
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
                  className="w-full h-11 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] flex items-center justify-center gap-2"
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
