
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
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    platform: "Netflix",
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
      await submitMigration({
        ...formData,
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
      <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 bg-[#161618] p-10 rounded-3xl border border-white/5 shadow-2xl"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Migration Successful!</h1>
          <p className="text-gray-400 text-lg">
            Your subscription has been successfully migrated to Q. Your group assignment will be completed shortly.
          </p>
          <button 
            onClick={() => window.location.href = "/"}
            className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group"
          >
            Go to Home Screen
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-['Inter']">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-4"
        >
          <ShieldCheck size={16} />
          Secure Account Migration
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl md:text-5xl font-black tracking-tight"
        >
          Migrate Your <span className="text-indigo-500">Subscription</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto text-gray-400 leading-relaxed"
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
          className="space-y-8 bg-[#161618] p-8 md:p-12 rounded-[2.5rem] border border-white/5"
        >
          {/* Section 1: Contact Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">1</span>
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section 2: Subscription Details */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">2</span>
              Subscription Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Subscription Platform</label>
                <div className="relative">
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 appearance-none focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p} className="bg-[#161618]">{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Profile Name on Account</label>
                <input
                  required
                  type="text"
                  name="profile_name"
                  value={formData.profile_name}
                  onChange={handleChange}
                  placeholder="e.g. Netflix profile name"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Monthly Payment Day</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="1"
                    max="31"
                    name="payment_day"
                    value={formData.payment_day}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">th</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Last Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    required
                    type="date"
                    name="last_payment_date"
                    value={formData.last_payment_date}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section 3: Group & Devices */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">3</span>
              Group & Device Info
            </h2>
            
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400 ml-1">Are You a Group Manager or Member?</label>
              <div className="grid grid-cols-2 gap-4">
                {ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role }))}
                    className={`py-4 rounded-2xl border transition-all font-medium ${
                      formData.role === role 
                      ? "bg-indigo-500 border-indigo-500 text-white" 
                      : "bg-black/20 border-white/5 text-gray-500 hover:border-white/10"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Group Size (Optional)</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="number"
                    name="group_size"
                    value={formData.group_size}
                    onChange={handleChange}
                    placeholder="Total members"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Connected Devices</label>
                <div className="relative">
                  <select
                    name="device_count"
                    value={formData.device_count}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 appearance-none focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  >
                    {DEVICE_COUNTS.map(d => <option key={d} value={d} className="bg-[#161618]">{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400 ml-1">Device Types (Optional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEVICE_TYPES.map(type => (
                  <button
                    key={type.label}
                    type="button"
                    onClick={() => handleDeviceTypeToggle(type.label)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      formData.device_types.includes(type.label)
                      ? "bg-indigo-500/20 border-indigo-500 text-white"
                      : "bg-black/20 border-white/5 text-gray-500 hover:border-white/10"
                    }`}
                  >
                    {type.icon}
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-8"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Migration...
              </>
            ) : (
              <>
                Complete Migration
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
