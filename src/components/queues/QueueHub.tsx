
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Users, Plus, Share2, Loader2, CheckCircle,
  TrendingDown, ChevronRight, Clock, Zap, X, ArrowRight,
  Copy, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface QueueHubProps {
  userId: Id<"users">;
}

export default function QueueHub({ userId }: QueueHubProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Queries
  const interestQueues = useQuery(api.queues.getQueueRequests) || [];
  const officialQueues = useQuery(api.queues.getOfficialQueues) || [];
  const myRequests = useQuery(api.queues.getMyQueueRequests, { userId }) || [];
  const myQueues = useQuery(api.queues.getUserQueues, { userId }) || [];

  // Mutations
  const createRequest = useMutation(api.queues.createQueueRequest);
  const joinRequest = useMutation(api.queues.joinQueueRequest);
  const selectPlan = useMutation(api.queues.selectQueuePlan);

  // Form state
  const [form, setForm] = useState({ service_name: "", description: "", estimated_price: "", category: "streaming", notes: "" });
  const [creating, setCreating] = useState(false);

  const categories = ["all", "streaming", "software", "education", "gaming", "productivity", "other"];

  const filteredInterest = useMemo(() => {
    return interestQueues.filter((q: any) => {
      if (searchQ && !q.service_name.toLowerCase().includes(searchQ.toLowerCase()) && !q.description?.toLowerCase().includes(searchQ.toLowerCase())) return false;
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      return true;
    });
  }, [interestQueues, searchQ, categoryFilter]);

  const filteredOfficial = useMemo(() => {
    return officialQueues.filter((q: any) => {
      if (searchQ && !q.service_name.toLowerCase().includes(searchQ.toLowerCase())) return false;
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      return true;
    });
  }, [officialQueues, searchQ, categoryFilter]);

  const myJoinedIds = new Set(myQueues.map((mq: any) => mq._id));
  const myRequestIds = new Set(myRequests.map((mr: any) => mr._id));

  const handleCreate = async () => {
    if (!form.service_name.trim()) return toast.error("Enter a service name");
    setCreating(true);
    try {
      const result = await createRequest({
        userId,
        service_name: form.service_name.trim(),
        description: form.description.trim() || undefined,
        estimated_price: form.estimated_price ? Number(form.estimated_price) : undefined,
        category: form.category !== "all" ? form.category : undefined,
        notes: form.notes.trim() || undefined,
      });
      const link = `${window.location.origin}/queue/${result.slug}`;
      await navigator.clipboard.writeText(link);
      toast.success("Queue request created! Share link copied.");
      setShowCreate(false);
      setForm({ service_name: "", description: "", estimated_price: "", category: "streaming", notes: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (queueId: Id<"queues">) => {
    try {
      await joinRequest({ queueId, userId });
      toast.success("Joined the interest list!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSelectPlan = async (queueId: Id<"queues">, planId: Id<"queue_plans">) => {
    try {
      await selectPlan({ queueId, userId, planId });
      toast.success("Plan selected!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyShareLink = (slug: string) => {
    const link = `${window.location.origin}/queue/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Queues</h1>
          <p className="text-zinc-500 text-sm mt-1">Start or join a subscription group</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:scale-105 transition-transform"
        >
          <Plus size={16} /> Request Queue
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search queues..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">My Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRequests.map((req: any) => (
              <div key={req._id} className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900">{req.service_name}</h3>
                    <p className="text-xs text-zinc-400">{req.total_interested} interested</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase">
                    {req.stage}
                  </span>
                </div>
                {req.description && <p className="text-sm text-zinc-500 line-clamp-2">{req.description}</p>}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (req.total_interested / Math.max(req.max_members, 1)) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">{req.total_interested}/{req.max_members}</span>
                </div>
                <button
                  onClick={() => copyShareLink(`share-${req._id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <Copy size={12} /> Copy Share Link
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interest Queues (Open Requests) */}
      {filteredInterest.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Open Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInterest.map((q: any) => {
              const joined = myJoinedIds.has(q._id);
              const isMine = myRequestIds.has(q._id);
              return (
                <motion.div
                  key={q._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-zinc-900 truncate">{q.service_name}</h3>
                      <p className="text-xs text-zinc-400">by {q.creator_name}</p>
                    </div>
                    {q.estimated_price ? (
                      <span className="text-sm font-bold text-zinc-900">~₦{Number(q.estimated_price).toLocaleString()}</span>
                    ) : null}
                  </div>

                  {q.description && <p className="text-sm text-zinc-500 line-clamp-2">{q.description}</p>}

                  {/* Interest meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        <Users size={12} className="inline mr-1" />
                        {q.total_interested} interested
                      </span>
                      {q.total_interested >= 5 && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <TrendingDown size={12} /> Gaining traction
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (q.total_interested / 10) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {isMine ? (
                    <button
                      onClick={() => copyShareLink(`share-${q._id}`)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      <Share2 size={12} /> Share to invite others
                    </button>
                  ) : joined ? (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                      <CheckCircle size={14} /> Joined
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(q._id)}
                      className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
                    >
                      I'm Interested
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {filteredInterest.length === 0 && myRequests.length === 0 && (
        <div className="text-center py-16">
          <Zap size={40} className="mx-auto text-zinc-300 mb-4" />
          <h3 className="text-lg font-bold text-zinc-500">No queue requests yet</h3>
          <p className="text-sm text-zinc-400 mt-1">Be the first to request a subscription group</p>
        </div>
      )}

      {/* Official Queues */}
      {filteredOfficial.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Active Queues <span className="text-zinc-300 font-normal normal-case">({filteredOfficial.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficial.map((q: any) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900">{q.service_name}</h3>
                    <p className="text-xs text-zinc-400">{q.total_members} members</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase">
                    Live
                  </span>
                </div>

                {/* Plans */}
                <div className="space-y-2">
                  {q.plans?.map((plan: any) => {
                    const myQueue = myQueues.find((mq: any) => mq._id === q._id);
                    const myPlanId = myQueue?.membership?.plan_id;
                    const isSelected = myPlanId === plan._id;

                    return (
                      <div
                        key={plan._id}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-100 hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-sm text-zinc-900">{plan.name}</span>
                            <span className="text-xs text-zinc-400 ml-2">
                              ₦{plan.full_price?.toLocaleString()}/mo
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>

                        {/* Dynamic pricing */}
                        <div className="space-y-1.5 mb-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">
                              <Users size={11} className="inline mr-1" />
                              {plan.filled}/{plan.remaining + plan.filled}
                            </span>
                            {plan.current_price && (
                              <span className="font-bold text-emerald-600 flex items-center gap-1">
                                <TrendingDown size={12} />
                                ₦{plan.current_price?.toLocaleString()}/person
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full transition-all"
                              style={{ width: `${plan.progress_pct || 0}%` }}
                            />
                          </div>
                        </div>

                        {!isSelected && myJoinedIds.has(q._id) && (
                          <button
                            onClick={() => handleSelectPlan(q._id, plan._id)}
                            disabled={plan.filled >= plan.max_members}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              plan.filled >= plan.max_members
                                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            }`}
                          >
                            {plan.filled >= plan.max_members ? "Full" : "Select This Plan"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!myJoinedIds.has(q._id) && (
                  <button
                    onClick={() => handleJoin(q._id)}
                    className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Join Queue
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Create Request Modal ─── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black">Request a Queue</h2>
                  <p className="text-xs text-zinc-400 mt-1">Tell us what subscription you need</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Service Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Grok, Netflix, Spotify"
                    value={form.service_name}
                    onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Description</label>
                  <textarea
                    placeholder="What plan are you looking for?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Est. Price (₦)</label>
                    <input
                      type="number"
                      placeholder="15000"
                      value={form.estimated_price}
                      onChange={(e) => setForm({ ...form, estimated_price: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    >
                      <option value="streaming">Streaming</option>
                      <option value="software">Software</option>
                      <option value="education">Education</option>
                      <option value="gaming">Gaming</option>
                      <option value="productivity">Productivity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="Any details that help"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    Your request goes live immediately as an Interest Queue. Share the link to gather members. An admin will activate official plans once there's enough interest.
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.service_name.trim()}
                  className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {creating ? "Creating..." : "Create Queue Request"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
