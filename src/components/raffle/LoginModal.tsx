import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogIn, Loader2, AlertCircle, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import toast from "react-hot-toast";
import { auth } from "../../lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSuccess: () => void;
  referralCode?: string;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister, onSuccess, referralCode }: LoginModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const login = useMutation(api.users.login);
  const requestVerificationEmail = useMutation(api.users.requestVerificationEmail);
  const sendEmail = useMutation(api.email.sendEmail);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setPendingVerificationEmail("");

    try {
      const result = await login({ identifier: identifier.trim(), password });

      if (result.success && result.user) {
        auth.login(result.user as any);
        if (!result.isVerified && result.daysRemaining !== null) {
          localStorage.setItem("verification_days_remaining", String(result.daysRemaining));
          localStorage.setItem("verification_deadline", String(result.verificationDeadline));
        }
        toast.success("Welcome back!");
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Login failed");
        if (result.requiresVerification) {
          const email = result.email || identifier.trim();
          setPendingVerificationEmail(email);
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = pendingVerificationEmail || identifier.trim();
    if (!email) { setError("Enter your email address."); return; }

    setIsLoading(true);
    setError("");
    try {
      const response = await requestVerificationEmail({ email });
      if (response.alreadyVerified) {
        setError("Your account is already verified. Please log in.");
        setPendingVerificationEmail("");
        return;
      }
      if (response?.token && response?.email && response?.name) {
        await sendEmail({
          email: response.email,
          name: response.name,
          token: response.token,
          baseUrl: window.location.origin,
        });
      }
      toast.success("Verification email sent. Please check your inbox.");
      setPendingVerificationEmail(email);
    } catch (err: any) {
      setError(err.message || "Could not resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Log In</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>

            {referralCode && (
              <div className="mb-4 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 flex items-center gap-2">
                Referral detected: <span className="font-black">{referralCode}</span>
              </div>
            )}

            {pendingVerificationEmail && (
              <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <p className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Email not verified
                </p>
                <p className="text-white/60 mb-2">Please check your inbox for the verification link.</p>
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-amber-400 font-bold underline hover:text-amber-300 disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            )}

            {error && !pendingVerificationEmail && (
              <div className="mb-4 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Email, Username, or Phone</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all"
                    required
                    autoComplete="current-password"
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
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {isLoading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => onSwitchToRegister(), 100);
                }}
                className="text-xs text-white/50 hover:text-white font-bold transition-colors"
              >
                Don't have an account? <span className="text-[#1DB954]">Create one</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
