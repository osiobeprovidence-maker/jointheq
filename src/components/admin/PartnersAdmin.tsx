import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, Edit2, Trash2, UserPlus, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const PARTNER_TYPES = ["creator", "influencer", "campus_ambassador", "brand_partner", "affiliate"] as const;
const PAYMENT_SCHEDULES = ["monthly", "bi_weekly", "weekly", "upon_referral"] as const;
const STATUS_OPTIONS = ["active", "inactive", "suspended"] as const;

type PartnerForm = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  profilePicture: string;
  partnerType: string;
  referralCode: string;
  commission: number;
  paymentSchedule: string;
  status: string;
  notes: string;
  password: string;
};

const emptyForm: PartnerForm = {
  fullName: "", username: "", email: "", phone: "", profilePicture: "",
  partnerType: "affiliate", referralCode: "", commission: 10,
  paymentSchedule: "monthly", status: "active", notes: "", password: "",
};

export function PartnersAdmin() {
  const partners = useQuery(api.partners.listPartners);
  const createPartner = useMutation(api.partners.createPartner);
  const updatePartner = useMutation(api.partners.updatePartner);
  const deletePartner = useMutation(api.partners.deletePartner);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (partners || []).filter((p: any) =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const handleSubmit = async () => {
    if (!form.fullName || !form.email) { toast.error("Name and email are required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        const { password, ...rest } = form;
        await updatePartner({ id: editingId, ...rest });
        toast.success("Partner updated");
      } else {
        if (!form.password) { toast.error("Password is required for new partners"); setSaving(false); return; }
        await createPartner(form);
        toast.success("Partner created");
      }
      resetForm();
    } catch (e: any) { toast.error(e.message || "Failed to save partner"); }
    setSaving(false);
  };

  const handleEdit = (p: any) => {
    setForm({
      fullName: p.fullName || "", username: p.username || "", email: p.email || "",
      phone: p.phone || "", profilePicture: p.profilePicture || "",
      partnerType: p.partnerType || "affiliate", referralCode: p.referralCode || "",
      commission: p.commission || 10, paymentSchedule: p.paymentSchedule || "monthly",
      status: p.status || "active", notes: p.notes || "", password: "",
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;
    try { await deletePartner({ id }); toast.success("Partner deleted"); }
    catch (e: any) { toast.error(e.message || "Failed to delete"); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { active: "bg-green-500/20 text-green-300", inactive: "bg-yellow-500/20 text-yellow-300", suspended: "bg-red-500/20 text-red-300" };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-white/10 text-white/60"}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Partner Management</h2>
          <p className="mt-1 text-sm text-white/60">Manage creators, influencers, affiliates, and brand partners</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <UserPlus size={16} /> {showForm ? "Cancel" : "Add Partner"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-white">{editingId ? "Edit Partner" : "Create New Partner"}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-white/60">Full Name *</label>
              <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="johndoe" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="john@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="+1234567890" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Profile Picture URL</label>
              <input value={form.profilePicture} onChange={e => setForm(f => ({ ...f, profilePicture: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="https://..." />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Partner Type</label>
              <select value={form.partnerType} onChange={e => setForm(f => ({ ...f, partnerType: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                {PARTNER_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Referral Code</label>
              <input value={form.referralCode} onChange={e => setForm(f => ({ ...f, referralCode: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="AUTO" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Commission (%)</label>
              <input type="number" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" min={0} max={100} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Payment Schedule</label>
              <select value={form.paymentSchedule} onChange={e => setForm(f => ({ ...f, paymentSchedule: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                {PAYMENT_SCHEDULES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">{editingId ? "New Password (leave blank to keep)" : "Password *"}</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="Min 6 characters" />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs text-white/60">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" rows={2} placeholder="Internal notes..." />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
              {saving && <RefreshCw size={14} className="animate-spin" />}
              {editingId ? "Update Partner" : "Create Partner"}
            </button>
            <button onClick={resetForm} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500" placeholder="Search partners..." />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-white/40">No partners found</td></tr>
            )}
            {filtered.map((p: any) => (
              <tr key={p._id} className="text-white/80 transition hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {p.profilePicture ? <img src={p.profilePicture} className="h-8 w-8 rounded-full object-cover" alt="" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">{p.fullName?.charAt(0)?.toUpperCase()}</div>}
                    <div>
                      <div className="font-medium text-white">{p.fullName}</div>
                      {p.username && <div className="text-xs text-white/40">@{p.username}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/60">{p.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">{p.partnerType?.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-indigo-400">{p.referralCode}</td>
                <td className="px-4 py-3">{p.commission}%</td>
                <td className="px-4 py-3 text-xs capitalize text-white/60">{p.paymentSchedule?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(p)} className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p._id)} className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-500/20 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
