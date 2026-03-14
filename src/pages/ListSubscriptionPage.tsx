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
  { id: "Netflix Premium", label: "Netflix Premium", icon: <MonitorPlay size={20} />, slots: 8, payout: "₦13,000" },
  { id: "Spotify Family", label: "Spotify Family", icon: <Music4 size={20} />, slots: 6, payout: "₦4,800" },
  { id: "Apple Music", label: "Apple Music Family", icon: <Music4 size={20} />, slots: 6, payout: "₦4,500" },
  { id: "VPN", label: "VPN Services", icon: <Shield size={20} />, slots: 5, payout: "Variable" },
  { id: "CapCut", label: "CapCut Pro", icon: <LayoutGrid size={20} />, slots: 5, payout: "Variable" },
  { id: "AI Tools", label: "AI Tools (ChatGPT/Midjourney)", icon: <Cpu size={20} />, slots: 5, payout: "Variable" },
  { id: "Other", label: "Other", icon: <Sparkles size={20} />, slots: 1, payout: "Manual" }
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
    <div className="min-h-screen bg-[#F8F9FC] text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-12 pb-8 flex items-center justify-between">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : window.location.href = "/dashboard"} 
          className="p-3 bg-white rounded-2xl shadow-sm hover:scale-105 transition-all text-zinc-400"
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
              className="space-y-8"
            >
              <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                      <BadgeDollarSign size={24} className="text-blue-400" />
                   </div>
                   <h2 className="text-2xl font-black mb-2">Turn Subscriptions into Income</h2>
                   <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                     List your unused/extra slots and let Q manage them. We fill the slots, manage members, and send you monthly payouts.
                   </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-2">Select Your Subscription</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`p-5 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${platform === p.id ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border-black/5 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform === p.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                           {p.icon}
                         </div>
                         <div>
                            <div className={`text-sm font-black ${platform === p.id ? 'text-white' : 'text-zinc-900'}`}>{p.label}</div>
                            <div className={`text-[10px] font-bold ${platform === p.id ? 'text-white/60' : 'text-zinc-400'}`}>Est. Payout: {p.payout}</div>
                         </div>
                      </div>
                      <CheckCircle2 size={18} className={`${platform === p.id ? 'text-white' : 'text-zinc-100 group-hover:text-indigo-100'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                disabled={!platform}
                onClick={() => setStep(2)}
                className="w-full py-6 bg-black text-white font-black rounded-3xl shadow-2xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
              className="space-y-8"
            >
               <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-indigo-900 text-sm">Security & Management</h4>
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-tight">
                      Q needs login access to manage slots, verify subscription status, and resolve member access issues automatically.
                    </p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Subscription Login Email</label>
                     <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                          type="email" 
                          placeholder="account@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border-none rounded-2xl py-5 pl-14 pr-6 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Subscription Password</label>
                     <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white border-none rounded-2xl py-5 pl-14 pr-6 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Renewal Date</label>
                     <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="e.g. 20th of every month"
                          value={renewalDate}
                          onChange={(e) => setRenewalDate(e.target.value)}
                          className="w-full bg-white border-none rounded-2xl py-5 pl-14 pr-6 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                     </div>
                  </div>
               </div>

               <div className="p-1">
                  <button 
                    onClick={() => setConfirmed(!confirmed)}
                    className="flex items-start gap-4 text-left group"
                  >
                     <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${confirmed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-zinc-200'}`}>
                        {confirmed && <CheckCircle2 size={14} />}
                     </div>
                     <span className="text-xs font-bold text-zinc-500 leading-relaxed group-hover:text-zinc-900 transition-colors">
                        I confirm that I own this subscription and authorize JoinTheQ to manage members and verify credentials for revenue generation.
                     </span>
                  </button>
               </div>

               <button 
                  disabled={!email || !password || !renewalDate || !confirmed || isLoading}
                  onClick={handleSubmit}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {isLoading ? <Loader2 className="animate-spin" /> : <BadgeDollarSign size={20} />}
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
               <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 size={48} />
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black tracking-tight">Listing Submitted!</h2>
                  <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
                    Our team is currently verifying the credentials. You will be notified via email once your subscription is live on the marketplace.
                  </p>
               </div>
               <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
                  <div className="flex items-center justify-center gap-3 text-amber-500 font-black text-xs uppercase tracking-widest">
                     <Clock size={16} /> Verification Status: Pending
                  </div>
                  <div className="h-px bg-zinc-100" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-loose">
                    Estimated Time: 2-4 Hours <br/>
                    Next Step: Approval & Slot Generation
                  </p>
               </div>
               <button 
                  onClick={() => window.location.href = "/dashboard"}
                  className="w-full py-5 bg-black text-white font-black rounded-3xl"
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
