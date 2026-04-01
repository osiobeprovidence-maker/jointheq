import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  BadgeDollarSign,
  ShieldCheck,
  Mail,
  Lock,
  Calendar,
  Layers,
  ExternalLink,
  Loader2,
  Tag,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";
import { MainLayout } from "../layouts/MainLayout";

const STATUSES = ["All", "Pending Review", "Active", "Rejected"];
const CATEGORIES = ["Streaming", "Music", "Design", "AI", "Productivity", "Gaming", "VPN", "Software", "Utility", "Education"];

export default function AdminListingsPage() {
  const admin = auth.getCurrentUser();
  const [activeTab, setActiveTab] = useState('marketplace'); // For layout
  const [filterStatus, setFilterStatus] = useState("Pending Review");

  // Approval Form fields for the modal
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [totalSlots, setTotalSlots] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [pricePerSlot, setPricePerSlot] = useState<number>(0);
  const [ownerPayout, setOwnerPayout] = useState<number>(0);
  const [adminNote, setAdminNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const listings = useQuery(api.listings.getAdminListings, { status: filterStatus });
  const approveListing = useMutation(api.listings.approveListing);
  const rejectListing = useMutation(api.listings.rejectListing);

  // Memoize listings to prevent re-rendering duplicates
  const memoizedListings = useMemo(() => {
    if (!listings) return undefined;
    // Deduplicate by _id in case of any data duplication
    const uniqueMap = new Map();
    listings.forEach((listing: any) => {
      uniqueMap.set(listing._id, listing);
    });
    return Array.from(uniqueMap.values());
  }, [listings]);

  const handleOpenApprove = (listing: any) => {
    setSelectedListing(listing);
    setTotalSlots(listing.total_slots || 1);
    setCategory(listing.category || "");

    // Suggest pricing based on platform
    if (listing.platform === "Netflix Premium") {
      setPricePerSlot(1600);
      setOwnerPayout(13000);
    } else if (listing.platform === "Spotify Family") {
      setPricePerSlot(800);
      setOwnerPayout(4800);
    } else {
      setPricePerSlot(1000);
      setOwnerPayout(0);
    }
  };

  const handleApproveSubmit = async () => {
    if (!totalSlots || !pricePerSlot || !ownerPayout || !category) return toast.error("Please fill in all approval details including Category");
    setIsLoading(true);
    try {
      await approveListing({
        listing_id: selectedListing._id,
        admin_id: admin!._id as any,
        total_slots: totalSlots,
        price_per_slot: pricePerSlot,
        owner_payout: ownerPayout,
        category: category,
        admin_note: adminNote || undefined
      });
      toast.success("Listing approved and marketplace updated!");
      setSelectedListing(null);
      setAdminNote("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (listing: any) => {
    if (!confirm("Reject this listing?")) return;
    try {
      await rejectListing({ listing_id: listing._id, admin_note: "Rejected by admin", admin_id: admin!._id as any });
      toast.success("Listing rejected");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        {/* Unified Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-gray-100 pb-6 sm:pb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Listing Review</h1>
            <p className="text-gray-500 mt-1 text-sm">Verify ownership and approve user-contributed subscriptions.</p>
          </div>
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 overflow-x-auto scrollbar-hide">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 sm:px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${filterStatus === s
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-400 hover:text-black hover:bg-white/50'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <main className="space-y-4 sm:space-y-6">
          {!memoizedListings ? (
            <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-gray-300">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-bold text-sm uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : memoizedListings.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 sm:p-24 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Layers size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">No {filterStatus} listings</p>
                <p className="text-xs text-gray-400 mt-1">Everything is caught up at the moment.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {memoizedListings.map((listing: any) => (
                <div key={listing._id} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-6 md:gap-8 lg:flex-row lg:gap-10 items-start lg:items-center shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  {listing.status === 'Pending Review' && <div className="absolute top-0 left-0 w-1.5 h-full bg-black"></div>}

                  <div className="flex items-center gap-4 sm:gap-6 min-w-[240px] sm:min-w-[280px] w-full lg:w-auto">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 text-black border border-gray-100 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-sm group-hover:bg-black group-hover:text-white transition-all flex-shrink-0">
                      {listing.platform?.[0] || 'S'}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 truncate">{listing.platform || 'Subscription'}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0 ${listing.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                          listing.status === 'Pending Review' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                          {listing.status}
                        </span>
                        {listing.category && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Tag size={10} /> <span className="truncate">{listing.category}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100/50 w-full">
                    <div className="space-y-1 sm:space-y-2 min-w-0">
                      <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Credentials</p>
                      <div className="space-y-1">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 flex items-center gap-1 sm:gap-2 group-hover:text-black transition-colors truncate">
                          <Mail size={10} className="text-gray-300 flex-shrink-0" /> {listing.email || listing.login_email}
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 flex items-center gap-1 sm:gap-2">
                          <Lock size={10} className="text-gray-300 flex-shrink-0" /> •••••••••
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 sm:space-y-2 min-w-0">
                      <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Marketplace Info</p>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-gray-900">₦{(listing.slot_price || 0).toLocaleString()} <span className="text-[10px] text-gray-400">/ slot</span></div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <BadgeDollarSign size={10} /> ₦{(listing.owner_payout_amount || 0).toLocaleString()} <span className="opacity-50 font-medium">Monthly Payout</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 sm:space-y-2 min-w-0">
                      <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Listing Owner</p>
                      <p className="text-xs font-bold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200 flex-shrink-0"></div>
                        <span className="truncate">{listing.owner_name || "Platform Provider"}</span>
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <Clock size={10} className="flex-shrink-0" /> {listing.renewal_date || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3 w-full lg:w-auto lg:flex-shrink-0">
                    {listing.status === 'Pending Review' ? (
                      <>
                        <button
                          onClick={() => handleOpenApprove(listing)}
                          className="flex-1 lg:flex-none px-4 sm:px-6 py-3 sm:py-3.5 bg-black text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                          <ShieldCheck size={16} /> <span className="hidden sm:inline">Review</span>
                        </button>
                        <button
                          onClick={() => handleReject(listing)}
                          className="w-10 sm:w-12 h-10 sm:h-12 flex-none bg-white border border-gray-100 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    ) : (
                      <button className="px-4 sm:px-6 py-3 bg-white border border-gray-100 rounded-xl text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest cursor-default">
                        Verified
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Unified Approval Modal (The "Subscription Form Page") */}
        <AnimatePresence>
          {selectedListing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setSelectedListing(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white max-w-xl w-full rounded-[2rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
                  {/* Modal Header */}
                  <div className="flex items-center gap-4 sm:gap-6 border-b border-gray-50 pb-6 sm:pb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xl shadow-black/10 flex-shrink-0">
                      {selectedListing.platform?.[0] || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Approve Subscription</h2>
                      <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">Finalize pricing for {selectedListing.platform}</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Category Selection in Modal */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marketplace Category</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold border transition-all flex-shrink-0 ${category === cat
                              ? 'bg-black text-white border-black shadow-md'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capacity (Slots)</label>
                        <input
                          type="number"
                          value={totalSlots}
                          onChange={(e) => setTotalSlots(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 sm:py-4 px-4 sm:px-5 font-bold text-sm outline-none focus:ring-2 ring-black transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price per Slot (₦)</label>
                        <input
                          type="number"
                          value={pricePerSlot}
                          onChange={(e) => setPricePerSlot(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 sm:py-4 px-4 sm:px-5 font-bold text-sm outline-none focus:ring-2 ring-black transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 bg-black rounded-2xl text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 blur-xl group-hover:bg-white/10 transition-all"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <label className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 text-center">Monthly Owner Payout</label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-lg sm:text-xl font-bold text-white/40">₦</span>
                          <input
                            type="number"
                            value={ownerPayout}
                            onChange={(e) => setOwnerPayout(Number(e.target.value))}
                            className="bg-transparent border-none text-center text-2xl sm:text-3xl md:text-4xl font-black text-white outline-none w-32 sm:w-40"
                          />
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-emerald-400 mt-3 sm:mt-4 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 text-center">
                          Marketplace Revenue: ₦{(totalSlots * pricePerSlot).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Admin Note</label>
                      <textarea
                        placeholder="Add notes about account verification..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 sm:py-4 px-4 sm:px-5 text-sm font-medium h-20 sm:h-24 outline-none focus:ring-2 ring-black transition-all resize-none"
                      />
                    </div>

                    <button
                      disabled={isLoading || !category}
                      onClick={handleApproveSubmit}
                      className="w-full py-5 bg-black text-white font-bold rounded-xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                      Verify & Publish to Marketplace
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
