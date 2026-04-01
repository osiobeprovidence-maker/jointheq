import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
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
  BadgeDollarSign,
  MonitorPlay,
  Music4,
  Cpu,
  Shield,
  LayoutGrid,
  Loader2,
  Clock,
  Check,
  Zap,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";
import { getUserFacingErrorMessage } from "../lib/errors";
import { MainLayout } from "../layouts/MainLayout";

const CATEGORIES = [
  "Streaming", "Music", "Design", "AI", "Productivity", "Gaming", "VPN", "Software", "Utility", "Education"
];

const PLATFORMS = [
  { id: "Netflix Premium", label: "Netflix Premium", category: "Streaming", icon: <MonitorPlay size={20} /> },
  { id: "Spotify Family", label: "Spotify Family", category: "Music", icon: <Music4 size={20} /> },
  { id: "Apple Music", label: "Apple Music", category: "Music", icon: <Music4 size={20} /> },
  { id: "VPN Services", label: "VPN Services", category: "VPN", icon: <Shield size={20} /> },
  { id: "CapCut Pro", label: "CapCut Pro", category: "Design", icon: <LayoutGrid size={20} /> },
  { id: "AI Tools", label: "AI Tools", category: "AI", icon: <Cpu size={20} /> },
  { id: "Other", label: "Other", category: "Utility", icon: <Sparkles size={20} /> }
];

export default function ListSubscriptionPage() {
  const user = auth.getCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list-earn'); // For MainLayout
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingListing, setIsCreatingListing] = useState(false);

  // Form fields
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Store request ID in component state to persist across re-renders
  const [requestId] = useState(() =>
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  const submitListing = useMutation(api.listings.submitListing);

  // Auto-map category when platform is selected
  useEffect(() => {
    if (platform) {
      const selectedPlatform = PLATFORMS.find(p => p.id === platform);
      if (selectedPlatform && selectedPlatform.category) {
        setCategory(selectedPlatform.category);
      }
    }
  }, [platform]);

  const handleSubmit = async () => {
    if (!platform || !category || !email || !password || !renewalDate || !confirmed) {
      return toast.error("Please fill in all fields and confirm ownership");
    }
    // Prevent duplicate submissions - check flag first
    if (isCreatingListing || isLoading) {
      console.log("[handleSubmit] Already creating listing, ignoring duplicate call");
      return;
    }

    setIsCreatingListing(true);
    setIsLoading(true);
    try {
      console.log(`[submitListing] Submitting with request_id=${requestId}`);

      await submitListing({
        owner_id: user!._id as any,
        platform,
        category,
        email,
        password,
        renewal_date: renewalDate,
        request_id: requestId,
      });
      toast.success("Listing submitted! Our team will review it within 24 hours.");
      setStep(3);
    } catch (e: any) {
      // Ignore duplicate errors from idempotency check
      if (e.message?.includes("already") || e.message?.includes("duplicate")) {
        toast.success("Listing already submitted!");
        setStep(3);
      } else {
        toast.error(getUserFacingErrorMessage(e, "Failed to submit listing"));
      }
    } finally {
      setIsLoading(false);
      setIsCreatingListing(false);
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">List & Earn</h1>
            <p className="text-gray-500 mt-1">Monetize your unused subscription slots safely.</p>
          </div>
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            {step > 1 && step < 3 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/50 transition-all shadow-sm flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        <section className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Visual Cards (Instructional) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InstructionCard
                    icon={<BadgeDollarSign />}
                    title="Set Your Price"
                    desc="Earn monthly revenue based on marketplace demand."
                  />
                  <InstructionCard
                    icon={<ShieldCheck />}
                    title="Verified Safety"
                    desc="We manage access so you don't have to share passwords with strangers."
                  />
                  <InstructionCard
                    icon={<Zap />}
                    title="Auto-Payout"
                    desc="Earnings are credited directly to your Q Wallet monthly."
                  />
                </div>

                {/* Platform Selection */}
                <div className="space-y-4">
                  <header>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Your Subscription</h2>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`p-6 rounded-2xl border transition-all text-left flex items-center justify-between group ${platform === p.id
                            ? 'bg-gray-50 border-black ring-1 ring-black shadow-md'
                            : 'bg-white border-gray-100 shadow-sm hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl transition-colors ${platform === p.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {p.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900">{p.label}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">{p.category}</div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${platform === p.id ? 'border-black bg-black' : 'border-gray-200'
                          }`}>
                          {platform === p.id && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={!platform}
                    onClick={() => setStep(2)}
                    className="w-full py-4.5 bg-black text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Continue to Account Details
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 space-y-8">
                  <header className="border-b border-gray-50 pb-6 mb-2">
                    <h2 className="text-xl font-semibold">Account & Category Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Provide the credentials for the {platform} account.</p>
                  </header>

                  <div className="space-y-6">
                    {/* Category Selector (Pills) */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <Tag size={14} className="text-gray-400" /> Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${category === cat
                                ? 'bg-black text-white border-black shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <InputField
                        label="Login Email"
                        icon={<Mail size={18} />}
                        type="email"
                        placeholder="account@email.com"
                        value={email}
                        onChange={setEmail}
                      />
                      <InputField
                        label="Password"
                        icon={<Lock size={18} />}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                      />
                      <InputField
                        label="Renewal Date"
                        icon={<Calendar size={18} />}
                        type="text"
                        placeholder="e.g. 20th of every month"
                        value={renewalDate}
                        onChange={setRenewalDate}
                      />
                    </div>

                    {/* Confirmation checkbox */}
                    <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={() => setConfirmed(!confirmed)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 transition-all checked:bg-black checked:border-black"
                        />
                        <Check size={14} className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 leading-relaxed group-hover:text-zinc-900 transition-colors">
                        I verify ownership of this subscription and authorize JoinTheQ to manage member verification.
                      </span>
                    </label>
                  </div>

                  <button
                    disabled={!email || !password || !renewalDate || !confirmed || !category || isLoading || isCreatingListing}
                    onClick={handleSubmit}
                    className="w-full py-4.5 bg-black text-white font-bold rounded-xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <BadgeDollarSign size={20} />}
                    Confirm Listing
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto text-center"
              >
                <div className="bg-white border border-gray-100 shadow-lg rounded-[2.5rem] p-12 space-y-8">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">Submission Successful</h2>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      Your listing is under review. Our team will verify credentials and set up slots within 12–24 hours.
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Clock size={16} />
                      </div>
                      <div className="text-left font-bold text-xs uppercase tracking-tight text-gray-400">Status</div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Pending Approval</span>
                  </div>

                  <button
                    onClick={() => window.location.href = "/dashboard"}
                    className="w-full py-4.5 bg-black text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Return to Terminal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </MainLayout>
  );
}

function InstructionCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all">
      <div className="w-10 h-10 bg-gray-100 text-black rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function InputField({ label, icon, type, placeholder, value, onChange }: {
  label: string,
  icon: React.ReactNode,
  type: string,
  placeholder: string,
  value: string,
  onChange: (val: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-12 pr-6 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
        />
      </div>
    </div>
  );
}
