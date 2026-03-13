
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
const STATUSES = ["All", "Migrated – Pending Group Assignment", "In Review", "Assigned to Group"];

export default function AdminMigrationPage() {
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
    <div className="min-h-screen bg-[#070708] text-gray-100 font-['Inter']">
      {/* Sidebar Placeholder / Header */}
      <header className="border-b border-white/5 bg-[#0C0C0E]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/admin"} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Subscription Migrations
              </h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Internal Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <LayoutDashboard size={14} className="text-indigo-400" />
                <span className="text-sm font-semibold">Stats Overview</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">
               A
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Bar */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 mb-8 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Platform</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select 
                value={filters.platform}
                onChange={(e) => setFilters(f => ({ ...f, platform: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
              >
                {PLATFORMS.map(p => <option key={p} value={p} className="bg-[#0C0C0E]">{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
            >
              {STATUSES.map(s => <option key={s} value={s} className="bg-[#0C0C0E]">{s}</option>)}
            </select>
          </div>

          <div className="w-40 space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Payment Day</label>
            <input 
              type="number" 
              placeholder="e.g. 15"
              value={filters.payment_day}
              onChange={(e) => setFilters(f => ({ ...f, payment_day: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <button 
            onClick={() => setFilters({ platform: "All", status: "All", payment_day: "" })}
            className="px-6 py-3 border border-white/5 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>

        {/* Data Table / Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              All Migrations
              <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono">
                {migrations?.length || 0}
              </span>
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Pending</span>
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
            </div>
          </div>

          {!migrations ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl" />)}
            </div>
          ) : migrations.length === 0 ? (
            <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="text-gray-600" size={32} />
              </div>
              <p className="text-gray-400">No migrations found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {migrations.map((sub) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={sub._id}
                    className="bg-[#0C0C0E] border border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all flex flex-col lg:flex-row gap-8 items-start lg:items-center"
                  >
                    {/* User & Platform */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                        sub.platform === 'Netflix' ? 'bg-red-500/20 text-red-500 shadow-red-500/10' :
                        sub.platform === 'Spotify' ? 'bg-emerald-500/20 text-emerald-500 shadow-emerald-500/10' :
                        sub.platform === 'Canva' ? 'bg-blue-500/20 text-blue-500 shadow-blue-500/10' :
                        sub.platform === 'ChatGPT' ? 'bg-violet-500/20 text-violet-500 shadow-violet-500/10' :
                        'bg-gray-500/20 text-gray-400 shadow-gray-500/10'
                      }`}>
                        {sub.platform[0]}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{sub.profile_name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Mail size={12} /> {sub.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Phone size={12} /> {sub.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Specs */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full lg:w-auto">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-600 tracking-wider">Platform</p>
                        <p className="font-semibold">{sub.platform}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-600 tracking-wider">Payment Day</p>
                        <p className="font-semibold">{sub.payment_day}th of month</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-600 tracking-wider">Last Paid</p>
                        <p className="font-semibold flex items-center gap-1.5"><Calendar size={12} /> {sub.last_payment_date}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-gray-600 tracking-wider">Role</p>
                        <p className={`font-semibold ${sub.role === 'Group Manager' ? 'text-indigo-400' : 'text-gray-300'}`}>
                          {sub.role}
                        </p>
                      </div>
                    </div>

                    {/* Devices */}
                    <div className="lg:w-48 space-y-2">
                       <p className="text-[10px] uppercase font-bold text-gray-600 tracking-wider">Usage</p>
                       <div className="flex items-center gap-2 font-medium">
                         <Monitor size={14} className="text-gray-400" />
                         {sub.device_count}
                       </div>
                       <div className="flex flex-wrap gap-1">
                         {sub.device_types.map(t => (
                           <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-md text-gray-500 border border-white/5 lowercase">
                             {t}
                           </span>
                         ))}
                       </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="lg:w-64 space-y-3 w-full">
                      <div className={`text-xs font-bold py-2 px-4 rounded-xl border flex items-center gap-2 ${
                        sub.status === 'Assigned to Group' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                        {sub.status === 'Assigned to Group' ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {sub.status}
                      </div>
                      
                      {sub.status !== 'Assigned to Group' && (
                        <button 
                          onClick={() => handleAssign(sub._id)}
                          className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} />
                          Assign to Group
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
