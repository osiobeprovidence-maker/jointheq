import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Camera,
  Upload,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";

type Method = "paystack" | "manual";
const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];
const BANKS = ["Moniepoint", "Opay", "PalmPay", "GTBank", "Zenith Bank", "Access Bank", "First Bank", "UBA", "Kuda", "Other"];

export default function WalletFundingPage() {
  const user = auth.getCurrentUser();
  const [method, setMethod] = useState<Method | null>(null);
  const [baseAmount, setBaseAmount] = useState<number | "">("");
  const [uniqueAmount, setUniqueAmount] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isLoading, setIsLoading] = useState(false);
  
  // Manual form fields
  const [senderName, setSenderName] = useState("");
  const [bankUsed, setBankUsed] = useState("");
  const [reference, setReference] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const generateUnique = useMutation(api.funding.generateUniqueAmount);
  const generateUploadUrl = useMutation(api.funding.generateUploadUrl);
  const submitManual = useMutation(api.funding.submitManualFunding);

  // Timer logic
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && step === 2) {
      toast.error("Transfer window expired. Please start over.");
      setStep(1);
      setUniqueAmount(null);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleStartManual = async () => {
    if (!baseAmount || baseAmount < 1000) {
      return toast.error("Minimum funding amount is ₦1,000");
    }
    setIsLoading(true);
    try {
      const unique = await generateUnique({ base_amount: Number(baseAmount) });
      setUniqueAmount(unique);
      setStep(2);
      setTimeLeft(900);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate unique amount");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitManual = async () => {
    if (!senderName || !bankUsed) return toast.error("Please fill in sender name and bank used");
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
        user_id: user!._id as any,
        base_amount: Number(baseAmount),
        unique_amount: uniqueAmount!,
        sender_name: senderName,
        bank_name: bankUsed,
        screenshot_id: screenshotId,
        reference: reference || undefined,
      });

      toast.success("Verification request submitted!");
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="max-w-xl mx-auto px-6 pt-12 pb-8 flex items-center justify-between">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : method ? setMethod(null) : window.location.href = "/dashboard"} 
          className="p-3 bg-white rounded-2xl shadow-sm hover:scale-105 transition-all text-zinc-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tight">Fund Wallet</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Secure Payments</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {!method && (
            <motion.div 
              key="select-method"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                      <Banknote size={24} />
                   </div>
                   <h2 className="text-2xl font-black mb-2">Top Up Balance</h2>
                   <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                     Select a payment method below to add funds to your wallet instantly or via transfer.
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setMethod("paystack")}
                  className="group bg-white p-6 rounded-[2rem] border border-black/5 flex items-center justify-between hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all outline-none"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <CreditCard size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-lg">Paystack</div>
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Instant • ₦50 Fee</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                   onClick={() => setMethod("manual")}
                   className="group bg-white p-6 rounded-[2rem] border border-black/5 flex items-center justify-between hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all outline-none"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <Banknote size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-lg">Manual Transfer</div>
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Fraud-Proof • ₦0 Fee</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-200 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          )}

          {method === "manual" && step === 1 && (
            <motion.div 
              key="manual-step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-2">How much do you want to fund?</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">₦</span>
                  <input 
                    type="number" 
                    placeholder="1000"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-white border-none rounded-[2rem] py-8 pl-14 pr-8 text-3xl font-black shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                  {QUICK_AMOUNTS.map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setBaseAmount(amt)}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${baseAmount === amt ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:bg-zinc-100'}`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex gap-5">
                <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-amber-900">Fraud-Resistant System</h4>
                  <p className="text-xs font-medium text-amber-700 leading-relaxed">
                    We will generate a **unique verification amount** (e.g. ₦1,027). Transferring this exact amount helps us verify your payment in minutes without a bank app connection.
                  </p>
                </div>
              </div>

              <button 
                disabled={!baseAmount || baseAmount < 1000 || isLoading}
                onClick={handleStartManual}
                className="w-full py-6 bg-black text-white font-black rounded-3xl shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <ChevronRight size={20} />}
                Generate Transfer Amount
              </button>
            </motion.div>
          )}

          {method === "manual" && step === 2 && (
            <motion.div 
              key="manual-step-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-black/[0.03] border border-black/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6">
                   <div className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2">
                     <Clock size={14} /> {formatTime(timeLeft)}
                   </div>
                </div>
                
                <div className="text-center space-y-3 mb-12 mt-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount to Transfer</p>
                  <h2 className="text-5xl font-black tracking-tight text-indigo-600">₦{uniqueAmount?.toLocaleString()}</h2>
                  <p className="text-sm font-bold text-red-500 px-8">Transfer the exact amount above including the extra digits for verification.</p>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-zinc-50 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Bank</span>
                      <span className="font-black">Moniepoint</span>
                    </div>
                    <div className="flex justify-between items-center group" onClick={() => copyToClipboard("9049861561")}>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Account Number</span>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <span className="font-black text-lg">9049861561</span>
                        <Copy size={16} className="text-zinc-300 group-hover:text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Account Name</span>
                      <span className="font-black text-right">Cratebux and Logistics</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-center">Confirm Your Details</h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Sender's Full Name</label>
                     <input 
                       type="text" 
                       placeholder="e.g. John Doe"
                       value={senderName}
                       onChange={(e) => setSenderName(e.target.value)}
                       className="w-full bg-white border-none rounded-2xl py-4 px-6 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Bank You Sent From</label>
                     <select 
                       value={bankUsed}
                       onChange={(e) => setBankUsed(e.target.value)}
                       className="w-full bg-white border-none rounded-2xl py-4 px-6 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                     >
                       <option value="">Select Bank</option>
                       {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Proof of Transfer (Optional)</label>
                     <div 
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="w-full bg-white border-2 border-dashed border-zinc-100 rounded-2xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/10 transition-all"
                     >
                       {selectedFile ? (
                         <div className="flex items-center gap-2 text-indigo-600 font-bold">
                           <CheckCircle2 size={16} /> {selectedFile.name.length > 20 ? selectedFile.name.substring(0, 20) + '...' : selectedFile.name}
                         </div>
                       ) : (
                         <>
                           <Camera size={24} className="text-zinc-300" />
                           <span className="text-xs font-bold text-zinc-400">Upload Transfer Screenshot</span>
                         </>
                       )}
                       <input 
                         id="file-upload" 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                       />
                     </div>
                   </div>
                </div>

                <div className="flex gap-4 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
                   <AlertCircle size={20} className="text-blue-500 shrink-0" />
                   <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                     Wallet credits: ₦{baseAmount.toLocaleString()}. The unique digits are only for verification purposes.
                   </p>
                </div>

                <button 
                  disabled={!senderName || !bankUsed || isLoading}
                  onClick={handleSubmitManual}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                  I Have Sent the Money
                </button>
              </div>
            </motion.div>
          )}

          {method === "paystack" && (
            <motion.div 
              key="paystack-flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-2">Enter Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">₦</span>
                  <input 
                    type="number" 
                    placeholder="5000"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-white border-none rounded-[2rem] py-8 pl-14 pr-8 text-3xl font-black shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                  />
                </div>
                {baseAmount && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center font-bold text-sm">
                    Total to pay: ₦{(Number(baseAmount) + 50).toLocaleString()} <span className="text-[10px] uppercase opacity-60 ml-2">(₦50 processing fee)</span>
                  </div>
                )}
              </div>

              <button 
                disabled={!baseAmount || baseAmount < 500}
                className="w-full py-6 bg-emerald-500 text-white font-black rounded-3xl shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Proceed to Payment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
