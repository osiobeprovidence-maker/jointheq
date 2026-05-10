import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import { X, CheckCircle2, Pause, Star, Trash, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminQuestsPage() {
  const user = auth.getCurrentUser();
  const quests = useQuery(api.quests.adminListAllQuests, { adminId: user?._id } as any) || [];
  const review = useMutation(api.quests.adminReviewQuest);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (questId: any, action: string) => {
    if (!user?._id) return;
    if (!confirm(`Confirm ${action} for this quest?`)) return;
    try {
      setProcessing(String(questId));
      await review({ adminId: user._id as any, questId, action });
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] p-6">
      <h1 className="text-2xl font-black mb-4">Admin — Quests</h1>
      <div className="grid gap-4">
        {quests.length === 0 ? <div className="text-sm text-zinc-500">No quests</div> : quests.map((q: any) => (
          <div key={q._id} className="bg-white rounded-2xl p-4 flex items-start gap-4 border border-black/5">
            <div className="w-40 h-24 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
              {q.coverImageUrl ? (
                <img src={q.coverImageUrl} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">No Image</div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-lg">{q.title}</h2>
                  <div className="text-xs text-zinc-500">By: {q.creator?.full_name || q.creator?.email || 'Unknown'} • {q.creator?._id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black">₦{q.rewardPerUser?.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400">Budget ₦{q.totalBudget?.toLocaleString()}</div>
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-700">{q.description}</p>

              <div className="mt-4 flex items-center gap-2">
                <button disabled={processing===String(q._id)} onClick={() => handleAction(q._id, 'approve')} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white font-bold">Approve</button>
                <button disabled={processing===String(q._id)} onClick={() => handleAction(q._id, 'reject')} className="px-3 py-2 rounded-2xl bg-red-50 text-red-600 font-bold">Reject</button>
                <button disabled={processing===String(q._id)} onClick={() => handleAction(q._id, 'pause')} className="px-3 py-2 rounded-2xl bg-white border border-black/5 font-bold">Pause</button>
                <button disabled={processing===String(q._id)} onClick={() => handleAction(q._id, 'feature')} className="px-3 py-2 rounded-2xl bg-yellow-50 text-yellow-700 font-bold">Feature</button>
                <div className="ml-auto text-xs text-zinc-400">Payment: {q.paymentStatus} • {q.paymentMethod} • {q.paymentReference || '-'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
