import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Gift, Trophy, Users, BarChart3, Eye, Edit3, Trash2,
  CheckCircle2, XCircle, Send, Search, ChevronDown,
  Target, Activity, Link as LinkIcon, RefreshCw,
  Clock, Sparkles, Ban, Download
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";
import { CampaignImageUpload } from "./CampaignImageUpload";

type Tab = "campaigns" | "tracking" | "rewards" | "analytics";

export function ReferralCampaignsAdmin() {
  const [tab, setTab] = useState<Tab>("campaigns");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "campaigns", label: "Campaigns", icon: <Gift size={16} /> },
    { id: "tracking", label: "Tracking", icon: <Users size={16} /> },
    { id: "rewards", label: "Reward Management", icon: <Trophy size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  ];

  const user = auth.getCurrentUser();

  return (
    <div className="space-y-8">
      <SectionHeader title="Referral Campaigns" sub="Manage referral campaigns, track referrals, and manage rewards" />

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-black transition-colors ${
              tab === t.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "campaigns" && <CampaignList user={user} />}
      {tab === "tracking" && <ReferralTracking />}
      {tab === "rewards" && <RewardManagement />}
      {tab === "analytics" && <AnalyticsDashboard />}
    </div>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        {sub && <p className="text-sm font-medium text-zinc-500 mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function CampaignList({ user }: { user: any }) {
  const campaigns = useQuery(api.referrals.getReferralCampaigns) || [];
  const createCampaign = useMutation(api.referrals.createReferralCampaign);
  const updateCampaign = useMutation(api.referrals.updateReferralCampaign);
  const deleteCampaign = useMutation(api.referrals.deleteReferralCampaign);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<Id<"referral_campaigns"> | null>(null);

  const handleDelete = async (id: Id<"referral_campaigns">) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await deleteCampaign({ adminId: user!._id, campaignId: id });
      toast.success("Campaign deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Campaigns" sub={`${campaigns.length} total`}
        action={
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-2xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-colors">
            <Plus size={14} /> New Campaign
          </button>
        }
      />

      <div className="grid gap-4">
        {campaigns.length === 0 && (
          <div className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-12 text-center">
            <Gift size={40} className="mx-auto mb-3 text-zinc-300" />
            <p className="font-bold text-zinc-500">No campaigns yet. Create your first one!</p>
          </div>
        )}

        {campaigns.map(campaign => (
          <div key={campaign._id}
            className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
            {editId === campaign._id ? (
              <CampaignForm initial={campaign}
                onSave={async (data) => {
                  await updateCampaign({ adminId: user!._id, campaignId: campaign._id, ...data });
                  setEditId(null);
                  toast.success("Campaign updated");
                }}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  {campaign.banner_url ? (
                    <img src={campaign.banner_url} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center shrink-0">
                      <Gift size={24} className="text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg">{campaign.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        campaign.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${campaign.is_active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        {campaign.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{campaign.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs font-bold text-zinc-600">
                      <span className="flex items-center gap-1"><Trophy size={12} /> Reward: {campaign.reward_name}</span>
                      <span className="flex items-center gap-1"><Target size={12} /> Target: {campaign.target_referral_count} referrals</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(campaign.start_date).toLocaleDateString()} – {new Date(campaign.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditId(campaign._id)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(campaign._id)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-4">Create Campaign</h3>
            <CampaignForm onSave={async (data: any) => {
              await createCampaign({ adminId: user!._id, ...data });
              setShowCreate(false);
              toast.success("Campaign created");
            }} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignForm({ initial, onSave, onCancel }: {
  initial?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [bannerUrl, setBannerUrl] = useState(initial?.banner_url ?? "");
  const [targetSub, setTargetSub] = useState(initial?.target_subscription ?? "");
  const [targetCount, setTargetCount] = useState(initial?.target_referral_count ?? 5);
  const [rewardName, setRewardName] = useState(initial?.reward_name ?? "");
  const [rewardDesc, setRewardDesc] = useState(initial?.reward_description ?? "");
  const [rewardImage, setRewardImage] = useState(initial?.reward_image ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ? new Date(initial.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initial?.end_date ? new Date(initial.end_date).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const generateUploadUrl = useMutation(api.referrals.generateCampaignUploadUrl);
  const resolveUploadUrl = useMutation(api.referrals.resolveUploadUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !rewardName) { toast.error("Name, description, and reward name are required"); return; }
    setSaving(true);
    try {
      await onSave({
        name, description, banner_url: bannerUrl || undefined,
        target_subscription: targetSub || undefined,
        target_referral_count: targetCount, reward_name: rewardName,
        reward_description: rewardDesc || undefined, reward_image: rewardImage || undefined,
        start_date: new Date(startDate).getTime(), end_date: new Date(endDate).getTime(),
        is_active: isActive,
      });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Campaign Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q Summer Referral Challenge"
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the campaign..."
            className="mt-1 w-full min-h-[80px] p-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20 resize-none" />
        </div>
        <div className="sm:col-span-2">
          <CampaignImageUpload
            label="Banner Image"
            currentUrl={initial?.banner_url}
            onUpload={(url) => { setBannerUrl(url); setUploadingImage(false); }}
            onRemove={() => { setBannerUrl(""); }}
            onUploadStart={() => setUploadingImage(true)}
            generateUploadUrl={() => generateUploadUrl()}
            resolveUploadUrl={(args) => resolveUploadUrl(args)}
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reward Name *</label>
          <input value={rewardName} onChange={e => setRewardName(e.target.value)} placeholder="e.g. Free 1-month subscription"
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Referrals *</label>
          <input type="number" value={targetCount} onChange={e => setTargetCount(Number(e.target.value))} min={1}
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reward Description</label>
          <input value={rewardDesc} onChange={e => setRewardDesc(e.target.value)} placeholder="Describe the reward..."
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
        <div className="sm:col-span-2">
          <CampaignImageUpload
            label="Reward Image"
            currentUrl={initial?.reward_image}
            onUpload={(url) => { setRewardImage(url); setUploadingImage(false); }}
            onRemove={() => { setRewardImage(""); }}
            onUploadStart={() => setUploadingImage(true)}
            generateUploadUrl={() => generateUploadUrl()}
            resolveUploadUrl={(args) => resolveUploadUrl(args)}
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Subscription (optional)</label>
          <input value={targetSub} onChange={e => setTargetSub(e.target.value)} placeholder="e.g. Q Basic"
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-black/20" />
            <span className="text-xs font-black">Active on creation</span>
          </label>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="mt-1 w-full h-11 px-4 rounded-xl border border-black/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/20" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="h-10 px-5 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-black hover:bg-zinc-200 transition-colors">Cancel</button>
        <button type="submit" disabled={saving || uploadingImage}
          className="h-10 px-5 rounded-xl bg-zinc-900 text-white text-xs font-black hover:bg-zinc-800 transition-colors disabled:opacity-50">
          {uploadingImage ? "Uploading image..." : saving ? "Saving..." : initial ? "Update Campaign" : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}

function ReferralTracking() {
  const user = auth.getCurrentUser();
  const campaigns = useQuery(api.referrals.getReferralCampaigns) || [];
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const referrals = useQuery(api.referrals.adminGetAllReferrals,
    user ? { campaignId: selectedCampaign ? selectedCampaign as any : undefined, status: statusFilter || undefined } : "skip") || [];

  return (
    <div className="space-y-4">
      <SectionHeader title="Referral Tracking" sub={`${referrals.length} referrals found`} />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
            className="h-10 pl-4 pr-10 rounded-xl border border-black/10 text-xs font-bold bg-white appearance-none cursor-pointer">
            <option value="">All Campaigns</option>
            {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 pl-4 pr-10 rounded-xl border border-black/10 text-xs font-bold bg-white appearance-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <th className="px-5 py-4">Referrer</th>
                <th className="px-5 py-4">Referred User</th>
                <th className="px-5 py-4">Campaign</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Subscription</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-semibold">No referrals found.</td></tr>
              )}
              {referrals.map((r: any) => (
                <tr key={r._id} className="border-b border-black/5 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-zinc-800">{r.referrer_name}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{r.referred_user_name}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{r.campaign_name}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">{r.subscription_joined || "—"}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-[11px] whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-black/5">
          {referrals.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-zinc-400 font-semibold">No referrals found.</div>
          )}
          {referrals.map((r: any) => (
            <div key={r._id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800">{r.referrer_name}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-xs text-zinc-500">
                <div>Referred: {r.referred_user_name}</div>
                <div>Campaign: {r.campaign_name}</div>
                <div>Date: {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    pending_review: "bg-purple-100 text-purple-700",
    approved: "bg-blue-100 text-blue-700",
    delivered: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${styles[status] || "bg-zinc-100 text-zinc-600"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === "completed" || status === "delivered" ? "bg-emerald-500" :
        status === "pending" ? "bg-amber-500" :
        status === "rejected" ? "bg-red-500" :
        status === "pending_review" ? "bg-purple-500" :
        "bg-blue-500"
      }`} />
      {status.replace("_", " ")}
    </span>
  );
}

function RewardManagement() {
  const user = auth.getCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const rewards = useQuery(api.referrals.adminGetRewardManagement,
    user ? { status: statusFilter || undefined } : "skip") || [];
  const approveReward = useMutation(api.referrals.approveReward);
  const rejectReward = useMutation(api.referrals.rejectReward);
  const deliverReward = useMutation(api.referrals.deliverReward);

  const handleApprove = async (id: Id<"referral_rewards">) => {
    try { await approveReward({ adminId: user!._id, rewardId: id }); toast.success("Reward approved"); }
    catch { toast.error("Failed to approve"); }
  };

  const handleReject = async (id: Id<"referral_rewards">) => {
    const reason = prompt("Reason for rejection (optional):");
    try { await rejectReward({ adminId: user!._id, rewardId: id, note: reason || undefined }); toast.success("Reward rejected"); }
    catch { toast.error("Failed to reject"); }
  };

  const handleDeliver = async (id: Id<"referral_rewards">) => {
    try { await deliverReward({ adminId: user!._id, rewardId: id }); toast.success("Reward delivered"); }
    catch { toast.error("Failed to deliver"); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Reward Management" sub={`${rewards.length} rewards`} />

      <div className="relative w-full max-w-[200px]">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full h-10 pl-4 pr-10 rounded-xl border border-black/10 text-xs font-bold bg-white appearance-none cursor-pointer">
          <option value="">All Rewards</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
      </div>

      <div className="grid gap-4">
        {rewards.length === 0 && (
          <div className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-12 text-center">
            <Trophy size={40} className="mx-auto mb-3 text-zinc-300" />
            <p className="font-bold text-zinc-500">No rewards to manage yet.</p>
          </div>
        )}

        {rewards.map((r: any) => (
          <div key={r._id}
            className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-black">{r.user_name}</h3>
                  <span className="text-xs text-zinc-400">({r.user_email})</span>
                </div>
                <p className="text-sm font-bold text-zinc-700">{r.reward_name}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-zinc-500">
                  <span>Campaign: {r.campaign_name}</span>
                  <span>Referrals: {r.referral_count}</span>
                  {r.awarded_at && <span>Earned: {new Date(r.awarded_at).toLocaleDateString()}</span>}
                  {r.delivered_at && <span>Delivered: {new Date(r.delivered_at).toLocaleDateString()}</span>}
                </div>
                <div className="mt-2"><StatusBadge status={r.status} /></div>
                {r.admin_note && <p className="text-xs text-zinc-400 mt-2 italic">Note: {r.admin_note}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === "pending_review" && (
                  <>
                    <button onClick={() => handleApprove(r._id)}
                      className="inline-flex items-center gap-1 h-9 px-4 rounded-xl bg-emerald-100 text-emerald-700 text-[10px] font-black hover:bg-emerald-200 transition-colors">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button onClick={() => handleReject(r._id)}
                      className="inline-flex items-center gap-1 h-9 px-4 rounded-xl bg-red-100 text-red-700 text-[10px] font-black hover:bg-red-200 transition-colors">
                      <XCircle size={12} /> Reject
                    </button>
                  </>
                )}
                {r.status === "approved" && (
                  <button onClick={() => handleDeliver(r._id)}
                    className="inline-flex items-center gap-1 h-9 px-4 rounded-xl bg-blue-100 text-blue-700 text-[10px] font-black hover:bg-blue-200 transition-colors">
                    <Send size={12} /> Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsDashboard() {
  const analytics = useQuery(api.referrals.getReferralAnalytics);

  if (!analytics) {
    return <div className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-12 text-center"><p className="font-bold text-zinc-500">Loading analytics...</p></div>;
  }

  const cards = [
    { label: "Total Participants", value: analytics.totalParticipants, icon: <Users size={20} />, color: "bg-blue-500" },
    { label: "Links Shared", value: analytics.totalLinksShared, icon: <LinkIcon size={20} />, color: "bg-purple-500" },
    { label: "Successful Referrals", value: analytics.successfulReferrals, icon: <CheckCircle2 size={20} />, color: "bg-emerald-500" },
    { label: "Conversion Rate", value: `${analytics.conversionRate}%`, icon: <Activity size={20} />, color: "bg-amber-500" },
    { label: "Reward Claims", value: analytics.rewardClaims, icon: <Trophy size={20} />, color: "bg-rose-500" },
    { label: "Top Campaign", value: analytics.mostSuccessfulCampaign, icon: <Sparkles size={20} />, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" sub="Referral campaign performance overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i}
            className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-black">{card.value}</div>
            <div className="text-xs font-bold text-zinc-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
        <h3 className="font-black text-sm mb-4">Referrals by Status</h3>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(analytics.referralsByStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3 bg-zinc-50 rounded-2xl px-4 py-3">
              <StatusBadge status={status} />
              <span className="text-lg font-black">{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      {analytics.topReferrers.length > 0 && (
        <div className="rounded-[2rem] border border-black/5 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
          <h3 className="font-black text-sm mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {analytics.topReferrers.map((ref: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-black text-zinc-400">#{i + 1}</span>
                  <span className="font-bold text-zinc-800">{ref.full_name}</span>
                </div>
                <span className="font-black text-zinc-600">{ref.count} referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
