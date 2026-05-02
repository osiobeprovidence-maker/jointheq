import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Plus,
  Wallet as WalletIcon,
  Zap,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { fmtCurrency } from "../lib/utils";
import { MainLayout } from "../layouts/MainLayout";
import toast from "react-hot-toast";

const GUEST_ONBOARDING_SELECTION_KEY = "guest_onboarding_selection";
const FUNDING_BANK_DETAILS = {
  bank: "Moniepoint",
  accountNumber: "9049861561",
  accountName: "Cratebux and Logistic",
};
const MIN_FUNDING_AMOUNT = 1000;
const FUNDING_CHARGE = 20;
const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatDuration(ms: number) {
  const safeMs = Math.max(0, ms);
  const hours = Math.floor(safeMs / (60 * 60 * 1000));
  const minutes = Math.floor((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((safeMs % (60 * 1000)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function WalletFundingPage() {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const currentUser = useQuery(
    api.users.getById,
    user?._id ? { id: user._id as Id<"users"> } : "skip",
  );
  const transactions =
    useQuery(
      api.transactions.getTransactions,
      currentUser ? { user_id: currentUser._id } : "skip",
    ) || [];
  const manualRequests =
    useQuery(
      api.funding.getUserManualRequests,
      currentUser ? { user_id: currentUser._id } : "skip",
    ) || [];
  const submitManualFunding = useMutation(api.funding.submitManualFunding);
  const [selectedPlan, setSelectedPlan] = useState<null | {
    subscriptionName: string;
    slotName: string;
    price: number;
  }>(null);
  const [amountInput, setAmountInput] = useState("");
  const [fundingStage, setFundingStage] = useState<"form" | "loading" | "transfer">("form");
  const [isSubmittingFunding, setIsSubmittingFunding] = useState(false);
  const [now, setNow] = useState(Date.now());

  const fundingAmount = Number(amountInput || 0);
  const isValidFundingAmount = Number.isFinite(fundingAmount) && fundingAmount >= MIN_FUNDING_AMOUNT;
  const amountToPay = isValidFundingAmount ? fundingAmount + FUNDING_CHARGE : FUNDING_CHARGE;
  const latestRequest = manualRequests[0];
  const pendingRequest = manualRequests.find((request: any) => request.status === "Awaiting Review");
  const failedRequest = latestRequest?.status === "Failed" || latestRequest?.status === "Rejected" ? latestRequest : null;
  const reviewEndsAt = pendingRequest ? pendingRequest.created_at + REVIEW_WINDOW_MS : 0;
  const reviewRemainingMs = pendingRequest ? reviewEndsAt - now : 0;

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
    if (!selectedPlan?.price) return;
    setAmountInput(String(Math.max(MIN_FUNDING_AMOUNT, Number(selectedPlan.price || 0))));
  }, [selectedPlan?.price]);

  useEffect(() => {
    if (!pendingRequest) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [pendingRequest?._id]);

  const copyBankAccountNumber = async () => {
    await navigator.clipboard.writeText(FUNDING_BANK_DETAILS.accountNumber);
    toast.success("Account number copied");
  };

  const handleStartFunding = () => {
    if (!isValidFundingAmount) {
      toast.error("Minimum funding amount is N1,000");
      return;
    }

    setFundingStage("loading");
    window.setTimeout(() => setFundingStage("transfer"), 1200);
  };

  const handlePaymentDone = async () => {
    if (!currentUser || !isValidFundingAmount || isSubmittingFunding) return;

    setIsSubmittingFunding(true);
    try {
      await submitManualFunding({
        user_id: currentUser._id,
        base_amount: fundingAmount,
        unique_amount: fundingAmount + FUNDING_CHARGE,
        sender_name: currentUser.full_name || currentUser.email,
        bank_name: undefined,
      });
      setFundingStage("form");
      toast.success("Payment submitted for review");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit payment for review");
    } finally {
      setIsSubmittingFunding(false);
    }
  };

  const handleLayoutTabChange = (tab: string) => {
    if (tab === "wallet") {
      navigate("/dashboard");
      return;
    }
    if (tab === "admin") {
      navigate("/admin");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <MainLayout
      activeTab="wallet"
      setActiveTab={handleLayoutTabChange}
      qScore={currentUser?.q_score || 0}
    >
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white text-zinc-500 shadow-sm transition-all hover:text-black hover:shadow-md sm:h-12 sm:w-12"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Fund Wallet</h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Transfer to this account to fund your JoinTheQ wallet.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-400">
                Current Balance
              </div>
              <div className="mt-3 max-w-full break-words text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                {fmtCurrency(currentUser?.wallet_balance || 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {pendingRequest ? (
          <ReviewWaitingCard
            request={pendingRequest}
            remainingMs={reviewRemainingMs}
          />
        ) : (
          <>
            {failedRequest && <FailedFundingCard request={failedRequest} />}
            <BankTransferCard
              amountInput={amountInput}
              amountToPay={amountToPay}
              fundingAmount={fundingAmount}
              fundingStage={fundingStage}
              isSubmittingFunding={isSubmittingFunding}
              isValidFundingAmount={isValidFundingAmount}
              onAmountChange={setAmountInput}
              onCopy={copyBankAccountNumber}
              onPaymentDone={handlePaymentDone}
              onStartFunding={handleStartFunding}
            />
          </>
        )}

        {selectedPlan && (
          <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 sm:rounded-[2rem] sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-500">
              Selected During Guest Onboarding
            </div>
            <div className="mt-2 text-xl font-black text-zinc-900">
              {selectedPlan.subscriptionName}
            </div>
            <div className="text-sm font-bold text-zinc-500">
              {selectedPlan.slotName} · Target plan price {fmtCurrency(selectedPlan.price || 0)}
            </div>
          </div>
        )}

        <WalletHistory transactions={transactions} />
      </div>
    </MainLayout>
  );
}

function BankTransferCard({
  amountInput,
  amountToPay,
  fundingAmount,
  fundingStage,
  isSubmittingFunding,
  isValidFundingAmount,
  onAmountChange,
  onCopy,
  onPaymentDone,
  onStartFunding,
}: {
  amountInput: string;
  amountToPay: number;
  fundingAmount: number;
  fundingStage: "form" | "loading" | "transfer";
  isSubmittingFunding: boolean;
  isValidFundingAmount: boolean;
  onAmountChange: (value: string) => void;
  onCopy: () => void;
  onPaymentDone: () => void;
  onStartFunding: () => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">Fund Wallet</h2>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          Enter the wallet amount. A fixed {fmtCurrency(FUNDING_CHARGE)} charge is added to every funding.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {fundingStage === "loading" ? (
          <motion.div
            key="funding-loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex min-h-[240px] flex-col items-center justify-center rounded-[1.25rem] bg-zinc-950 p-6 text-center text-white sm:min-h-[280px] sm:rounded-[1.75rem] sm:p-8"
          >
            <Loader2 className="mb-5 animate-spin text-white/80" size={36} />
            <h3 className="text-xl font-black tracking-tight sm:text-2xl">Preparing transfer details</h3>
            <p className="mt-2 max-w-sm text-sm font-bold text-white/55">
              Keep this page open while your funding amount is prepared.
            </p>
          </motion.div>
        ) : fundingStage === "transfer" ? (
          <motion.div
            key="funding-transfer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid min-w-0 gap-4 lg:grid-cols-[1fr_0.9fr] lg:gap-5"
          >
            <div className="min-w-0 rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:rounded-[1.75rem] sm:p-6">
              <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm font-black text-amber-700">
                Transfer exactly {fmtCurrency(amountToPay)}. Your wallet will receive {fmtCurrency(fundingAmount)} after admin approval.
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Bank Name</div>
                  <div className="mt-1 text-lg font-black text-zinc-950">{FUNDING_BANK_DETAILS.bank}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Account Number</div>
                  <div className="mt-1 break-all text-2xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                    {FUNDING_BANK_DETAILS.accountNumber}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Account Name</div>
                  <div className="mt-1 text-base font-bold text-zinc-500">{FUNDING_BANK_DETAILS.accountName}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCopy}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-4 text-xs font-black text-white transition-all hover:bg-black active:scale-95 sm:w-auto sm:px-5 sm:text-sm"
              >
                <Copy size={18} />
                Copy Account Number
              </button>
            </div>

            <div className="min-w-0 rounded-[1.25rem] bg-zinc-950 p-5 text-white sm:rounded-[1.75rem] sm:p-6 lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Payment Summary</div>
                <div className="mt-5 space-y-3">
                  <SummaryRow label="Wallet credit" value={fmtCurrency(fundingAmount)} />
                  <SummaryRow label="Funding charge" value={fmtCurrency(FUNDING_CHARGE)} />
                  <div className="border-t border-white/10 pt-3">
                    <SummaryRow label="Transfer amount" value={fmtCurrency(amountToPay)} strong />
                  </div>
                </div>
                <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm font-bold leading-relaxed text-white/70">
                  Once submitted, this request goes to admin review and cannot be cancelled.
                </p>
              </div>
              <button
                type="button"
                onClick={onPaymentDone}
                disabled={isSubmittingFunding}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-xs font-black text-zinc-950 transition-all hover:bg-zinc-100 active:scale-95 disabled:opacity-60 sm:px-5 sm:text-sm"
              >
                {isSubmittingFunding ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                I have done this payment
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="funding-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid min-w-0 gap-4 lg:grid-cols-[1fr_0.8fr] lg:gap-5"
          >
            <div className="min-w-0 rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:rounded-[1.75rem] sm:p-6">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                Amount to fund
              </label>
              <div className="mt-3 flex items-center rounded-2xl border border-black/10 bg-zinc-50 px-4 focus-within:ring-2 focus-within:ring-zinc-950/10">
                <span className="text-xl font-black text-zinc-400">{"\u20A6"}</span>
                <input
                  type="number"
                  min={MIN_FUNDING_AMOUNT}
                  value={amountInput}
                  onChange={(event) => onAmountChange(event.target.value)}
                  placeholder="1000"
                  className="h-14 min-w-0 flex-1 bg-transparent px-3 text-2xl font-black tracking-tight text-zinc-950 outline-none sm:h-16 sm:text-3xl"
                />
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-400">
                Minimum funding is {fmtCurrency(MIN_FUNDING_AMOUNT)}.
              </p>
              <button
                type="button"
                onClick={onStartFunding}
                disabled={!isValidFundingAmount}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-black text-white transition-all hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={18} />
                Start Funding
              </button>
            </div>

            <div className="min-w-0 rounded-[1.25rem] bg-zinc-50 p-5 sm:rounded-[1.75rem] sm:p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Payment Summary</div>
              <div className="mt-5 space-y-3">
                <SummaryRow label="Wallet credit" value={isValidFundingAmount ? fmtCurrency(fundingAmount) : "--"} />
                <SummaryRow label="Funding charge" value={fmtCurrency(FUNDING_CHARGE)} />
                <div className="border-t border-black/10 pt-3">
                  <SummaryRow label="Transfer amount" value={isValidFundingAmount ? fmtCurrency(amountToPay) : "--"} strong />
                </div>
              </div>
              <p className="mt-5 text-sm font-semibold leading-relaxed text-zinc-500">
                Account details show after you start funding.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className={`min-w-0 text-sm font-bold ${strong ? "text-current" : "text-current opacity-60"}`}>{label}</span>
      <span className={`shrink-0 text-right ${strong ? "text-base font-black sm:text-xl" : "text-sm font-black"}`}>{value}</span>
    </div>
  );
}

function ReviewWaitingCard({ request, remainingMs }: { request: any; remainingMs: number }) {
  return (
    <section className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div className="min-w-0">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 sm:h-14 sm:w-14">
            <Clock size={26} />
          </div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Waiting for admin review</h2>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-zinc-500">
            Your payment has been submitted. Wallet funding stays locked while admin verifies the transfer.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Wallet credit" value={fmtCurrency(request.base_amount)} />
            <MiniStat label="Amount paid" value={fmtCurrency(request.unique_amount)} />
            <MiniStat label="Status" value="Awaiting review" />
          </div>
        </div>
        <div className="min-w-0 rounded-[1.25rem] bg-zinc-950 p-5 text-white sm:rounded-[1.75rem] sm:p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Review window</div>
          <div className="mt-4 break-words font-mono text-3xl font-black tracking-tight sm:text-4xl">{formatDuration(remainingMs)}</div>
          <p className="mt-3 text-sm font-bold leading-relaxed text-white/60">
            If admin does not approve within 24 hours, this request will show as failed.
          </p>
        </div>
      </div>
    </section>
  );
}

function FailedFundingCard({ request }: { request: any }) {
  return (
    <section className="rounded-[1.5rem] border border-red-100 bg-red-50 p-5 text-red-700 sm:rounded-[2rem] sm:p-6">
      <div className="flex gap-4">
        <AlertCircle className="mt-0.5 shrink-0" size={22} />
        <div>
          <h2 className="font-black">Previous funding failed</h2>
          <p className="mt-1 text-sm font-bold leading-relaxed text-red-600/80">
            {request.admin_note || "The payment review window ended before approval. Start a new funding request when ready."}
          </p>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-zinc-50 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</div>
      <div className="mt-1 break-words text-sm font-black text-zinc-950">{value}</div>
    </div>
  );
}

function WalletHistory({ transactions }: { transactions: any[] }) {
  return (
    <section className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight sm:text-xl">Wallet transaction history</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Your wallet funding and payment activity.
          </p>
        </div>
        <Activity className="hidden text-zinc-300 sm:block" size={24} />
      </div>

      <div className="space-y-4">
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((tx, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100/70 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    tx.type === "funding"
                      ? "bg-emerald-100 text-emerald-600"
                      : tx.type === "payment"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {tx.type === "funding" ? (
                    <Plus size={16} />
                  ) : tx.type === "payment" ? (
                    <Zap size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold capitalize">
                    {tx.description || tx.type.replace("_", " ")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div
                className={`self-end font-bold sm:self-auto ${
                  tx.type === "funding"
                    ? "text-emerald-600"
                    : tx.type === "payment"
                      ? "text-zinc-900"
                      : "text-blue-600"
                }`}
              >
                {tx.type === "funding" ? "+" : tx.type === "payment" ? "-" : ""}
                {fmtCurrency(tx.amount || 0)}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-300">
              <WalletIcon size={22} />
            </div>
            <h3 className="font-black text-zinc-900">No wallet transactions yet</h3>
            <p className="mt-2 text-sm font-medium text-zinc-400">
              Your wallet funding history will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
