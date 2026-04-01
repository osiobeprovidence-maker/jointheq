import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";
import { getUserFacingErrorMessage } from "../lib/errors";
import { MainLayout } from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";

const PLATFORMS = ["Netflix Premium", "Spotify", "Apple Music", "VPN", "CapCut", "AI Tools", "Other"];
const DEVICE_COUNTS = ["1", "2", "3", "4+"];

export default function MigrationPage() {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as any } : "skip");

  const [formData, setFormData] = useState({
    platform: "Netflix Premium",
    profile_name: "",
    payment_day: 1,
    last_payment_date: "",
    device_count: "1",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitMigration = useMutation(api.migrated_subscriptions.submitMigration);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "payment_day" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to migrate your slot");

    setLoading(true);
    try {
      await submitMigration({
        user_id: user._id as any,
        platform: formData.platform,
        profile_name: formData.profile_name,
        payment_day: formData.payment_day,
        last_payment_date: formData.last_payment_date,
        device_count: formData.device_count,
      });
      setSubmitted(true);
      toast.success("Migration submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, "Failed to submit migration. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout
        activeTab="migrate"
        setActiveTab={() => navigate('/dashboard')}
        qScore={currentUser?.q_score || 0}
      >
        <div className="flex items-center justify-center py-20 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-xl shadow-black/[0.02]"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={48} />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Migration Successful!</h1>
            <p className="text-zinc-500 text-lg font-medium">
              We've received your request! Our team will verify your slot and assign you to your subscription group shortly.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-5 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              Go to Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      activeTab="migrate"
      setActiveTab={(tab) => {
        if (tab === 'migrate') return;
        navigate('/dashboard');
      }}
      qScore={currentUser?.q_score || 0}
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Migrate Subscription</h1>
          <p className="text-zinc-500 mt-2 text-base">
            Transfer your existing subscription to manage it inside Q.
          </p>
        </div>

        {/* Section 1: Identity Verification */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check size={16} strokeWidth={3} />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Identity Verified</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <p className="text-zinc-600 font-medium">
              Your email <span className="font-bold text-zinc-900">{currentUser?.email}</span> is linked to this account.
            </p>
          </div>
        </section>

        {/* Section 2: Subscription Details */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Subscription Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
              {/* Platform Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Subscription Platform</label>
                <div className="relative">
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full bg-[#f4f5f8] border-none rounded-2xl py-4 px-5 appearance-none focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all font-bold text-zinc-800 text-base"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                </div>
              </div>

              {/* Profile Name */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Profile Name on Account</label>
                <input
                  required
                  type="text"
                  name="profile_name"
                  value={formData.profile_name}
                  onChange={handleChange}
                  placeholder="e.g. Netflix profile name"
                  className="w-full bg-[#f4f5f8] border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all font-bold placeholder:text-zinc-300 text-base"
                />
              </div>

              {/* Payment Day & Last Payment Date */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Payment Day (1-31)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="31"
                    name="payment_day"
                    value={formData.payment_day}
                    onChange={handleChange}
                    className="w-full bg-[#f4f5f8] border-none rounded-2xl py-4 px-5 focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all font-bold text-center text-base"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Last Payment Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={20} />
                    <input
                      required
                      type="date"
                      name="last_payment_date"
                      value={formData.last_payment_date}
                      onChange={handleChange}
                      className="w-full bg-[#f4f5f8] border-none rounded-2xl py-4 pl-13 pr-5 focus:ring-2 focus:ring-zinc-900/10 outline-none transition-all font-bold text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Device Count */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Number of Devices Used</label>
                <div className="grid grid-cols-4 gap-3">
                  {DEVICE_COUNTS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, device_count: d }))}
                      className={`py-4 rounded-2xl border-2 transition-all font-bold text-base ${formData.device_count === d
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-lg"
                        : "bg-[#f4f5f8] border-transparent text-zinc-500 hover:bg-[#EBECF0]"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Migration Confirmation - Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-zinc-900 text-white shadow-lg rounded-2xl font-bold text-base hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit Migration Request
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        </section>
      </div>
    </MainLayout>
  );
}
