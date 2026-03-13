
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  LayoutDashboard, 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Monitor,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

const PLATFORMS = ["All", "Netflix", "Spotify", "Canva", "ChatGPT", "Other"];
const STATUSES = ["All", "Migrated – Pending Group Assignment", "In Review", "Assigned to Group"];export default function AdminMigrationPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    platform: "All",
    status: "All",
    payment_day: ""
  });

  const migrations = useQuery(api.migrated_subscriptions.getMigrations, {
    platform: filters.platform,
    status: filters.status,
    payment_day: filters.payment_day ? Number(filters.payment_day) : undefined
  });

  const updateStatus = useMutation(api.migrated_subscriptions.updateMigrationStatus);

  const handleAssign = async (id: any) => {
    try {
      await updateStatus({ id, status: "Assigned to Group" });
      toast.success("User assigned to group successfully!");
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/admin"} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                Subscription Migrations
              </h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Internal Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 bg-black/5 rounded-full px-4 py-2">
                <LayoutDashboard size={14} className="text-zinc-400" />
                <span className="text-xs font-bold uppercase tracking-tight">Admin Overview</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black">
               A
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Bar */}
        <div className="bg-white border border-black/5 rounded-[2rem] p-8 mb-8 flex flex-wrap gap-8 items-end shadow-sm shadow-black/[0.02]">
          <div className="flex-1 min-w-[200px] space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Platform</label>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black" size={16} />
              <select 
                value={filters.platform}
                onChange={(e) => setFilters(f => ({ ...f, platform: e.target.value }))}
                className="w-full bg-[#F4F5F8] border-none rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-black/5 appearance-none font-bold transition-all"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-[#F4F5F8] border-none rounded-xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-black/5 appearance-none font-bold transition-all"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="w-40 space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Payment Day</label>
            <input 
              type="number" 
              placeholder="e.g. 15"
              value={filters.payment_day}
              onChange={(e) => setFilters(f => ({ ...f, payment_day: e.target.value }))}
              className="w-full bg-[#F4F5F8] border-none rounded-xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-black/5 font-bold transition-all"
            />
          </div>

          <button 
            onClick={() => setFilters({ platform: "All", status: "All", payment_day: "" })}
            className="px-6 py-3.5 bg-black/5 text-zinc-500 rounded-xl hover:bg-black/10 transition-colors text-sm font-bold"
          >
            Reset
          </button>
        </div>

        {/* Data Table / Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
              All Migrations
              <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {migrations?.length || 0}
              </span>
            </h2>
          </div>

          {!migrations ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-black/5 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : migrations.length === 0 ? (
            <div className="bg-white border border-black/5 rounded-[2rem] p-20 text-center space-y-4 shadow-sm shadow-black/[0.02]">
              <div className="w-20 h-20 bg-[#F4F5F8] rounded-3xl flex items-center justify-center mx-auto">
                <Search className="text-zinc-200" size={32} />
              </div>
              <p className="text-zinc-400 font-bold">No migrations found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence>
                {migrations.map((sub) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={sub._id}
                    className="bg-white border border-black/5 rounded-[2.5rem] p-8 hover:shadow-xl hover:shadow-black/[0.02] transition-all flex flex-col lg:flex-row gap-10 items-start lg:items-center shadow-sm shadow-black/[0.01]"
                  >
                    {/* User & Platform */}
                    <div className="flex items-center gap-5 min-w-[320px]">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-lg ${
                        sub.platform === 'Netflix' ? 'bg-red-50 text-red-500' :
                        sub.platform === 'Spotify' ? 'bg-emerald-50 text-emerald-500' :
                        sub.platform === 'Canva' ? 'bg-blue-50 text-blue-500' :
                        sub.platform === 'ChatGPT' ? 'bg-violet-50 text-violet-500' :
                        'bg-zinc-50 text-zinc-400'
                      }`}>
                        {sub.platform[0]}
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-black text-lg tracking-tight">{sub.profile_name}</h3>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 text-xs font-bold text-zinc-400"><Mail size={12} /> {sub.email}</span>
                          <span className="flex items-center gap-2 text-xs font-bold text-zinc-400"><Phone size={12} /> {sub.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Specs */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 w-full lg:w-auto">
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Platform</p>
                        <p className="font-bold text-zinc-600">{sub.platform}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Pay Day</p>
                        <p className="font-bold text-zinc-600">{sub.payment_day}th</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Last Paid</p>
                        <p className="font-bold text-zinc-600 flex items-center gap-2"><Calendar size={14} className="text-zinc-300" /> {sub.last_payment_date}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Role</p>
                        <p className={`font-bold ${sub.role === 'Group Manager' ? 'text-blue-500' : 'text-zinc-500'}`}>
                          {sub.role}
                        </p>
                      </div>
                    </div>

                    {/* Devices */}
                    <div className="lg:w-48 space-y-3">
                       <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Usage</p>
                       <div className="flex items-center gap-2 font-bold text-zinc-600">
                         <Monitor size={16} className="text-zinc-400" />
                         {sub.device_count}
                       </div>
                       <div className="flex flex-wrap gap-2">
                         {sub.device_types.map(t => (
                           <span key={t} className="text-[9px] px-2 py-0.5 bg-[#F4F5F8] rounded-lg text-zinc-400 font-bold uppercase tracking-tight">
                             {t}
                           </span>
                         ))}
                       </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="lg:w-64 space-y-4 w-full">
                      <div className={`text-[10px] font-black py-2.5 px-4 rounded-xl border flex items-center gap-2 uppercase tracking-widest ${
                        sub.status === 'Assigned to Group' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-amber-50 border-amber-100 text-amber-600'
                      }`}>
                        {sub.status === 'Assigned to Group' ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {sub.status}
                      </div>
                      
                      {sub.status !== 'Assigned to Group' && (
                        <button 
                          onClick={() => handleAssign(sub._id)}
                          className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                        >
                          <ExternalLink size={18} />
                          Assign Group
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
