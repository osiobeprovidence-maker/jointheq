
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Phone,
  ChevronDown,
  Calendar,
  Users,
  Laptop,
  Tv,
  Smartphone,
  Gamepad,
  Tablet,
  MoreHorizontal,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "convex/react";
import { auth } from "../lib/auth";
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
      toast.error("Failed to submit migration. Please try again.");
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
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-8">
        <button
          onClick={() => user ? navigate('/dashboard') : navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-black font-bold text-sm transition-colors group"
        >
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm border border-black/5">
            <ArrowLeft size={20} />
          </div>
          Back to {user ? 'Dashboard' : 'Home'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="text-center space-y-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4"
          >
            <ShieldCheck size={14} className="text-indigo-500" />
            Verified Migration Portal
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900"
          >
            Migrate <span className="text-zinc-300 underline decoration-zinc-100 underline-offset-8">Subscription</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="max-w-lg mx-auto text-zinc-500 leading-relaxed font-medium mt-6"
          >
            Offline Q member? Migrate your existing slot here to manage it directly on the platform.
          </motion.p>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 p-8 rounded-[2.5rem] text-white mb-8 shadow-2xl shadow-black/10 flex items-center gap-6"
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-tight">Identity Linked</h4>
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-tight leading-relaxed">
              Your account info ({currentUser?.email}) is already linked. Just tell us which subscription you are using.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-10 bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-xl shadow-black/[0.02]"
        >
          {/* Subscription Details */}
          <div className="space-y-8">
            <h2 className="text-xl font-black flex items-center gap-4 text-zinc-900">
              <span className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm font-black">1</span>
              Subscription Details
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Subscription Platform</label>
                <div className="relative">
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full bg-[#f4f5f8] border-none rounded-2xl py-5 px-6 appearance-none focus:ring-1 focus:ring-zinc-900 outline-none transition-all font-bold text-zinc-800 text-sm"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Profile Name on Account</label>
                <input
                  required
                  type="text"
                  name="profile_name"
                  value={formData.profile_name}
                  onChange={handleChange}
                  placeholder="e.g. Netflix profile name"
                  className="w-full bg-[#f4f5f8] border-none rounded-2xl py-5 px-6 focus:ring-1 focus:ring-zinc-900 outline-none transition-all font-bold placeholder:text-zinc-300 text-sm"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Payment Day (1-31)</label>
                  <div className="relative group">
                    <input
                      required
                      type="number"
                      min="1"
                      max="31"
                      name="payment_day"
                      value={formData.payment_day}
                      onChange={handleChange}
                      className="w-full bg-[#f4f5f8] border-none rounded-2xl py-5 px-6 focus:ring-1 focus:ring-zinc-900 outline-none transition-all font-bold text-center text-base"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Last Payment Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={20} />
                    <input
                      required
                      type="date"
                      name="last_payment_date"
                      value={formData.last_payment_date}
                      onChange={handleChange}
                      className="w-full bg-[#f4f5f8] border-none rounded-2xl py-5 pl-14 pr-6 focus:ring-1 focus:ring-zinc-900 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Number of Devices Used</label>
                <div className="grid grid-cols-4 gap-3">
                  {DEVICE_COUNTS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, device_count: d }))}
                      className={`py-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.device_count === d
                          ? "bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-black/10"
                          : "bg-[#f4f5f8] border-transparent text-zinc-400 hover:bg-[#EBECF0]"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            type="submit"
            className="w-full py-6 bg-zinc-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] rounded-[2rem] font-bold text-base hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Migrate Subscription
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </MainLayout>
  );
}
