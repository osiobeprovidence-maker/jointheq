import React, { useState } from "react";
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
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";

const STATUSES = ["All", "Pending Review", "Active", "Rejected"];

export default function AdminListingsPage() {
  const admin = auth.getCurrentUser();
  const [filterStatus, setFilterStatus] = useState("Pending Review");

  // Approval Form fields for the modal
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [totalSlots, setTotalSlots] = useState<number>(0);
  const [pricePerSlot, setPricePerSlot] = useState<number>(0);
  const [ownerPayout, setOwnerPayout] = useState<number>(0);
  const [adminNote, setAdminNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const listings = useQuery(api.listings.getAdminListings, { status: filterStatus });
  const approveListing = useMutation(api.listings.approveListing);
  const rejectListing = useMutation(api.listings.rejectListing);

  const handleOpenApprove = (listing: any) => {
    setSelectedListing(listing);
    setTotalSlots(listing.total_slots || 1);

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
    if (!totalSlots || !pricePerSlot || !ownerPayout) return toast.error("Please fill in all approval details");
    setIsLoading(true);
    try {
      await approveListing({
        listing_id: selectedListing._id,
        admin_id: admin!._id as any,
        total_slots: totalSlots,
        price_per_slot: pricePerSlot,
        owner_payout: ownerPayout,
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
      await rejectListing({ listing_id: listing._id, admin_note: "Rejected by admin" });
      toast.success("Listing rejected");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans">
      <header className="border-b border-black/5 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/admin"} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">Subscription Listings</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Ownership & Inventory</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-black text-white' : 'bg-white text-zinc-400 border border-black/5'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 gap-6">
          {!listings ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-zinc-300" /></div>
          ) : listings.length === 0 ? (
            <div className="bg-white border border-black/5 rounded-[3rem] p-20 text-center text-zinc-400 uppercase font-black text-xs tracking-widest">
              No subscription listings found.
            </div>
          ) : (
            listings.map((listing: any) => (
              <div key={listing._id} className="bg-white border border-black/5 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-start lg:items-center gap-10 shadow-sm relative overflow-hidden">
                {listing.status === 'Pending Review' && <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>}

                <div className="flex items-center gap-6 min-w-[300px]">
                  <div className="w-16 h-16 bg-zinc-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-xl">
                    {listing.platform?.[0] || 'S'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-xl tracking-tight">{listing.platform || 'Subscription'}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{listing.status || 'Pending'}</span>
                      <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={12} /> {listing.renewal_date || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Account Credentials</p>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-600 flex items-center gap-2">
                        <Mail size={12} className="text-zinc-300" /> {listing.email || listing.login_email}
                      </p>
                      <p className="text-xs font-bold text-zinc-600 flex items-center gap-2">
                        <Lock size={12} className="text-zinc-300" /> ••••••••
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Target Revenue</p>
                    <p className="text-sm font-black text-indigo-600">₦{(listing.slot_price || listing.price_per_slot || 0).toLocaleString()} / Slot</p>
                    <p className="text-[10px] font-bold text-zinc-400">Payout: ₦{(listing.owner_payout_amount || 0).toLocaleString()}/mo</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Owner</p>
                    <p className="text-xs font-bold text-zinc-600 truncate">{listing.owner_name || String(listing.owner_id)}</p>
                  </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                  {listing.status === 'Pending Review' ? (
                    <>
                      <button
                        onClick={() => handleOpenApprove(listing)}
                        className="flex-1 lg:flex-none px-8 py-4 bg-black text-white font-black rounded-2xl shadow-xl shadow-black/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={20} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(listing)}
                        className="flex-1 lg:flex-none p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center"
                      >
                        <XCircle size={20} />
                      </button>
                    </>
                  ) : (
                    <div className="px-6 py-3 bg-zinc-50 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {listing.status}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Approve Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
              onClick={() => setSelectedListing(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white max-w-lg w-full rounded-[3rem] p-10 relative z-10 shadow-2xl"
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                  {selectedListing.platform?.[0] || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-black">Approve {selectedListing.platform || 'Subscription'}</h2>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Verify & Set Payouts</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Total Slots</label>
                    <input
                      type="number"
                      value={totalSlots}
                      onChange={(e) => setTotalSlots(Number(e.target.value))}
                      className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 font-black outline-none focus:ring-2 ring-black/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Price / Slot (₦)</label>
                    <input
                      type="number"
                      value={pricePerSlot}
                      onChange={(e) => setPricePerSlot(Number(e.target.value))}
                      className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 font-black outline-none focus:ring-2 ring-black/10"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-center py-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Monthly Owner Payout (₦)</label>
                  <input
                    type="number"
                    value={ownerPayout}
                    onChange={(e) => setOwnerPayout(Number(e.target.value))}
                    className="w-full bg-transparent border-none text-center text-3xl font-black text-indigo-600 outline-none"
                  />
                  <p className="text-[10px] font-bold text-indigo-400">Total Marketplace Rev: ₦{(totalSlots * pricePerSlot).toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Admin Note (optional)</label>
                  <textarea
                    placeholder="Internal notes..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm font-medium h-24 outline-none focus:ring-2 ring-black/10 resize-none"
                  />
                </div>

                <button
                  disabled={isLoading}
                  onClick={handleApproveSubmit}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                  Verify & Launch Listing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
