import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";
import toast from "react-hot-toast";

export default function WalletFundingPage() {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as any } : "skip");
  const submitManual = useMutation(api.funding.submitManualFunding);
  const addTransaction = useMutation(api.transactions.addTransaction);

  const [step, setStep] = useState<'methods' | 'paystack' | 'manual'>('methods');
  const [fundAmount, setFundAmount] = useState<string>('');
  const [manualData, setManualData] = useState({
    sender_name: '',
    reference: ''
  });
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step === 'manual' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("9049861561");
    setIsCopied(true);
    toast.success("Account number copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePaystackSubmit = async () => {
    const amount = Number(fundAmount.replace(/,/g, ''));
    if (!amount || amount < 1000) return toast.error("Minimum funding is ₦1,000");
    
    setIsSubmitting(true);
    try {
      // Simulate Paystack Success
      await addTransaction({
        user_id: currentUser!._id,
        amount,
        type: 'funding',
        description: 'Wallet Funding via Paystack',
        fee: 50 // ₦50 processing fee
      });
      toast.success(`₦${(amount - 50).toLocaleString()} credited to your wallet!`);
      navigate('/dashboard');
    } catch (e) {
      toast.error("Funding failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    const amount = Number(fundAmount.replace(/,/g, ''));
    if (!amount || amount < 1000) return toast.error("Minimum funding is ₦1,000");
    if (!manualData.sender_name) return toast.error("Please enter sender name");

    setIsSubmitting(true);
    try {
      await submitManual({
        user_id: currentUser!._id,
        amount,
        sender_name: manualData.sender_name,
        reference: manualData.reference
      });
      toast.success("Payment submitted for review!");
      navigate('/dashboard');
    } catch (e) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout
      activeTab="wallet"
      setActiveTab={(tab) => navigate('/dashboard')}
      qScore={currentUser?.q_score || 0}
    >
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-10">
          <button 
            onClick={() => step === 'methods' ? navigate('/dashboard') : setStep('methods')}
            className="flex items-center gap-2 text-zinc-400 hover:text-black font-bold text-sm transition-colors mb-6 group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-sm">
              <ArrowLeft size={16} />
            </div>
            Back
          </button>
          <h1 className="text-4xl font-black tracking-tight">Fund <span className="text-zinc-400">Wallet</span></h1>
          <p className="text-zinc-500 font-medium mt-2">Choose your preferred funding method.</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'methods' && (
            <motion.div 
              key="methods"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Amount Input */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-3 block">Enter Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <span className="text-2xl font-black text-zinc-900">₦</span>
                  </div>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={fundAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFundAmount(val ? Number(val).toLocaleString() : '');
                    }}
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-6 pl-12 pr-6 text-3xl font-black focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder:text-zinc-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paystack Option */}
                <button 
                  onClick={() => setStep('paystack')}
                  className="bg-white p-8 rounded-[2.5rem] border border-black/5 text-left group hover:border-emerald-500/30 transition-all shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 pointer-events-none" />
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative">
                    <CreditCard size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Paystack</h3>
                  <p className="text-zinc-400 text-sm font-medium mb-4">Instant funding via card or USSD.</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                    ₦50 Processing Fee
                  </div>
                </button>

                {/* Manual Bank Transfer */}
                <button 
                  onClick={() => setStep('manual')}
                  className="bg-zinc-900 p-8 rounded-[2.5rem] text-left group transition-all shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 pointer-events-none" />
                  <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 relative">
                    <Banknote size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Bank Transfer</h3>
                  <p className="text-zinc-400 text-sm font-medium mb-4">Direct bank transfer verification.</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-tight">
                    ₦0 Processing Fee
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'paystack' && (
            <motion.div 
              key="paystack"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-xl shadow-black/[0.02]">
                <div className="text-center space-y-4 mb-10">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={40} />
                  </div>
                  <h2 className="text-2xl font-black">Confirm Paystack Payment</h2>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-black">₦{fundAmount}</div>
                    <p className="text-zinc-400 font-bold text-sm mt-1">+ ₦50 processing fee</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-[#F4F5F8] rounded-2xl space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Net to Wallet</span>
                      <span>₦{(Number(fundAmount.replace(/,/g, '')) - 50).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Processing Slot</span>
                      <span>₦50</span>
                    </div>
                    <div className="pt-3 border-t border-black/5 flex justify-between items-center">
                      <span className="font-black text-sm uppercase tracking-widest text-[10px]">Total Debit</span>
                      <span className="text-xl font-black">₦{fundAmount}</span>
                    </div>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    onClick={handlePaystackSubmit}
                    className="w-full py-6 bg-black text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:shadow-black/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Complete Payment"}
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'manual' && (
            <motion.div 
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Step 1: Bank Details */}
              <div className="bg-zinc-900 p-10 rounded-[2.5rem] shadow-xl shadow-black/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black">Transfer Details</h2>
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Manual Verification</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-black uppercase tracking-tight border border-emerald-500/30">
                      <ShieldCheck size={14} /> NO FEES
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Account Number</p>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-black tracking-tighter">9049861561</span>
                          <button 
                            onClick={handleCopy}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                          >
                            {isCopied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Bank</p>
                          <p className="font-bold">Moniepoint</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Account Name</p>
                          <p className="font-bold">Cratebux and Logistics</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Valid For</p>
                        <p className="font-mono font-black text-lg">{formatTime(timeLeft)}</p>
                      </div>
                    </div>
                    {timeLeft === 0 && (
                      <button 
                        onClick={() => setTimeLeft(15 * 60)}
                        className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Confirmation Form */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm space-y-8">
                <div className="space-y-4">
                  <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
                    <AlertCircle className="text-amber-600 shrink-0" size={24} />
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">
                      Please transfer the exact amount of <span className="font-bold text-black text-lg">₦{fundAmount}</span> to the account above. After completing the transfer, confirm below.
                    </p>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Sender Name</label>
                      <input 
                        type="text"
                        placeholder="Enter the name on your bank account"
                        value={manualData.sender_name}
                        onChange={(e) => setManualData(prev => ({ ...prev, sender_name: e.target.value }))}
                        className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder:text-zinc-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Optional Reference (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Transaction ID"
                        value={manualData.reference}
                        onChange={(e) => setManualData(prev => ({ ...prev, reference: e.target.value }))}
                        className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder:text-zinc-300"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting || timeLeft === 0}
                  onClick={handleManualSubmit}
                  className="w-full py-6 bg-black text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:shadow-black/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "I Have Sent the Money"}
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-12 text-center text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] opacity-50">
          Secure Payment Portal • JoinTheQ
        </footer>
      </div>
    </MainLayout>
  );
}
