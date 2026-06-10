import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import {
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MessageSquare,
  User,
  Trash2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

export const QueueRequestManager: React.FC = () => {
  const currentUser = auth.getCurrentUser();
  const adminId = currentUser?._id as Id<"users"> | undefined;

  const [selectedQueue, setSelectedQueue] = useState<Id<"queues"> | null>(null);
  const [planModal, setPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", price: 0, description: "" });

  const interestQueues = useQuery(api.queues.getQueueRequests) || [];
  const officialQueues = useQuery(api.queues.getOfficialQueues) || [];
  const queuePlans = useQuery(api.queues.getQueuePlans, selectedQueue ? { queueId: selectedQueue } : "skip") || [];

  const convertToOfficial = useMutation(api.queues.convertToOfficialQueue);
  const addPlan = useMutation(api.queues.addQueuePlan);
  const removePlan = useMutation(api.queues.removeQueuePlan);

  const handleConvert = async (queueId: Id<"queues">) => {
    if (!adminId) { toast.error("Not authenticated"); return; }
    try {
      await convertToOfficial({ queueId, adminId });
      toast.success("Queue converted to official");
      setSelectedQueue(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to convert");
    }
  };

  const handleAddPlan = async (queueId: Id<"queues">) => {
    if (!adminId) { toast.error("Not authenticated"); return; }
    if (!planForm.name || planForm.price <= 0) {
      toast.error("Name and price required");
      return;
    }
    try {
      await addPlan({
        queueId,
        adminId,
        name: planForm.name,
        price: planForm.price,
        description: planForm.description,
        max_members: 10,
      });
      toast.success("Plan added");
      setPlanForm({ name: "", price: 0, description: "" });
      setPlanModal(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add plan");
    }
  };

  const handleRemovePlan = async (planId: Id<"queue_plans">) => {
    if (!adminId) { toast.error("Not authenticated"); return; }
    try {
      await removePlan({ planId, adminId });
      toast.success("Plan removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove plan");
    }
  };

  return (
    <div className="space-y-8">
      {/* Interest Queues */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2">
          <Clock size={20} className="text-amber-500" />
          Interest Queues ({interestQueues.length})
        </h2>
        {interestQueues.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-bold text-sm uppercase tracking-widest border border-dashed border-black/10 rounded-[2rem]">
            No interest queue requests
          </div>
        ) : (
          <div className="space-y-3">
            {interestQueues.map((q: any) => (
              <div key={q._id} className="flex items-center gap-4 bg-zinc-50 rounded-2xl p-5 hover:bg-zinc-100 transition-colors">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{q.service_name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={12} /> {q.total_interested || 0}/{q.max_members || "?"}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> ${q.total_cost || 0}</span>
                    {q.notes && <span className="flex items-center gap-1"><MessageSquare size={12} /> {q.notes}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedQueue === q._id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConvert(q._id)}
                        className="px-4 py-2.5 bg-emerald-500 text-white rounded-2xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Convert
                      </button>
                      <button
                        onClick={() => setSelectedQueue(null)}
                        className="px-4 py-2.5 bg-zinc-200 text-zinc-600 rounded-2xl font-bold text-xs hover:bg-zinc-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedQueue(q._id)}
                      className="px-4 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-xs hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                    >
                      <ArrowRight size={14} /> Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Queues */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2">
          <CheckCircle size={20} className="text-emerald-500" />
          Official Queues ({officialQueues.length})
        </h2>
        {officialQueues.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-bold text-sm uppercase tracking-widest border border-dashed border-black/10 rounded-[2rem]">
            No official queues yet
          </div>
        ) : (
          <div className="space-y-4">
            {officialQueues.map((q: any) => (
              <div key={q._id} className="bg-zinc-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">{q.service_name}</h3>
                      <p className="text-xs text-gray-500">
                        {q.total_interested || 0} members &middot; ${q.service_fee || 0} fee
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQueue(selectedQueue === q._id ? null : q._id)}
                    className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                      selectedQueue === q._id
                        ? "bg-zinc-200 text-zinc-600"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {selectedQueue === q._id ? "Close" : "Manage Plans"}
                  </button>
                </div>
                {selectedQueue === q._id && (
                  <div className="pl-15 border-t border-zinc-200 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Pricing Plans</h4>
                      <button
                        onClick={() => { setPlanModal(true); }}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 hover:bg-blue-600 transition-all"
                      >
                        <Plus size={12} /> Add Plan
                      </button>
                    </div>
                    {queuePlans.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">No plans yet</p>
                    ) : (
                      <div className="space-y-2">
                        {queuePlans.map((plan: any) => (
                          <div key={plan._id} className="flex items-center justify-between bg-white rounded-xl p-3">
                            <div>
                              <span className="font-bold text-sm">{plan.name}</span>
                              <span className="ml-3 text-emerald-600 font-black">${plan.price}</span>
                              {plan.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemovePlan(plan._id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Plan Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setPlanModal(false)}>
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-6">Add Pricing Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Plan Name</label>
                <input
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Basic, Premium"
                  className="w-full p-3.5 bg-zinc-50 rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Price ($)</label>
                <input
                  type="number"
                  value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full p-3.5 bg-zinc-50 rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description (optional)</label>
                <textarea
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="What's included in this plan?"
                  rows={3}
                  className="w-full p-3.5 bg-zinc-50 rounded-2xl font-bold outline-none focus:ring-2 ring-black/10 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPlanModal(false)}
                  className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedQueue && handleAddPlan(selectedQueue)}
                  className="flex-1 py-3.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all"
                >
                  Add Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
