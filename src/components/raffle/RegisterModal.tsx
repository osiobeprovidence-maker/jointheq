import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UserPlus, Loader2, AlertCircle, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { auth } from "../../lib/auth";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess: () => void;
  referralCode?: string;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin, onSuccess, referralCode }: RegisterModalProps) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");

  const createUser = useMutation(api.users.createUser);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const usernameBase = (formData.name.split(" ")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      const username = `${usernameBase || "user"}${Math.floor(100 + Math.random() * 900)}`;

      await createUser({
        email: formData.email || undefined,
        full_name: formData.name,
        username,
        password_hash: formData.password,
        referred_by_code: referralCode?.toUpperCase() || undefined,
        registration_source: "raffle",
      });

      const updatedUser = auth.getCurrentUser();
      if (updatedUser) {
        toast.success("Account created! Welcome to Q.");
        setStep("success");
        setTimeout(() => {
          onSuccess();
          onClose();
          setStep("form");
          setFormData({ name: "", email: "", password: "" });
        }, 1500);
      } else {
        toast.success("Account created! Please log in.");
        onClose();
        setStep("form");
        setFormData({ name: "", email: "", password: "" });
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData({ name: "", email: "", password: "" });
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {step === "success" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={28} className="text-[#1DB954]" />
                </div>
                <h2 className="text-xl font-black mb-2">Account Created!</h2>
                <p className="text-white/60 text-sm">Welcome to Q. Redirecting...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black">Create Account</h2>
                  <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {referralCode && (
                  <div className="mb-4 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 flex items-center gap-2">
                    Referral Code: <span className="font-black">{referralCode}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-4 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleChange("name")}
                        placeholder="John Doe"
                        className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleChange("email")}
                        placeholder="you@example.com"
                        className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange("password")}
                        placeholder="At least 6 characters"
                        className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all"
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-2xl bg-[#1DB954] text-white text-xs font-black hover:bg-[#169c46] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1DB954]/20"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      handleClose();
                      setTimeout(() => onSwitchToLogin(), 100);
                    }}
                    className="text-xs text-white/50 hover:text-white font-bold transition-colors"
                  >
                    Already have an account? <span className="text-[#1DB954]">Log In</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
