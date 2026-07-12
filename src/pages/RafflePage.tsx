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
  RefreshCw, AlertCircle, Info
} from "lucide-react";
import { auth } from "../lib/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

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

function CountdownTimer() {
  const [remaining, setRemaining] = useState(getTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getTimeRemaining()), 1000);
    return () => clearInterval(interval);
  }, []);

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

function InviteFriendModal({
  raffleId,
  userId,
  onClose,
  onInvited,
}: {
  raffleId: Id<"raffles">;
  userId: Id<"users">;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const createReferral = useMutation(api.raffle.createReferral);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim() && !phone.trim()) errs.email = "Email or phone is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Invalid email";
    if (phone.trim() && !/^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim())) errs.phone = "Invalid phone";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await createReferral({
        raffleId,
        inviterId: userId,
        inviteeName: name.trim(),
        inviteeEmail: email.trim() || undefined,
        inviteePhone: phone.trim() || undefined,
      });
      toast.success("Invitation sent!");
      onInvited();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  }, [name, email, phone, raffleId, userId, createReferral, onClose, onInvited]);

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
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black">Invite a Friend</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Friend Name *
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="Enter friend's name"
              className={`w-full h-11 rounded-2xl border ${errors.name ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1`}
            />
            {errors.name && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Email <span className="text-zinc-300">(required if no phone)</span>
            </label>
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
              placeholder="friend@email.com"
              className={`w-full h-11 rounded-2xl border ${errors.email ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1`}
            />
            {errors.email && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Phone <span className="text-zinc-300">(required if no email)</span>
            </label>
            <input
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: "" })); }}
              placeholder="08012345678"
              className={`w-full h-11 rounded-2xl border ${errors.phone ? "border-red-300 bg-red-50" : "border-black/5 bg-zinc-50"} px-4 text-sm font-bold outline-none focus:border-zinc-900 mt-1`}
            />
            {errors.phone && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {submitting ? "Sending..." : "Send Invitation"}
          </button>
        </form>
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
    a: "After entering the raffle, you get a unique referral link. When a friend you invite signs up, purchases Spotify, and their payment is verified, you earn +2 bonus raffle tickets.",
  },
  {
    q: "Can I enter twice?",
    a: "No, each user can only enter once. However, you can increase your ticket count by referring friends — each successful referral gives you +2 additional tickets.",
  },
  {
    q: "Can I transfer tickets?",
    a: "No, raffle tickets are non-transferable and tied to your account. They cannot be sold, traded, or transferred to another user.",
  },
];

