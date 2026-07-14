import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Music, CheckCircle2, Loader2, AlertCircle, Wallet,
  CreditCard, Copy, Share2, ChevronRight, Ticket, Users,
  Clock, ShoppingBag, Check, Shield
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { auth } from "../../lib/auth";
import type { User } from "../../types";

const CARD_LINK_AMOUNT = 100;
const WALLET_FUNDING_MIN_AMOUNT = 1000;
const WALLET_FUNDING_CHARGE = 20;
const BASE_URL = "https://jointheq.sbs";

interface SpotifyPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPurchaseComplete: () => void;
  onRequireAuth: (action: "login" | "register") => void;
}

type Step = "browse" | "confirm" | "funding" | "processing" | "success" | "error";

interface SlotOption {
  _id: string;
  name: string;
  price: number;
  open_slots: number;
  total_capacity: number;
  current_members: number;
  sub_name: string;
  min_q_score: number;
  features?: string[];
  slot_price: number;
  marketplace_id: string;
}

function getPaystackPublicKey() {
  return (
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
    import.meta.env.VITE_PAYSTACK_KEY ||
    import.meta.env.VITE_PAYSTACK_PUBLIC ||
    ""
  );
}

export function SpotifyPurchaseModal({
  isOpen, onClose, currentUser, onPurchaseComplete, onRequireAuth,
}: SpotifyPurchaseModalProps) {
  const [step, setStep] = useState<Step>("browse");
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralLink, setReferralLink] = useState("");

  const subscriptions = useQuery(api.subscriptions.getActiveSubscriptions) || [];
  const joinSlotMutation = useMutation(api.subscriptions.joinSlot);
  const verifyWalletFundingAction = useAction(api.paystack.verifyWalletFunding);

  const spotifySlots = subscriptions.filter(
    (s: any) => s.sub_name?.toLowerCase().includes("spotify")
  ) as SlotOption[];

  useEffect(() => {
    if (isOpen) {
      setStep("browse");
      setSelectedSlot(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentUser?.referral_code) {
      setReferralLink(`${BASE_URL}/raffle?ref=${currentUser.referral_code}`);
    }
  }, [currentUser]);

  const handleSelectSlot = (slot: SlotOption) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleBackToBrowse = () => {
    setSelectedSlot(null);
    setStep("browse");
    setErrorMessage("");
  };

  const startPaystackFunding = useCallback((amount: number, onVerified: () => Promise<void>) => {
    const user = auth.getCurrentUser();
    if (!user) { toast.error("Please sign in first."); return; }

    const paystackKey = getPaystackPublicKey();
    if (!paystackKey) {
      toast.error("Payment system is not configured.");
      return;
    }

    const paystack = (window as any).PaystackPop ? new (window as any).PaystackPop() : null;
    if (!paystack?.newTransaction) {
      toast.error("Payment module is loading. Please try again.");
      return;
    }

    const totalAmount = amount < WALLET_FUNDING_MIN_AMOUNT
      ? WALLET_FUNDING_MIN_AMOUNT + WALLET_FUNDING_CHARGE
      : amount + WALLET_FUNDING_CHARGE;

    const walletCreditAmount = amount < WALLET_FUNDING_MIN_AMOUNT
      ? WALLET_FUNDING_MIN_AMOUNT
      : amount;

    paystack.newTransaction({
      key: paystackKey,
      email: user.email || "funding@jointheq.sbs",
      amount: totalAmount * 100,
      currency: "NGN",
      metadata: {
        custom_fields: [{
          display_name: "Wallet Credit",
          variable_name: "wallet_credit",
          value: String(walletCreditAmount),
        }],
      },
      onSuccess: async (response: any) => {
        setStep("processing");
        try {
          toast.loading("Verifying payment...");
          const res = await verifyWalletFundingAction({
            reference: response.reference,
            userId: user._id as Id<"users">,
            walletCreditAmount,
          });
          toast.dismiss();
          if (res.success) {
            toast.success(`N${res.amount.toLocaleString()} added to your wallet!`);
            await onVerified();
          } else {
            setStep("error");
            setErrorMessage("Payment verification failed. Please contact support.");
          }
        } catch (err: any) {
          toast.dismiss();
          setStep("error");
          setErrorMessage(err.message || "Failed to verify payment.");
        }
      },
      onCancel: () => {
        toast.error("Payment cancelled");
        setStep("confirm");
      },
      onError: (error: any) => {
        toast.error(error?.message || "Payment error");
        setStep("confirm");
      },
    });
  }, [verifyWalletFundingAction]);

  const handleConfirmPurchase = async () => {
    if (!selectedSlot || !currentUser) return;

    const price = selectedSlot.price || selectedSlot.slot_price;
    const needed = price;
    const balance = currentUser.wallet_balance || 0;

    if (balance >= needed) {
      setStep("processing");
      try {
        const result = await joinSlotMutation({
          user_id: currentUser._id as Id<"users">,
          slot_type_id: selectedSlot._id as Id<"slot_types">,
          use_boots: false,
          auto_renew: false,
        });
        if (result.success) {
          onPurchaseComplete();
          setStep("success");
        }
      } catch (err: any) {
        setStep("error");
        setErrorMessage(err.message || "Failed to join slot. Please try again.");
      }
    } else {
      setStep("funding");
      const deficit = needed - balance;
      const fundAmount = Math.max(deficit, WALLET_FUNDING_MIN_AMOUNT);
      startPaystackFunding(fundAmount, async () => {
        setStep("processing");
        try {
          const result = await joinSlotMutation({
            user_id: currentUser._id as Id<"users">,
            slot_type_id: selectedSlot._id as Id<"slot_types">,
            use_boots: false,
            auto_renew: false,
          });
          if (result.success) {
            onPurchaseComplete();
            setStep("success");
          }
        } catch (err: any) {
          setStep("error");
          setErrorMessage(err.message || "Failed to join slot after funding.");
        }
      });
    }
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success("Referral link copied!");
    }).catch(() => toast.error("Failed to copy"));
  };

  const handleShareWhatsApp = () => {
    const text = `I just joined the Spotify Raffle on Q! Buy Spotify and you could win big. Use my link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = `I just joined the Spotify Raffle on Q! Buy Spotify and you could win big. Use my link: ${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => step !== "processing" && step !== "funding" && onClose()}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-gradient-to-b from-zinc-900 to-black border sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1DB954]/20 flex items-center justify-center">
                  <Music size={16} className="text-[#1DB954]" />
                </div>
                <h2 className="text-sm font-black">
                  {step === "success" ? "Purchase Complete" :
                   step === "error" ? "Purchase Failed" :
                   step === "confirm" ? "Confirm Purchase" :
                   step === "funding" ? "Fund Your Wallet" :
                   step === "processing" ? "Processing..." :
                   "Get Spotify Premium"}
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={step === "processing"}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              {/* STEP: Browse */}
              {step === "browse" && (
                <div>
                  {!currentUser ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                        <Music size={28} className="text-[#1DB954]" />
                      </div>
                      <h3 className="text-lg font-black mb-2">Join the Spotify Raffle</h3>
                      <p className="text-white/60 text-sm mb-6">Create an account or log in to purchase Spotify and enter the raffle.</p>
                      <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <button
                          onClick={() => onRequireAuth("register")}
                          className="w-full h-11 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Create Account
                        </button>
                        <button
                          onClick={() => onRequireAuth("login")}
                          className="w-full h-11 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-black hover:bg-white/20 flex items-center justify-center gap-2"
                        >
                          Log In
                        </button>
                      </div>
                    </div>
                  ) : spotifySlots.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={28} className="text-white/30" />
                      </div>
                      <h3 className="text-lg font-black mb-2">No Plans Available</h3>
                      <p className="text-white/50 text-sm">Spotify plans are temporarily unavailable. Check back later!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-white/50 font-bold px-1">Choose a Spotify plan to get started:</p>
                      {spotifySlots.map((slot) => {
                        const lowStock = slot.open_slots <= 3 && slot.open_slots > 0;
                        const soldOut = slot.open_slots <= 0;
                        return (
                          <button
                            key={slot._id}
                            onClick={() => !soldOut && handleSelectSlot(slot)}
                            disabled={soldOut}
                            className={`w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#1DB954]/30 rounded-2xl p-5 transition-all ${
                              soldOut ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 flex items-center justify-center shrink-0">
                                  <Music size={20} className="text-[#1DB954]" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black">{slot.sub_name}</h3>
                                  <p className="text-[11px] text-white/50">{slot.name}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-black text-[#1DB954]">
                                  N{slot.price?.toLocaleString() || slot.slot_price?.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-white/40">/month</p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users size={12} className="text-white/30" />
                                <span className="text-[11px] text-white/50">
                                  {slot.open_slots} of {slot.total_capacity} available
                                </span>
                              </div>
                              {lowStock && (
                                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                                  Only {slot.open_slots} left
                                </span>
                              )}
                            </div>
                            {slot.features && slot.features.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {slot.features.slice(0, 3).map((f, i) => (
                                  <span key={i} className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                            {soldOut && (
                              <div className="mt-3 text-[11px] font-bold text-red-400">Sold Out</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP: Confirm */}
              {step === "confirm" && selectedSlot && (
                <div>
                  <div className="bg-[#1DB954]/5 border border-[#1DB954]/20 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 flex items-center justify-center">
                        <Music size={20} className="text-[#1DB954]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black">{selectedSlot.sub_name}</h3>
                        <p className="text-[11px] text-white/50">{selectedSlot.name}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Plan Price</span>
                        <span className="font-black">N{selectedSlot.price?.toLocaleString() || selectedSlot.slot_price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Wallet Balance</span>
                        <span className={`font-black ${(currentUser?.wallet_balance || 0) >= (selectedSlot.price || selectedSlot.slot_price) ? "text-[#1DB954]" : "text-amber-400"}`}>
                          N{(currentUser?.wallet_balance || 0).toLocaleString()}
                        </span>
                      </div>
                      {(currentUser?.wallet_balance || 0) < (selectedSlot.price || selectedSlot.slot_price) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">Additional Funding Needed</span>
                          <span className="font-black text-amber-400">
                            N{((selectedSlot.price || selectedSlot.slot_price) - (currentUser?.wallet_balance || 0)).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                        <span className="text-white/50">Available Slots</span>
                        <span className="font-black">{selectedSlot.open_slots}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleConfirmPurchase}
                      className="w-full h-12 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20"
                    >
                      <ShoppingBag size={16} />
                      {(currentUser?.wallet_balance || 0) >= (selectedSlot.price || selectedSlot.slot_price)
                        ? "Confirm & Purchase"
                        : "Fund Wallet & Purchase"}
                    </button>
                    <button
                      onClick={handleBackToBrowse}
                      className="w-full h-11 rounded-2xl bg-white/10 text-white text-xs font-black hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronRight size={16} className="rotate-180" /> Back to Plans
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: Funding (Paystack) */}
              {step === "funding" && selectedSlot && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Wallet size={28} className="text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black mb-2">Fund Your Wallet</h3>
                  <p className="text-white/50 text-sm mb-6">
                    You need at least N{selectedSlot.price?.toLocaleString() || selectedSlot.slot_price?.toLocaleString()} to purchase this plan.
                    A Paystack payment dialog will open to fund your wallet.
                  </p>
                  <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-2 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Plan Price</span>
                      <span className="font-black">N{selectedSlot.price?.toLocaleString() || selectedSlot.slot_price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Wallet Balance</span>
                      <span className="font-black text-amber-400">N{(currentUser?.wallet_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                      <span className="text-white/50">Total to Fund</span>
                      <span className="font-black text-amber-400">
                        N{Math.max(
                          (selectedSlot.price || selectedSlot.slot_price) - (currentUser?.wallet_balance || 0),
                          WALLET_FUNDING_MIN_AMOUNT
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin mx-auto" />
                  <p className="text-white/40 text-xs mt-3">Payment dialog opening...</p>
                </div>
              )}

              {/* STEP: Processing */}
              {step === "processing" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                    <Loader2 size={28} className="text-[#1DB954] animate-spin" />
                  </div>
                  <h3 className="text-lg font-black mb-2">Setting Up Your Subscription</h3>
                  <p className="text-white/50 text-sm">Please wait while we activate your Spotify plan and enter you in the raffle...</p>
                  <div className="mt-6 space-y-3 max-w-xs mx-auto">
                    <div className="flex items-center gap-3 text-xs">
                      <Loader2 size={14} className="animate-spin text-[#1DB954]" />
                      <span className="text-white/60">Processing payment</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      <span className="text-white/40">Activating subscription</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      <span className="text-white/40">Entering raffle</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      <span className="text-white/40">Generating ticket</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: Success */}
              {step === "success" && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-[#1DB954]" />
                  </div>
                  <h3 className="text-xl font-black mb-1">Congratulations!</h3>
                  <p className="text-white/60 text-sm mb-6">
                    Your Spotify Premium subscription is active.
                    <br />
                    You have successfully entered the Q Spotify Raffle.
                  </p>

                  <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Ticket size={18} className="text-[#1DB954]" />
                      <span className="text-sm text-white/60 font-bold">Ticket Earned</span>
                    </div>
                    <div className="text-4xl font-black text-[#1DB954]">+1 Ticket</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                    <h4 className="text-xs font-black mb-3 flex items-center gap-2">
                      <Share2 size={14} className="text-[#1DB954]" /> Your Referral Link
                    </h4>
                    <p className="text-[11px] text-white/50 mb-3">
                      Earn another raffle ticket every time someone purchases Spotify using your referral.
                    </p>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] text-white/70 truncate">{referralLink}</code>
                        <button
                          onClick={handleCopyReferralLink}
                          className="shrink-0 h-8 px-3 rounded-lg bg-[#1DB954] text-white text-[10px] font-black hover:bg-[#169c46] flex items-center gap-1"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleShareWhatsApp} className="flex-1 h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] text-[10px] font-black hover:bg-[#25D366]/30 flex items-center justify-center gap-1.5">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </button>
                      <button onClick={handleShareTwitter} className="flex-1 h-9 rounded-xl bg-white/10 text-white text-[10px] font-black hover:bg-white/20 flex items-center justify-center gap-1.5">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X
                      </button>
                      <button onClick={handleShareFacebook} className="flex-1 h-9 rounded-xl bg-[#1877F2]/20 text-[#1877F2] text-[10px] font-black hover:bg-[#1877F2]/30 flex items-center justify-center gap-1.5">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full h-11 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all shadow-lg shadow-[#1DB954]/20"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP: Error */}
              {step === "error" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={28} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-black mb-2">Purchase Failed</h3>
                  <p className="text-white/50 text-sm mb-2">{errorMessage || "Something went wrong. Please try again."}</p>
                  {errorMessage?.toLowerCase().includes("insufficient") && (
                    <p className="text-white/40 text-xs mb-6">Fund your wallet and try again.</p>
                  )}
                  <div className="flex flex-col gap-3">
                    {selectedSlot && (
                      <button
                        onClick={() => setStep("confirm")}
                        className="h-11 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46]"
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="h-11 rounded-2xl bg-white/10 text-white text-xs font-black hover:bg-white/20"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
