import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Mail, 
  Lock, 
  Calendar, 
  CheckCircle2, 
  Info,
  BadgeDollarSign,
  MonitorPlay,
  Music4,
  Cpu,
  Shield,
  LayoutGrid,
  Loader2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";

const PLATFORMS = [
  { id: "Netflix Premium", label: "Netflix Premium", icon: <MonitorPlay size={20} /> },
  { id: "Spotify Family", label: "Spotify Family", icon: <Music4 size={20} /> },
  { id: "Apple Music", label: "Apple Music Family", icon: <Music4 size={20} /> },
  { id: "VPN", label: "VPN Services", icon: <Shield size={20} /> },
  { id: "CapCut", label: "CapCut Pro", icon: <LayoutGrid size={20} /> },
  { id: "AI Tools", label: "AI Tools (ChatGPT/Midjourney)", icon: <Cpu size={20} /> },
  { id: "Other", label: "Other", icon: <Sparkles size={20} /> }
];

export default function ListSubscriptionPage() {
  const user = auth.getCurrentUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [platform, setPlatform] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const submitListing = useMutation(api.listings.submitListing);

  const handleSubmit = async () => {
    if (!platform || !email || !password || !renewalDate || !confirmed) {
      return toast.error("Please fill in all fields and confirm ownership");
    }
    
    setIsLoading(true);
    try {
      await submitListing({
        owner_id: user!._id as any,
        platform,
        email,
        password,
        renewal_date: renewalDate,
      });
      toast.success("Listing submitted! Our team will review it within 24 hours.");
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit listing");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-12 pb-8 flex items-center justify-between">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : window.location.href = "/dashboard"} 
          className="p-3 bg-white border border-black/5 rounded-2xl shadow-sm hover:scale-105 transition-all text-zinc-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h1 className="text-xl font-black tracking-tight">List & Earn</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Revenue Sharing</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Hero Banner */}
              <div className="bg-zinc-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full -mr-24 -mt-24 blur-3xl" />
                <div className="relative z-10">
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                    <BadgeDollarSign size={22} className="text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Turn Subscriptions into Income</h2>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                    List your unused/extra slots and let Q manage them. We fill the slots, manage members, and send you monthly payouts.
                  </p>
                </div>
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Your Subscription</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`p-5 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${
                        platform === p.id 
                          ? 'bg-zinc-900 border-zinc-900 shadow-xl shadow-black/10' 
                          : 'bg-white border-black/5 shadow-sm hover:border-zinc-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          platform === p.id ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {p.icon}
                        </div>
                        <div className={`text-sm font-black ${platform === p.id ? 'text-white' : 'text-zinc-900'}`}>
                          {p.label}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        platform === p.id ? 'border-white bg-white' : 'border-zinc-200'
                      }`}>
                        {platform === p.id && <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                disabled={!platform}
                onClick={() => setStep(2)}
                className="w-full py-5 bg-zinc-900 text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none"
              >
                Continue to Account Details
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Security Notice */}
              <div className="bg-white border border-black/5 shadow-sm p-6 rounded-[2rem] flex gap-4">
                <div className="w-10 h-10 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-900 text-sm">Security & Management</h4>
                  <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                    Q needs login access to manage slots, verify subscription status, and resolve member access issues automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Subscription Login Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="email" 
                      placeholder="account@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-black/5 shadow-sm rounded-2xl py-5 pl-14 pr-6 font-bold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Subscription Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-black/5 shadow-sm rounded-2xl py-5 pl-14 pr-6 font-bold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Renewal Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. 20th of every month"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="w-full bg-white border border-black/5 shadow-sm rounded-2xl py-5 pl-14 pr-6 font-bold focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Confirmation checkbox */}
              <button 
                onClick={() => setConfirmed(!confirmed)}
                className="flex items-start gap-4 text-left group w-full"
              >
                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${confirmed ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200'}`}>
                  {confirmed && <CheckCircle2 size={14} />}
                </div>
                <span className="text-xs font-bold text-zinc-500 leading-relaxed group-hover:text-zinc-900 transition-colors">
                  I confirm that I own this subscription and authorize JoinTheQ to manage members and verify credentials for revenue generation.
                </span>
              </button>

              <button 
                disabled={!email || !password || !renewalDate || !confirmed || isLoading}
                onClick={handleSubmit}
                className="w-full py-5 bg-zinc-900 text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <BadgeDollarSign size={20} />}
                List Subscription & Earn
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-8"
            >
              <div className="w-24 h-24 bg-white border border-black/5 shadow-sm text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight">Listing Submitted!</h2>
                <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Our team is currently verifying the credentials. You will be notified once your subscription is live on the marketplace.
                </p>
              </div>
              <div className="bg-white border border-black/5 shadow-sm p-8 rounded-[2rem] space-y-5">
                <div className="flex items-center justify-center gap-3 text-amber-500 font-black text-xs uppercase tracking-widest">
                  <Clock size={16} /> Verification Status: Pending
                </div>
                <div className="h-px bg-zinc-100" />
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-loose">
                  Estimated Time: 2–4 Hours <br/>
                  Next Step: Approval & Slot Generation
                </p>
              </div>
              <button 
                onClick={() => window.location.href = "/dashboard"}
                className="w-full py-5 bg-zinc-900 text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
