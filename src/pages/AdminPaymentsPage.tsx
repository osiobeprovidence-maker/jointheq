import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wallet, 
  Calendar,
  User,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Image as ImageIcon,
  Building2,
  Minimize2,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { auth } from "../lib/auth";

const STATUSES = ["All", "Awaiting Review", "Approved", "Rejected"];

export default function AdminPaymentsPage() {
  const user = auth.getCurrentUser();
  const [filterStatus, setFilterStatus] = useState("Awaiting Review");
  const [adminNote, setAdminNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const requests = useQuery(api.funding.getManualRequests, { 
    status: filterStatus 
  });
  
  const approveMutation = useMutation(api.funding.approveFunding);
  const rejectMutation = useMutation(api.funding.rejectFunding);

  const handleApprove = async (id: any) => {
    if (!confirm("Are you sure you want to approve this payment? This will credit the user's wallet with the base amount.")) return;
    try {
      setProcessingId(id);
      await approveMutation({ 
        request_id: id, 
        admin_id: user!._id as any,
        admin_note: adminNote || undefined
      });
      toast.success("Payment approved and wallet credited!");
      setAdminNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to approve payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: any) => {
    if (!adminNote) return toast.error("Please provide a reason for rejection in the note field.");
    if (!confirm("Reject this payment?")) return;
    try {
      setProcessingId(id);
      await rejectMutation({ 
        request_id: id, 
        admin_id: user!._id as any,
        admin_note: adminNote
      });
      toast.success("Payment rejected");
      setAdminNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-zinc-900 font-sans">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/admin"} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">Manual Payments Review</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Finance Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="text-xs font-black">{user?.full_name}</div>
               <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Finance Admin</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black">
               {user?.full_name?.[0]}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats / Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <Clock size={20} />
            </div>
            <div className="text-3xl font-black">{(requests?.filter(r => r.status === 'Awaiting Review').length || 0)}</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Pending Review</div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle size={20} />
            </div>
            <div className="text-3xl font-black">{(requests?.filter(r => r.status === 'Approved').length || 0)}</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Processed</div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Wallet size={20} />
            </div>
            <div className="text-3xl font-black">₦{requests?.reduce((acc, r) => acc + (r.status === 'Approved' ? r.base_amount : 0), 0).toLocaleString()}</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Total Credited</div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={20} />
            </div>
            <div className="text-3xl font-black">₦{requests?.reduce((acc, r) => acc + (r.status === 'Approved' ? (r.unique_amount - r.base_amount) : 0), 0).toLocaleString()}</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Total Verification Digits</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-black/5 rounded-[2rem] p-8 mb-8 flex flex-wrap gap-8 items-end shadow-sm">
          <div className="flex-1 min-w-[200px] space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status Filter</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === s ? 'bg-black text-white shadow-lg' : 'bg-black/5 text-zinc-500 hover:bg-black/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[300px] space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Admin Note / Rejection Reason</label>
            <input 
              type="text"
              placeholder="Add a note before approving or rejecting..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full bg-[#F4F5F8] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-black/5 font-bold"
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-6">
          {!requests ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/60 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-black/5 rounded-[2rem] p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-[#F4F5F8] rounded-3xl flex items-center justify-center mx-auto text-zinc-200">
                <ShieldCheck size={40} />
              </div>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">No requests found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence>
                {requests.map((req) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={req._id}
                    className="bg-white border border-black/5 rounded-[2.5rem] p-8 hover:shadow-xl hover:shadow-black/[0.02] transition-all flex flex-col lg:flex-row gap-10 items-start lg:items-center shadow-sm shadow-black/[0.01] relative overflow-hidden"
                  >
                    {req.status === 'Awaiting Review' && (
                       <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                    )}

                    <div className="flex items-center gap-6 min-w-[350px]">
                      <div className="space-y-1 text-center">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
                            ₦
                         </div>
                         <div className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Verified ID</div>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-baseline gap-2">
                           <h3 className="font-black text-2xl tracking-tight text-indigo-600">₦{req.unique_amount.toLocaleString()}</h3>
                           <span className="text-xs font-bold text-zinc-400"> (Credits ₦{req.base_amount.toLocaleString()})</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                            <User size={12} className="text-zinc-300" /> {req.sender_name}
                          </span>
                          <span className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            <Building2 size={12} className="text-zinc-200" /> {req.bank_name || "NOT SPECIFIED"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 w-full lg:w-auto">
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Status</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                          req.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {req.status === 'Awaiting Review' && <Clock size={12} />}
                          {req.status}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Proof</p>
                        {req.screenshot_id ? (
                           <button 
                             onClick={() => setSelectedScreenshot(req.screenshot_id)}
                             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                           >
                             <ImageIcon size={14} /> View Screenshot
                           </button>
                        ) : (
                          <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">No Image</span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">Timestamp</p>
                        <p className="font-bold text-zinc-600 flex items-center gap-2 text-xs">
                          <Calendar size={12} className="text-zinc-300" /> {new Date(req.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="lg:w-80 space-y-4 w-full h-full flex flex-col justify-center border-l border-black/5 pl-10">
                      {req.status === 'Awaiting Review' ? (
                        <div className="flex gap-3">
                          <button 
                            disabled={!!processingId}
                            onClick={() => handleReject(req._id)}
                            className="flex-1 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                          <button 
                            disabled={!!processingId}
                            onClick={() => handleApprove(req._id)}
                            className="flex-2 py-4 bg-black text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-sm shadow-xl shadow-black/10"
                          >
                            <CheckCircle size={18} /> Approve
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-black/5 text-xs font-medium text-zinc-500 leading-relaxed italic">
                          <div className="font-black uppercase text-[8px] text-zinc-300 not-italic mb-1">Admin Notes</div>
                          {req.admin_note || "No administrative notes provided."}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="absolute top-6 right-6 z-10">
                  <button onClick={() => setSelectedScreenshot(null)} className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white">
                    <XCircle size={24} />
                  </button>
               </div>
               <img 
                 src={`https://aromatic-ox-169.eu-west-1.convex.site/api/storage/${selectedScreenshot}`} 
                 alt="Transfer Proof" 
                 className="w-full h-full object-contain bg-zinc-900"
               />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