export default function RafflePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.getCurrentUser());
  const [raffle, setRaffle] = useState<any>(null);
  const [userEntry, setUserEntry] = useState<any>(null);
  const [userTickets, setUserTickets] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [entering, setEntering] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [entryResult, setEntryResult] = useState<any>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const raffleQuery = useQuery(api.raffle.getActiveRaffle);
  const convexUserId = (currentUser?._id || "") as Id<"users">;
  const entryQuery = useQuery(
    api.raffle.getUserEntry,
    raffleQuery && currentUser ? { raffleId: raffleQuery._id, userId: convexUserId } : "skip"
  );
  const ticketsQuery = useQuery(
    api.raffle.getUserTickets,
    raffleQuery && currentUser ? { raffleId: raffleQuery._id, userId: convexUserId } : "skip"
  );
  const referralsQuery = useQuery(
    api.raffle.getUserReferrals,
    raffleQuery && currentUser ? { raffleId: raffleQuery._id, userId: convexUserId } : "skip"
  );

  const raffleId = raffleQuery?._id as Id<"raffles"> | undefined;

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
    const interval = setInterval(() => {
      const u = auth.getCurrentUser();
      if (u?._id !== currentUser?._id) setCurrentUser(u);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const checkEligibilityFn = useCallback(async () => {
    if (!raffleId || !currentUser) return;
    setCheckingEligibility(true);
    setEligibility(null);
    try {
      const { checkEligibility } = await import("convex/react");
      toast.error("Direct query not supported");
      setCheckingEligibility(false);
      return;
    } catch {
      const result = await (await import("../../convex/_generated/api")).api.raffle.checkEligibility({
        raffleId,
        userId: convexUserId,
      });
      // Actually can't do this from client...
    }
    setCheckingEligibility(false);
  }, [raffleId, currentUser, convexUserId]);

  const queryEligibility = useQuery(
    api.raffle.checkEligibility,
    raffleId && currentUser ? { raffleId, userId: convexUserId } : "skip"
  );

  useEffect(() => {
    if (queryEligibility !== undefined) setEligibility(queryEligibility);
  }, [queryEligibility]);

  const enterRaffleFn = useMutation(api.raffle.enterRaffle);

  const handleEnterRaffle = useCallback(async () => {
    if (!raffleId || !currentUser) return;
    setEntering(true);
    try {
      const result = await enterRaffleFn({ raffleId, userId: convexUserId });
      setEntryResult(result);
      setShowCelebration(true);
      toast.success("You're in the raffle!");
    } catch (error: any) {
      toast.error(error?.message || "Could not enter raffle");
    } finally {
      setEntering(false);
    }
  }, [raffleId, currentUser, convexUserId, enterRaffleFn]);

  const referralLink = currentUser
    ? `${BASE_URL}/register/${currentUser.referral_code}?ref=raffle`
    : "";

  const handleCopyReferralLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Failed to copy"));
  }, [referralLink]);

  const handleShare = useCallback((platform: string) => {
    const text = `🎵 I'm in the Spotify Raffle on Q! Join and win ₦5,000. Use my link: ${referralLink}`;
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

  return (
    <div className="min-h-screen bg-[#191414] text-white">
      <Confetti active={showCelebration} />

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
                  Subscribe.
                  <br />
                  <span className="text-[#1DB954]">Enter.</span>
                  <br />
                  Win.
                </h1>
                <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto lg:mx-0 mb-6">
                  Subscribe to Spotify Premium on Q and stand a chance to win from our{" "}
                  <span className="text-[#1DB954] font-bold">₦5,000 prize pool</span>.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  {needsAuth ? (
                    <>
                      <button
                        onClick={() => navigate("/")}
                        className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
                      >
                        <LogIn size={16} /> Log In
                      </button>
                      <button
                        onClick={() => navigate("/")}
                        className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black hover:bg-white/20 transition-all flex items-center gap-2"
                      >
                        <UserPlus size={16} /> Create Account
                      </button>
                    </>
                  ) : isAlreadyEntered ? (
                    <button
                      onClick={() => document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" })}
                      className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
                    >
                      <Ticket size={16} /> View My Tickets
                    </button>
                  ) : isEligible ? (
                    <button
                      onClick={handleEnterRaffle}
                      disabled={entering}
                      className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20 disabled:opacity-60"
                    >
                      {entering ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {entering ? "Entering..." : "Enter Raffle"}
                    </button>
                  ) : needsSubscription ? (
                    <button
                      onClick={() => navigate("/dashboard?tab=marketplace")}
                      className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
                    >
                      <Music size={16} /> Subscribe to Spotify
                    </button>
                  ) : eligibility?.reason === "draw_passed" ? (
                    <div className="text-amber-400 text-sm font-bold">Draw date has passed</div>
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
            <CountdownTimer />
          </motion.div>
        </div>
      </section>

      {/* ===== AUTH GATE / ELIGIBILITY ===== */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {needsAuth ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-4">
                <Music size={28} className="text-[#1DB954]" />
              </div>
              <h2 className="text-xl font-black mb-2">You're almost there!</h2>
              <p className="text-white/60 text-sm mb-6">
                Log in or create an account to join the Spotify Raffle.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2"
                >
                  <LogIn size={16} /> Log In
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <UserPlus size={16} /> Create Account
                </button>
              </div>
            </motion.div>
          ) : eligibility === null && queryEligibility === undefined ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Loader2 size={32} className="animate-spin text-[#1DB954] mx-auto mb-3" />
              <p className="text-white/60 text-sm font-bold">Checking your eligibility...</p>
            </motion.div>
          ) : isAlreadyEntered ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1DB954]/10 to-transparent border border-[#1DB954]/20 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-[#1DB954]" />
                </div>
                <div>
                  <h2 className="text-xl font-black">You're already in!</h2>
                  <p className="text-white/60 text-sm">Good luck! Share your referral link to earn more tickets.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Raffle No.</div>
                  <div className="text-sm font-black text-[#1DB954] break-all">{userEntry?.raffleNumber || "—"}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tickets</div>
                  <div className="text-2xl font-black">{userTickets?.totalTickets || userEntry?.ticketCount || 1}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Prize Pool</div>
                  <div className="text-lg font-black">₦{raffle.prizeAmount.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Draw</div>
                  <div className="text-lg font-black">18 July</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                  <Share2 size={16} className="text-[#1DB954]" /> Invite Friends & Earn Tickets
                </h3>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 mb-3">
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
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => handleShare("whatsapp")} className="h-9 px-4 rounded-xl bg-[#25D366]/20 text-[#25D366] text-[10px] font-black hover:bg-[#25D366]/30 flex items-center gap-1.5">
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                  <button onClick={() => handleShare("telegram")} className="h-9 px-4 rounded-xl bg-[#0088cc]/20 text-[#0088cc] text-[10px] font-black hover:bg-[#0088cc]/30 flex items-center gap-1.5">
                    <SendIcon /> Telegram
                  </button>
                  <button onClick={() => handleShare("twitter")} className="h-9 px-4 rounded-xl bg-white/10 text-white text-[10px] font-black hover:bg-white/20 flex items-center gap-1.5">
                    <Twitter size={14} /> X
                  </button>
                  <button onClick={() => setShowQrModal(true)} className="h-9 px-4 rounded-xl bg-white/10 text-white text-[10px] font-black hover:bg-white/20 flex items-center gap-1.5">
                    <QrCode size={14} /> QR Code
                  </button>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full h-11 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] text-xs font-black hover:bg-[#1DB954]/30 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} /> Invite a Friend
                </button>
              </div>
            </motion.div>
          ) : isEligible ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1DB954]/10 to-transparent border border-[#1DB954]/20 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[#1DB954]" />
              </div>
              <h2 className="text-2xl font-black mb-2">You're eligible!</h2>
              <div className="grid grid-cols-3 gap-3 my-6">
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prize Pool</div>
                  <div className="text-xl font-black text-[#1DB954]">₦{raffle.prizeAmount.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tickets</div>
                  <div className="text-xl font-black">1</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Draw</div>
                  <div className="text-xl font-black">18 July</div>
                </div>
              </div>
              <button
                onClick={handleEnterRaffle}
                disabled={entering}
                className="h-12 px-10 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 mx-auto shadow-lg shadow-[#1DB954]/20 disabled:opacity-60"
              >
                {entering ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {entering ? "Entering..." : "Enter Raffle"}
              </button>
            </motion.div>
          ) : needsSubscription ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Music size={28} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-black mb-2">Spotify Subscription Required</h2>
              <p className="text-white/60 text-sm mb-6">
                You need an active Spotify Premium subscription on Q to participate in this raffle.
              </p>
              <button
                onClick={() => navigate("/dashboard?tab=marketplace")}
                className="h-12 px-8 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center gap-2 mx-auto shadow-lg shadow-[#1DB954]/20"
              >
                <Music size={16} /> Subscribe to Spotify
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock size={28} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-black mb-2">Verification Pending</h2>
              <p className="text-white/60 text-sm mb-6">
                Your Spotify subscription is still being verified. Once confirmed, you'll automatically become eligible.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="h-12 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black hover:bg-white/20 transition-all flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} /> Refresh Status
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ===== MY TICKETS ===== */}
      {isAlreadyEntered && (
        <section id="tickets" className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center">
                My <span className="text-[#1DB954]">Tickets</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Initial Entry</div>
                  <motion.div
                    className="text-3xl font-black"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                  >
                    {userTickets?.initialEntry || 1}
                  </motion.div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#1DB954]/10 rounded-full -mr-8 -mt-8" />
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Referral Bonus</div>
                  <motion.div
                    className="text-3xl font-black text-[#1DB954]"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                  >
                    +{userTickets?.referralBonus || 0}
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
                    {userTickets?.totalTickets || 1}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== REFERRAL HISTORY ===== */}
      {isAlreadyEntered && referrals.length > 0 && (
        <section className="py-12 px-4">
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
                          {r.rewardGranted ? `+${r.rewardTickets} tickets` : "—"}
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
            <p className="text-white/60 text-sm">Three simple steps to win big.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Subscribe to Spotify",
                desc: "Get a Spotify Premium subscription on Q through our marketplace.",
                icon: <Music size={32} />,
              },
              {
                step: "02",
                title: "Enter the Raffle",
                desc: "Once your subscription is verified, enter the raffle with one ticket.",
                icon: <Ticket size={32} />,
              },
              {
                step: "03",
                title: "Invite Friends",
                desc: "Every successful referral gives you +2 tickets. More tickets = higher chances!",
                icon: <Users size={32} />,
              },
            ].map((s) => (
              <motion.div
                key={s.step}
                whileHover={{ y: -4 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-4">
                  <div className="text-[#1DB954]">{s.icon}</div>
                </div>
                <div className="text-[10px] font-black text-[#1DB954] uppercase tracking-widest mb-2">{s.step}</div>
                <h3 className="text-lg font-black mb-2">{s.title}</h3>
                <p className="text-white/60 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 max-w-md mx-auto">
            <p className="text-white/80 text-sm font-bold">
              Every successful referral gives you <span className="text-[#1DB954]">+2 Tickets</span>.
            </p>
            <p className="text-white/40 text-xs mt-1">More tickets increase your winning chances.</p>
          </div>
        </div>
      </section>

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
                ₦{raffle.prizeAmount.toLocaleString()}
              </div>
              <p className="text-white/60 text-sm">Cash prize for the winner</p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                <Clock size={14} /> Winner announced 18 July 2026
              </div>
              <p className="text-white/40 text-xs mt-4">Every raffle ticket counts as one entry.</p>
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
            {raffle.totalEntrants || 0} entrants · {raffle.totalTickets || 0} total tickets
          </p>
        </div>
      </section>

      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {showQrModal && (
          <ReferralQrModal link={referralLink} onClose={() => setShowQrModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && raffleId && currentUser && (
          <InviteFriendModal
            raffleId={raffleId}
            userId={convexUserId}
            onClose={() => setShowInviteModal(false)}
            onInvited={() => setShowInviteModal(false)}
          />
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
                  onClick={() => { setShowCelebration(false); setShowInviteModal(true); }}
                  className="w-full h-11 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] flex items-center justify-center gap-2"
                >
                  <Users size={16} /> Invite Friends
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
