
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
  ChevronLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "convex/react";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";

const PLATFORMS = ["Netflix", "Spotify", "Canva", "ChatGPT", "Other"];
const ROLES = ["Group Manager", "Member"];
const DEVICE_COUNTS = ["1 device", "2 devices", "3 devices", "4 devices", "5 devices", "6+ devices"];
const DEVICE_TYPES = [
  { label: "Phone", icon: <Smartphone size={18} /> },
  { label: "Laptop / PC", icon: <Laptop size={18} /> },
  { label: "Tablet", icon: <Tablet size={18} /> },
  { label: "Smart TV", icon: <Tv size={18} /> },
  { label: "Game Console", icon: <Gamepad size={18} /> },
  { label: "Other", icon: <MoreHorizontal size={18} /> }
];

export default function MigrationPage() {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const currentUser = useQuery(api.users.getById, user?._id ? { id: user._id as any } : "skip");
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    platform: "Netflix",
    custom_platform: "",
    profile_name: "",
    payment_day: 1,
    last_payment_date: "",
    role: "Member",
    group_size: "",
    device_count: "1 device",
    device_types: [] as string[]
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitMigration = useMutation(api.migrated_subscriptions.submitMigration);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeviceTypeToggle = (type: string) => {
    setFormData(prev => {
      const types = prev.device_types.includes(type)
        ? prev.device_types.filter(t => t !== type)
        : [...prev.device_types, type];
      return { ...prev, device_types: types };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const platformToSubmit = formData.platform === "Other" ? formData.custom_platform : formData.platform;
      
      if (formData.platform === "Other" && !formData.custom_platform) {
        toast.error("Please specify your subscription name");
        setLoading(false);
        return;
      }

      await submitMigration({
        ...formData,
        platform: platformToSubmit,
        payment_day: Number(formData.payment_day),
        group_size: formData.group_size ? Number(formData.group_size) : undefined
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
        setActiveTab={(tab) => navigate('/dashboard')}
        qScore={currentUser?.q_score || 0}
      >
        <div className="flex items-center justify-center py-20 px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/5"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={48} />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Migration Successful!</h1>
            <p className="text-zinc-500 text-lg">
              Your subscription has been successfully migrated to Q. Your group assignment will be completed shortly.
            </p>
            <button 
              onClick={() => window.location.href = "/dashboard"}
              className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group shadow-lg shadow-black/10"
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
      <div className="text-zinc-900 font-sans">
        {/* Navigation / Back Button */}
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <button 
            onClick={() => user ? navigate('/dashboard') : navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-black font-bold text-sm transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-sm">
              <ChevronLeft size={16} />
            </div>
            Back to {user ? 'Dashboard' : 'Home'}
          </button>
        </div>

        {/* Header */}
        <div className="pt-10 pb-12 px-6 text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 border border-black/5 rounded-full text-zinc-600 text-sm font-bold mb-4"
          >
            <ShieldCheck size={16} className="text-emerald-500" />
            Secure Migration
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Migrate <span className="text-zinc-400">Account</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="max-w-lg mx-auto text-zinc-500 leading-relaxed font-medium"
          >
            If you are already using a shared subscription through Q offline, you can migrate your account here so it can be managed on the platform.
          </motion.p>
        </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-10 bg-white p-8 md:p-14 rounded-[3rem] border border-black/5 shadow-xl shadow-black/[0.02]"
        >
          {/* Section 1: Contact Info */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-sm font-black">1</span>
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={20} />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium placeholder:text-zinc-300"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={20} />
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234..."
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium placeholder:text-zinc-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100" />

          {/* Section 2: Subscription Details */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-sm font-black">2</span>
              Subscription Details
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Subscription Platform</label>
                <div className="relative">
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 appearance-none focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                </div>
              </div>

              {formData.platform === "Other" ? (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-400 ml-1">Specify Subscription</label>
                  <input
                    required
                    type="text"
                    name="custom_platform"
                    value={formData.custom_platform}
                    onChange={handleChange}
                    placeholder="e.g. Crunchyroll"
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold placeholder:text-zinc-300"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-400 ml-1">Profile Name on Account</label>
                  <input
                    required
                    type="text"
                    name="profile_name"
                    value={formData.profile_name}
                    onChange={handleChange}
                    placeholder="e.g. Netflix profile name"
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold placeholder:text-zinc-300"
                  />
                </div>
              )}
            </div>

            {formData.platform === "Other" && (
               <div className="space-y-3">
               <label className="text-sm font-bold text-zinc-400 ml-1">Profile Name on Account</label>
               <input
                 required
                 type="text"
                 name="profile_name"
                 value={formData.profile_name}
                 onChange={handleChange}
                 placeholder="e.g. Profil name used"
                 className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold placeholder:text-zinc-300"
               />
             </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Monthly Payment Day</label>
                <div className="relative group">
                  <input
                    required
                    type="number"
                    min="1"
                    max="31"
                    name="payment_day"
                    value={formData.payment_day}
                    onChange={handleChange}
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">th</div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Last Payment Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={20} />
                  <input
                    required
                    type="date"
                    name="last_payment_date"
                    value={formData.last_payment_date}
                    onChange={handleChange}
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100" />

          {/* Section 3: Group & Devices */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-sm font-black">3</span>
              Group & Device Info
            </h2>
            
            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-400 ml-1">Role in Subscription</label>
              <div className="grid grid-cols-2 gap-4">
                {ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role }))}
                    className={`py-5 rounded-2xl border-2 transition-all font-bold text-sm ${
                      formData.role === role 
                      ? "bg-black border-black text-white shadow-lg shadow-black/10" 
                      : "bg-[#F4F5F8] border-transparent text-zinc-400 hover:bg-[#EBECF0]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Group Size (Optional)</label>
                <div className="relative group">
                  <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={20} />
                  <input
                    type="number"
                    name="group_size"
                    value={formData.group_size}
                    onChange={handleChange}
                    placeholder="Total members"
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold placeholder:text-zinc-300"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-400 ml-1">Connected Devices</label>
                <div className="relative">
                  <select
                    name="device_count"
                    value={formData.device_count}
                    onChange={handleChange}
                    className="w-full bg-[#F4F5F8] border-none rounded-2xl py-5 px-6 appearance-none focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold"
                  >
                    {DEVICE_COUNTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-400 ml-1">Device Types (Optional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {DEVICE_TYPES.map(type => (
                  <button
                    key={type.label}
                    type="button"
                    onClick={() => handleDeviceTypeToggle(type.label)}
                    className={`flex items-center gap-3 p-5 rounded-2xl border-2 transition-all group ${
                      formData.device_types.includes(type.label)
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-black/5"
                      : "bg-[#F4F5F8] border-transparent text-zinc-400 hover:bg-[#EBECF0]"
                    }`}
                  >
                    <span className={formData.device_types.includes(type.label) ? "text-white" : "text-zinc-300 group-hover:text-zinc-500"}>
                      {type.icon}
                    </span>
                    <span className="text-sm font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full py-6 bg-black text-white font-black rounded-[2rem] shadow-xl shadow-black/10 hover:shadow-black/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-xl mt-12"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Migration
                <ArrowRight size={24} />
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
    </MainLayout>
  );
}
