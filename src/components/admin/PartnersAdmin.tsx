import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, Edit2, Trash2, UserPlus, RefreshCw, User, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "../../lib/auth";

const PARTNER_TYPES = ["creator", "influencer", "affiliate", "brand", "ambassador"] as const;
const PAYMENT_SCHEDULES = ["weekly", "monthly", "quarterly"] as const;
const STATUS_OPTIONS = ["active", "pending", "suspended"] as const;

type PartnerConfig = {
  partnerType: string;
  commission: number;
  paymentSchedule: string;
  status: string;
  notes: string;
};

type SelectedUser = {
  _id: string;
  full_name: string;
  username?: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
};

const defaultConfig: PartnerConfig = {
  partnerType: "creator", commission: 10,
  paymentSchedule: "weekly", status: "active", notes: "",
};

export function PartnersAdmin() {
  const partners = useQuery(api.partners.listPartners);
  const createPartner = useMutation(api.partners.createPartner);
  const updatePartner = useMutation(api.partners.updatePartner);
  const deletePartner = useMutation(api.partners.deletePartner);

  const [tableSearch, setTableSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [config, setConfig] = useState<PartnerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.getCurrentUser();
  const adminId = currentUser?._id;
  const loading = partners === undefined;

  // Debounce search exactly like marketplace (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(userSearch), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [userSearch]);

  // Same search query that works in marketplace - no auth check
  const searchEnabled = debouncedSearch.trim().length >= 2 && !editingId;
  const searchResults = useQuery(
    api.adminEnhanced.searchAllUsers,
    searchEnabled ? { search: debouncedSearch.trim(), limit: 15 } : "skip"
  );

  // Show dropdown when results arrive
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && !selectedUser) {
      setDropdownOpen(true);
    }
  }, [searchResults, selectedUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = (partners || []).filter((p: any) =>
    p.fullName?.toLowerCase().includes(tableSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(tableSearch.toLowerCase()) ||
    p.referralCode?.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const resetForm = () => {
    setConfig(defaultConfig);
    setEditingId(null);
    setShowForm(false);
    setSelectedUser(null);
    setUserSearch("");
    setDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!editingId && !selectedUser) { toast.error("Please select a user"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updatePartner({
          adminId: adminId as any,
          partnerId: editingId as any,
          partnerType: config.partnerType,
          commissionPerQualified: config.commission,
          paymentSchedule: config.paymentSchedule,
          status: config.status,
          notes: config.notes || undefined,
        });
        toast.success("Partner updated");
      } else {
        await createPartner({
          adminId: adminId as any,
          userId: selectedUser!._id as any,
          partnerType: config.partnerType,
          commissionPerQualified: config.commission,
          paymentSchedule: config.paymentSchedule,
          status: config.status,
          notes: config.notes || undefined,
        });
        toast.success("Partner created");
      }
      resetForm();
    } catch (e: any) { toast.error(e.message || "Failed to save partner"); }
    setSaving(false);
  };

  const handleEdit = (p: any) => {
    setConfig({
      partnerType: p.partnerType || "creator",
      commission: p.commissionPerQualified || 10,
      paymentSchedule: p.paymentSchedule || "weekly",
      status: p.status || "active",
      notes: p.notes || "",
    });
    if (p.userId) {
      setSelectedUser({
        _id: p.userId,
        full_name: p.fullName || "",
        username: p.username,
        email: p.email || "",
        phone: p.phone,
        profile_image_url: p.profileImageUrl,
      });
    } else {
      setSelectedUser({
        _id: "",
        full_name: p.fullName || "",
        username: p.username,
        email: p.email || "",
        phone: p.phone,
        profile_image_url: p.profileImageUrl,
      });
    }
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;
    try { await deletePartner({ adminId: adminId as any, partnerId: id as any }); toast.success("Partner deleted"); }
    catch (e: any) { toast.error(e.message || "Failed to delete"); }
  };

  const searching = searchResults === undefined && searchEnabled;

  const selectUser = (u: SelectedUser) => {
    setSelectedUser(u);
    setUserSearch(u.full_name);
    setDropdownOpen(false);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      suspended: "bg-red-50 text-red-700 border-red-200"
    };
    return (
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${colors[status] || "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>
        {status}
      </span>
    );
  };

  const partnerTypeLabel = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 rounded-lg bg-zinc-200 animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-zinc-100 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-zinc-200 animate-pulse" />
        </div>
        <div className="h-11 rounded-xl bg-zinc-100 animate-pulse" />
        <div className="rounded-2xl border border-black/5 overflow-hidden">
          <div className="space-y-0">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 border-b border-black/5 p-4">
                <div className="h-8 w-8 rounded-full bg-zinc-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-zinc-200 animate-pulse" />
                  <div className="h-3 w-48 rounded bg-zinc-100 animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded-full bg-zinc-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900">Partner Management</h2>
          <p className="mt-1 text-xs sm:text-sm font-bold text-gray-500">Assign partnership roles to existing users</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95"
        >
          <UserPlus size={16} />
          {showForm ? "Cancel" : "Add Partner"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-black text-zinc-900">
            {editingId ? "Edit Partner" : "Assign Partnership"}
          </h3>

          {/* User search / selected user */}
          {!editingId ? (
            <div ref={dropdownRef} className="relative mb-5">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Search Existing User</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={userSearch} onChange={e => { setUserSearch(e.target.value); if (selectedUser) setSelectedUser(null); }}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 pl-10 text-sm font-semibold text-zinc-900 outline-none placeholder:text-gray-300 focus:border-zinc-900"
                  placeholder="Search by name, username, email or phone..." />
                {searching && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
              </div>

              {/* Dropdown */}
              {dropdownOpen && searchResults && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-black/10 bg-white shadow-xl max-h-[350px] overflow-y-auto">
                  {searchResults.map((u: any) => (
                    <button key={u._id} onClick={() => selectUser({ _id: u._id, full_name: u.full_name, username: u.username, email: u.email, phone: u.phone, profile_image_url: u.image })}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 border-b border-black/5 last:border-0 ${selectedUser?._id === u._id ? "bg-zinc-50" : ""}`}>
                      {u.image ? (
                        <img src={u.image} className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-100 flex-shrink-0" alt="" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500 ring-2 ring-zinc-50 flex-shrink-0">
                          {u.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-900 truncate">{u.full_name}</div>
                        {u.username && <div className="text-xs font-semibold text-gray-400">@{u.username}</div>}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span>{u.email}</span>
                          {u.phone && <span>{u.phone}</span>}
                        </div>
                      </div>
                      {selectedUser?._id === u._id && <Check size={16} className="text-emerald-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {dropdownOpen && searchResults && searchResults.length === 0 && !searching && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-black/10 bg-white shadow-xl p-6 text-center">
                  <AlertCircle size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-gray-500">No registered user found</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try a different search term</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Selected user card */}
          {selectedUser && (
            <div className="mb-5 rounded-xl border border-black/5 bg-zinc-50 p-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400">
                {editingId ? "Partner User" : "Selected User"}
              </label>
              <div className="flex items-center gap-4">
                {selectedUser.profile_image_url ? (
                  <img src={selectedUser.profile_image_url} className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-200" alt="" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-lg font-black text-zinc-500 ring-2 ring-zinc-100">
                    {selectedUser.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-zinc-900">{selectedUser.full_name}</div>
                  {selectedUser.username && <div className="text-sm font-semibold text-gray-400">@{selectedUser.username}</div>}
                  <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-0.5">
                    <span>{selectedUser.email}</span>
                    {selectedUser.phone && <span>{selectedUser.phone}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Partner config fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Partner Type</label>
              <select value={config.partnerType} onChange={e => setConfig(f => ({ ...f, partnerType: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900">
                {PARTNER_TYPES.map(t => <option key={t} value={t}>{partnerTypeLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Commission (%)</label>
              <input type="number" value={config.commission} onChange={e => setConfig(f => ({ ...f, commission: Number(e.target.value) }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900" min={0} max={100} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Payment Schedule</label>
              <select value={config.paymentSchedule} onChange={e => setConfig(f => ({ ...f, paymentSchedule: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900">
                {PAYMENT_SCHEDULES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Status</label>
              <select value={config.status} onChange={e => setConfig(f => ({ ...f, status: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Internal Notes</label>
              <textarea value={config.notes} onChange={e => setConfig(f => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none placeholder:text-gray-300 focus:border-zinc-900" rows={2} placeholder="Optional notes..." />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={handleSubmit} disabled={saving || (!editingId && !selectedUser)}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 disabled:hover:scale-100">
              {saving && <RefreshCw size={14} className="animate-spin" />}
              {editingId ? "Update Partner" : "Create Partner"}
            </button>
            <button onClick={resetForm}
              className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-bold text-zinc-500 transition-colors hover:bg-zinc-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 pl-10 text-sm font-semibold text-zinc-900 outline-none placeholder:text-gray-300 focus:border-zinc-900 shadow-sm" placeholder="Search partners..." />
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3.5 sm:px-5">Name</th>
                <th className="px-4 py-3.5 sm:px-5">Email</th>
                <th className="px-4 py-3.5 sm:px-5 hidden sm:table-cell">Type</th>
                <th className="px-4 py-3.5 sm:px-5">Code</th>
                <th className="px-4 py-3.5 sm:px-5 hidden md:table-cell">Commission</th>
                <th className="px-4 py-3.5 sm:px-5 hidden md:table-cell">Schedule</th>
                <th className="px-4 py-3.5 sm:px-5">Status</th>
                <th className="px-4 py-3.5 sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                      <User size={40} className="text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-gray-500">
                        {tableSearch ? "No partners match your search" : "No partners yet"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {tableSearch ? "Try a different search term" : "Click 'Add Partner' to assign the first one"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((p: any) => (
                <tr key={p._id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      {p.profileImageUrl ? (
                        <img src={p.profileImageUrl} className="h-9 w-9 rounded-full object-cover ring-2 ring-zinc-100" alt="" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-500 ring-2 ring-zinc-50">
                          {p.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-zinc-900">{p.fullName}</div>
                        {p.username && <div className="text-xs font-semibold text-gray-400">@{p.username}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 sm:px-5 text-sm font-semibold text-gray-500">{p.email}</td>
                  <td className="px-4 py-3 sm:px-5 hidden sm:table-cell">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600">
                      {partnerTypeLabel(p.partnerType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-5 font-mono text-xs font-bold text-indigo-600">{p.referralCode}</td>
                  <td className="px-4 py-3 sm:px-5 hidden md:table-cell font-bold text-zinc-900">{p.commissionPerQualified}%</td>
                  <td className="px-4 py-3 sm:px-5 hidden md:table-cell text-sm font-semibold text-gray-500 capitalize">{p.paymentSchedule}</td>
                  <td className="px-4 py-3 sm:px-5">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(p)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        title="Edit partner">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p._id)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete partner">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
