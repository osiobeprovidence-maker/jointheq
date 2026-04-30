import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Camera,
  Loader2,
  Wallet as WalletIcon,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { fmtCurrency } from "../lib/utils";
import { MainLayout } from "../layouts/MainLayout";
import { getUserFacingErrorMessage } from "../lib/errors";
import toast from "react-hot-toast";

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];
const GUEST_ONBOARDING_SELECTION_KEY = "guest_onboarding_selection";
const FUNDING_BANK_DETAILS = {
  bank: "Moniepoint",
  accountNumber: "9049861561",
  accountName: "Cratebux and Logistic",
};
const BANKS = [
  "Moniepoint",
  "Opay",
  "PalmPay",
  "GTBank",
  "Zenith Bank",
  "Access Bank",
  "First Bank",
  "UBA",
  "Kuda",
  "Other",
];

export default function WalletFundingPage() {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const currentUser = useQuery(
    api.users.getById,
    user?._id ? { id: user._id as Id<"users"> } : "skip",
  );
  const manualRequests =
    useQuery(
      api.funding.getUserManualRequests,
      currentUser ? { user_id: currentUser._id } : "skip",
    ) || [];

  const [baseAmount, setBaseAmount] = useState<number | "">("");
  const [uniqueAmount, setUniqueAmount] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isLoading, setIsLoading] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [bankUsed, setBankUsed] = useState("");
  const [reference, setReference] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<null | {
    slotTypeId: string;
    subscriptionName: string;
    slotName: string;
    price: number;
    category?: string;
    selectedAt?: number;
  }>(null);

  const generateUnique = useMutation(api.funding.generateUniqueAmount);
  const generateUploadUrl = useMutation(api.funding.generateUploadUrl);
  const submitManual = useMutation(api.funding.submitManualFunding);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSelection = window.sessionStorage.getItem(
      GUEST_ONBOARDING_SELECTION_KEY,
    );

    if (!storedSelection) return;

    try {
      setSelectedPlan(JSON.parse(storedSelection));
    } catch (error) {
      console.warn("Failed to parse guest onboarding selection", error);
      window.sessionStorage.removeItem(GUEST_ONBOARDING_SELECTION_KEY);
    }
  }, []);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }

    if (step === 2 && timeLeft === 0) {
      toast.error("Transfer window expired. Please start over.");
      resetManualFlow();
    }
  }, [step, timeLeft]);

  const resetManualFlow = () => {
    setStep(1);
    setUniqueAmount(null);
    setTimeLeft(900);
    setSenderName("");
    setBankUsed("");
    setReference("");
    setSelectedFile(null);
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }

    navigate("/dashboard");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const copyBankAccountNumber = () => {
    navigator.clipboard.writeText(FUNDING_BANK_DETAILS.accountNumber);
    toast.success("Account number copied");
  };

  const handleStartManual = async () => {
    if (!baseAmount || Number(baseAmount) < 1000) {
      toast.error("Minimum funding amount is N1,000");
      return;
    }

    setIsLoading(true);
    try {
      const unique = await generateUnique({ base_amount: Number(baseAmount) });
      setUniqueAmount(unique);
      setStep(2);
      setTimeLeft(900);
    } catch (e: any) {
      toast.error(getUserFacingErrorMessage(e, "Failed to generate unique amount"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitManual = async () => {
    if (!user?._id || !senderName || !bankUsed || uniqueAmount === null) {
      toast.error("Please complete the required fields");
      return;
    }

    setIsLoading(true);
    try {
      let screenshotId = undefined;

      if (selectedFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await result.json();
        screenshotId = storageId;
      }

      await submitManual({
        user_id: user._id as Id<"users">,
        base_amount: Number(baseAmount),
        unique_amount: uniqueAmount,
        sender_name: senderName,
        bank_name: bankUsed,
        screenshot_id: screenshotId,
        reference: reference || undefined,
      });

      toast.success("Verification request submitted");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(getUserFacingErrorMessage(e, "Failed to submit request"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayoutTabChange = (tab: string) => {
    if (tab === "wallet") return;
    if (tab === "admin") {
      navigate("/admin");
      return;
    }
    navigate("/dashboard");
  };

  const pendingRequests = manualRequests.filter(
    (request) => request.status === "Awaiting Review",
  );

  return (
    <MainLayout
      activeTab="wallet"
      setActiveTab={handleLayoutTabChange}
      qScore={currentUser?.q_score || 0}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={goBack}
              className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center text-zinc-500 hover:text-black hover:shadow-md transition-all shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fund Wallet</h1>
              <p className="text-gray-500 mt-1">
                Fund your wallet through the manual transfer review flow.
              </p>
            </div>
          </div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-zinc-400">
            Secure Payments
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
          <div className="relative z-10 text-center mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Available Balance
            </h3>
            <motion.div
              key={currentUser?.wallet_balance}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-extrabold text-zinc-900 tracking-tight"
            >
              {fmtCurrency(currentUser?.wallet_balance || 0)}
            </motion.div>
          </div>

          <div className="border-t border-gray-100 pt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-zinc-500 text-sm font-medium mb-3">
                Manual bank transfer is the active funding method right now.
                This page still follows the same shell, spacing, and card rhythm
                as the rest of the wallet experience.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                <span className="px-3 py-1 bg-zinc-100 rounded-full">
                  Manual verification
                </span>
                <span className="px-3 py-1 bg-zinc-100 rounded-full">
                  Bank transfer only
                </span>
                <span className="px-3 py-1 bg-zinc-100 rounded-full">
                  Fraud checks
                </span>
              </div>
            </div>
            <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40 mb-2">
                Funding Window
              </div>
              <div className="text-2xl font-black mb-2">
                {step === 2 ? formatTime(timeLeft) : "Manual Only"}
              </div>
              <p className="text-sm text-white/70">
                Manual transfers are held for up to 15 minutes once a unique
                amount is generated.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight">
            Fund via bank transfer
          </h2>
          <BankTransferCard onCopy={copyBankAccountNumber} />
          <p className="text-sm font-medium text-zinc-500">
            Transfer to this account to fund your JoinTheQ wallet.
          </p>
        </section>

        {selectedPlan && (
          <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-500 mb-2">
                Selected During Guest Onboarding
              </div>
              <div className="text-xl font-black text-zinc-900">
                {selectedPlan.subscriptionName}
              </div>
              <div className="text-sm font-bold text-zinc-500">
                {selectedPlan.slotName} · Target plan price {fmtCurrency(selectedPlan.price || 0)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(GUEST_ONBOARDING_SELECTION_KEY);
                setSelectedPlan(null);
                toast.success("Selected plan cleared");
              }}
              className="px-4 py-2 rounded-full bg-white text-sm font-bold text-zinc-700 border border-blue-100 hover:bg-blue-50 transition-all"
            >
              Clear Selection
            </button>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 mb-6 flex items-center gap-2">
              <Clock size={16} /> Pending Verification
            </h3>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white p-6 rounded-2xl border border-amber-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                      <WalletIcon size={22} />
                    </div>
                    <div>
                      <div className="font-black text-lg text-indigo-600">
                        {fmtCurrency(request.unique_amount)}
                      </div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Sent for {fmtCurrency(request.base_amount)} credit
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-amber-700 bg-amber-100/50 px-4 py-2 rounded-full border border-amber-200 italic">
                    Your transfer is awaiting verification.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="manual-amount"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.24em] mb-3">
                  Manual Transfer
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2">
                  Generate your transfer amount
                </h2>
                <p className="text-zinc-500 text-sm mb-8">
                  Enter the amount you want credited. We will add small unique
                  digits so the transfer can be verified quickly.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">
                      N
                    </span>
                    <input
                      type="number"
                      placeholder="1000"
                      value={baseAmount}
                      onChange={(e) =>
                        setBaseAmount(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full bg-zinc-50 border border-black/5 rounded-[2rem] py-8 pl-14 pr-8 text-3xl font-black focus:ring-4 focus:ring-black/5 transition-all outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setBaseAmount(amount)}
                        className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                          baseAmount === amount
                            ? "bg-zinc-900 text-white shadow-lg"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        {fmtCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8">
                  <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mb-5">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="font-black text-amber-900 mb-2">
                    Fraud-resistant flow
                  </h3>
                  <p className="text-sm font-medium text-amber-700 leading-relaxed">
                    The unique amount lets the system match your transfer without
                    needing direct bank integration.
                  </p>
                </div>

                <button
                  disabled={!baseAmount || Number(baseAmount) < 1000 || isLoading}
                  onClick={handleStartManual}
                  className="w-full py-5 bg-zinc-900 text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  Generate Transfer Amount
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="manual-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5">
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.24em] mb-2">
                        Transfer Now
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">
                        Send the exact amount
                      </h2>
                    </div>
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0">
                      <Clock size={14} /> {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="text-center py-8 px-4 bg-indigo-50 rounded-[2rem] mb-8">
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.24em] mb-2">
                      Amount To Transfer
                    </div>
                    <div className="text-5xl font-black tracking-tight text-indigo-600">
                      {fmtCurrency(uniqueAmount || 0)}
                    </div>
                    <p className="text-sm font-bold text-red-500 mt-3">
                      Transfer this exact amount, including the extra digits.
                    </p>
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-[2rem] space-y-4">
                    <InfoRow
                      label="Bank"
                      value={FUNDING_BANK_DETAILS.bank}
                    />
                    <InfoRow
                      label="Account Number"
                      value={FUNDING_BANK_DETAILS.accountNumber}
                      copyValue={FUNDING_BANK_DETAILS.accountNumber}
                      onCopy={copyToClipboard}
                    />
                    <InfoRow
                      label="Account Name"
                      value={FUNDING_BANK_DETAILS.accountName}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.24em] mb-3">
                    Confirm Your Details
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mb-2">
                    Complete verification
                  </h2>
                  <p className="text-zinc-500 text-sm mb-8">
                    Tell us who sent the transfer and optionally attach proof so
                    the review goes faster.
                  </p>

                  <div className="space-y-5">
                    <FieldLabel text="Sender's Full Name" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/5 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-black/5 outline-none"
                    />

                    <FieldLabel text="Bank You Sent From" />
                    <select
                      value={bankUsed}
                      onChange={(e) => setBankUsed(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/5 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-black/5 outline-none appearance-none"
                    >
                      <option value="">Select bank</option>
                      {BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>

                    <FieldLabel text="Reference (Optional)" />
                    <input
                      type="text"
                      placeholder="Transaction reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/5 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-black/5 outline-none"
                    />

                    <FieldLabel text="Proof of Transfer (Optional)" />
                    <div
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      className="w-full bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2rem] py-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                    >
                      {selectedFile ? (
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm text-center px-4">
                          <CheckCircle2 size={16} />
                          {selectedFile.name.length > 28
                            ? `${selectedFile.name.slice(0, 28)}...`
                            : selectedFile.name}
                        </div>
                      ) : (
                        <>
                          <Camera size={24} className="text-zinc-300" />
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            Upload transfer screenshot
                          </span>
                        </>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-[2rem] p-6 flex gap-4">
                <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-blue-700 leading-relaxed uppercase tracking-wide">
                  Wallet credit is {fmtCurrency(Number(baseAmount) || 0)}. The
                  extra digits are only for verification and do not change your
                  credited amount.
                </p>
              </div>

              <button
                disabled={!senderName || !bankUsed || isLoading}
                onClick={handleSubmitManual}
                className="w-full py-5 bg-zinc-900 text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ShieldCheck size={18} />
                )}
                I Have Sent The Money
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.24em] ml-1">
      {text}
    </label>
  );
}

function BankTransferCard({ onCopy }: { onCopy: () => void }) {
  return (
    <div className="bg-white border border-black/5 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] max-w-xl">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400 mb-1">
            Bank
          </div>
          <div className="text-lg font-black text-zinc-900">
            {FUNDING_BANK_DETAILS.bank}
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <WalletIcon size={20} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 mb-1">
            Account Number
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 break-all">
            {FUNDING_BANK_DETAILS.accountNumber}
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copy account number"
          title="Copy account number"
          className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0 hover:bg-indigo-600 active:scale-95 transition-all"
        >
          <Copy size={18} />
        </button>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 mb-1">
          Account Name
        </div>
        <div className="text-sm sm:text-base font-bold text-zinc-500">
          {FUNDING_BANK_DETAILS.accountName}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  copyValue,
  onCopy,
}: {
  label: string;
  value: string;
  copyValue?: string;
  onCopy?: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-center gap-2 text-right">
        <span className="font-black">{value}</span>
        {copyValue && onCopy ? (
          <button
            onClick={() => onCopy(copyValue)}
            className="text-zinc-300 hover:text-indigo-600 transition-colors"
          >
            <Copy size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}


