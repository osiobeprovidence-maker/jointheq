import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  Users, 
  Calendar, 
  ShieldCheck, 
  BadgeDollarSign, 
  ChevronRight,
  MonitorPlay,
  Music4,
  Clock,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/auth";

export default function OwnerEarningsPage() {
  const user = auth.getCurrentUser();
  const listings = useQuery(api.listings.getOwnerListings, { owner_id: user!._id as any });

  const stats = {
    totalRevenue: listings?.reduce((acc, l) => acc + (l.status === 'Active' ? (l.owner_payout_amount || 0) : 0), 0) || 0,
    activeListings: listings?.filter(l => l.status === 'Active').length || 0,
    pendingVerifications: listings?.filter(l => l.status === 'Pending Review').length || 0,
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-zinc-900 font-sans pb-24">
      <header className="bg-white border-b border-black/5 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/dashboard"} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">Owner Dashboard</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Earnings & Subscriptions</p>
            </div>
          </div>
          <button 
             onClick={() => window.location.href = "/list-subscription"}
             className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
          >
            List New
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10">
                 <Wallet size={24} className="mb-4 text-indigo-200" />
                 <div className="text-3xl font-black">₦{stats.totalRevenue.toLocaleString()}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-1">Monthly Earned</div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <TrendingUp size={24} className="mb-4 text-emerald-500" />
              <div className="text-3xl font-black">{stats.activeListings}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Active Subscriptions</div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
              <Clock size={24} className="mb-4 text-amber-500" />
              <div className="text-3xl font-black">{stats.pendingVerifications}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Pending Review</div>
           </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">My Listings</h2>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Payouts: Monthly</span>
          </div>

          {!listings ? (
             <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] animate-pulse" />)}
             </div>
          ) : listings.length === 0 ? (
             <div className="bg-white border border-black/5 rounded-[3rem] p-16 text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
                   <BadgeDollarSign size={40} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black">No Active Listings</h3>
                   <p className="text-sm font-medium text-zinc-400 max-w-xs mx-auto">
                      List your first subscription account today and start earning monthly revenue.
                   </p>
                </div>
                <button 
                   onClick={() => window.location.href = "/list-subscription"}
                   className="px-8 py-4 bg-zinc-900 text-white font-black rounded-2xl"
                >
                   Get Started
                </button>
             </div>
          ) : (
             <div className="grid grid-cols-1 gap-4">
                {listings.map((l) => (
                   <motion.div 
                      key={l._id} 
                      layout
                      className="bg-white border border-black/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-black/[0.02] transition-all"
                   >
                      <div className="flex items-center gap-6">
                         <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-white ${
                            l.platform.includes('Netflix') ? 'bg-red-500' : 
                            l.platform.includes('Spotify') ? 'bg-emerald-500' : 'bg-indigo-500'
                         }`}>
                            {l.platform[0]}
                         </div>
                         <div className="space-y-1">
                            <h4 className="font-black text-lg tracking-tight">{l.platform}</h4>
                            <div className="flex items-center gap-3">
                               <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{l.email}</span>
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  l.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                                  l.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                               }`}>
                                  {l.status}
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 px-4">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Earnings</p>
                            <p className="font-black text-indigo-600">₦{(l.owner_payout_amount || 0).toLocaleString()}/mo</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Next Renewal</p>
                            <p className="font-bold text-zinc-600 flex items-center gap-2 text-xs">
                               <Calendar size={12} className="text-zinc-300" /> {l.renewal_date}
                            </p>
                         </div>
                         <div className="space-y-1 hidden md:block">
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Managed Slots</p>
                            <p className="font-bold text-zinc-600 flex items-center gap-2 text-xs">
                               <Users size={12} className="text-zinc-300" /> {l.total_slots} Slots
                            </p>
                         </div>
                      </div>

                      <button className="p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors">
                        <ChevronRight size={20} className="text-zinc-300" />
                      </button>
                   </motion.div>
                ))}
             </div>
          )}
        </section>

        <section className="mt-12 bg-indigo-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shrink-0">
                 <ShieldCheck size={40} className="text-indigo-300" />
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black">How Payouts Work</h3>
                 <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-xl">
                    Once your subscription is approved, it goes live in our marketplace. Q handles member recruitment, billing, and credential security. Payouts are credited to your wallet automatically at the end of each billing cycle, which you can withdraw to your bank account anytime.
                 </p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
