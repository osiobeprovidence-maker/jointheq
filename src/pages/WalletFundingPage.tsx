import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Activity,
  ArrowLeft,
  Copy,
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
  const [selectedPlan, setSelectedPlan] = useState<null | {
    subscriptionName: string;
    slotName: string;
    price: number;
  }>(null);

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

  const copyBankAccountNumber = async () => {
    await navigator.clipboard.writeText(FUNDING_BANK_DETAILS.accountNumber);
    toast.success("Account number copied");
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
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white text-zinc-500 shadow-sm transition-all hover:text-black hover:shadow-md"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fund Wallet</h1>
              <p className="mt-1 text-gray-500">
                Transfer to this account to fund your JoinTheQ wallet.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-400">
                Current Balance
              </div>
              <div className="mt-3 text-5xl font-black tracking-tight text-zinc-950">
                {fmtCurrency(currentUser?.wallet_balance || 0)}
              </div>
            </div>
          </div>
        </motion.div>

        <BankTransferCard onCopy={copyBankAccountNumber} />

        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          After payment, your wallet will be credited once your transfer is confirmed.
        </p>

        {selectedPlan && (
          <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
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

function BankTransferCard({ onCopy }: { onCopy: () => void }) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-8">
      <h2 className="mb-6 text-2xl font-black tracking-tight">Fund Wallet</h2>
      <div className="max-w-2xl rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Bank Name</div>
              <div className="mt-1 text-lg font-black text-zinc-950">{FUNDING_BANK_DETAILS.bank}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Account Number</div>
              <div className="mt-1 break-all text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-black text-white transition-all hover:bg-black active:scale-95 sm:w-auto"
          >
            <Copy size={18} />
            Copy Account Number
          </button>
        </div>
      </div>
    </section>
  );
}

function WalletHistory({ transactions }: { transactions: any[] }) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">Wallet transaction history</h2>
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
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100/70 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
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
                className={`shrink-0 font-bold ${
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
