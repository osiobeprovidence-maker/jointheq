import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  Edit3,
  EllipsisVertical,
  Eye,
  Filter,
  PauseCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { auth } from "../lib/auth";
import { fmtCurrency } from "../lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "../components/admin/AdminShell";

type ManagerStatus = "Active" | "Almost Full" | "Full";

type SlotRecord = {
  slot_id: Id<"subscription_slots">;
  slot_number: number;
  slot_name: string;
  slot_price: number;
  user_id?: Id<"users">;
  user_name?: string;
  user_email?: string;
  user_status: string;
  payment_status: string;
  status: string;
  renewal_date?: string;
};

type SubscriptionRecord = {
  _id: Id<"marketplace">;
  service_name: string;
  plan_type: string;
  monthly_price: number;
  price_per_user: number;
  owner_email: string;
  owner_name: string;
  total_slots: number;
  used_slots: number;
  available_slots: number;
  renewal_date?: string;
  status: string;
  listing_status?: string;
  category: string;
  account_email: string;
  slots: SlotRecord[];
};

type SortColumn = "service_name" | "owner_email" | "monthly_price" | "price_per_user" | "total_slots" | "renewal_date" | "status";
type SortDirection = "asc" | "desc";

const statusStyles: Record<ManagerStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Almost Full": "bg-orange-50 text-orange-700 border-orange-100",
  Full: "bg-red-50 text-red-700 border-red-100",
};

function getManagerStatus(subscription: SubscriptionRecord): ManagerStatus {
  if (subscription.status === "Full" || subscription.status === "Almost Full" || subscription.status === "Active") return subscription.status as ManagerStatus;
  if (subscription.available_slots <= 0) return "Full";
  if (subscription.available_slots === 1) return "Almost Full";
  return "Active";
}

function getHealthColor(subscription: SubscriptionRecord): "emerald" | "amber" | "red" {
  const pct = subscription.total_slots > 0 ? subscription.used_slots / subscription.total_slots : 0;
  if (pct >= 1) return "red";
  if (pct > 0.5) return "amber";
  return "emerald";
}

function getRenewalCountdown(date?: string): { label: string; urgent: boolean } {
  if (!date) return { label: "No date", urgent: false };
  const ms = Date.parse(date);
  if (!Number.isFinite(ms)) return { label: "Invalid", urgent: false };
  const diff = new Date(ms).getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, urgent: true };
  if (days === 0) return { label: "Due today", urgent: true };
  return { label: `Renews in ${days}d`, urgent: days <= 7 };
}

function formatDate(date?: string) {
  if (!date) return "Not set";
  const ms = Date.parse(date);
  if (!Number.isFinite(ms)) return date;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(ms));
}

function toDateInputValue(date?: string) {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const ms = Date.parse(date);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

function StatusPill({ status }: { status: ManagerStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function HealthDot({ health }: { health: "emerald" | "amber" | "red" }) {
  const colors = { emerald: "fill-emerald-500 text-emerald-500", amber: "fill-amber-500 text-amber-500", red: "fill-red-500 text-red-500" };
  return <Circle size={8} className={colors[health]} />;
}

function KpiCard({ label, value, icon, trend }: { label: string; value: ReactNode; icon: ReactNode; trend?: { dir: "up" | "down"; text: string } }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
        <div className="text-violet-500">{icon}</div>
      </div>
      <p className="mt-1 text-lg font-black text-zinc-950">{value}</p>
      {trend && (
        <p className={`mt-0.5 text-[10px] font-bold ${trend.dir === "up" ? "text-emerald-600" : "text-red-500"}`}>{trend.text}</p>
      )}
    </div>
  );
}

function AssignUserModal({
  subscription,
  slot,
  users,
  currentAdminId,
  onClose,
}: {
  subscription: SubscriptionRecord;
  slot: SlotRecord | null;
  users: any[];
  currentAdminId?: Id<"users">;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const assignUser = useMutation(api.adminEnhanced.adminAssignUserToExactSlot);
  const removeUser = useMutation(api.adminEnhanced.adminRemoveUserFromSlot);
  const isFull = !slot || subscription.available_slots <= 0 && !slot.user_id;
  const filteredUsers = users
    .filter((user) => !user.is_admin)
    .filter((user) => {
      const text = `${user.full_name || ""} ${user.email || ""} ${user.username || ""}`.toLowerCase();
      return text.includes(query.trim().toLowerCase());
    })
    .slice(0, 8);

  const confirmAssignment = async () => {
    if (!currentAdminId || !slot || !selectedUserId) return;
    try {
      if (slot.user_id) {
        await removeUser({
          adminId: currentAdminId,
          slotId: slot.slot_id,
          reason: "Replacing user via Subscription Manager",
        });
      }
      await assignUser({
        adminId: currentAdminId,
        userId: selectedUserId,
        slotId: slot.slot_id,
        reason: slot.user_id ? "User replaced via Subscription Manager" : "User assigned via Subscription Manager",
      });
      toast.success(slot.user_id ? "User replaced successfully" : "User assigned successfully");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign user");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5">
          <div>
            <h2 className="text-lg font-black text-zinc-950">{slot?.user_id ? "Replace User" : "Assign User"}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">{subscription.service_name} - {subscription.plan_type}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 p-5">
          <KpiCard label="Monthly" value={fmtCurrency(subscription.monthly_price)} icon={<Wallet size={14} />} />
          <KpiCard label="Per user" value={fmtCurrency(subscription.price_per_user)} icon={<Users size={14} />} />
          <KpiCard label="Slot" value={slot ? `#${slot.slot_number}` : "Full"} icon={<ShieldCheck size={14} />} />
          <KpiCard label="Renews" value={formatDate(subscription.renewal_date)} icon={<Calendar size={14} />} />
        </div>

        <div className="px-5 pb-5">
          {isFull ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              This subscription is full. Remove or replace an existing user before assigning someone new.
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search users by name, email, or username..."
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </div>
              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUserId(user._id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      selectedUserId === user._id ? "border-violet-300 bg-violet-50" : "border-zinc-100 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-zinc-950">{user.full_name || user.username || "Unnamed"}</p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-zinc-500">{user.email}</p>
                    </div>
                    {selectedUserId === user._id && <CheckCircle2 size={16} className="shrink-0 text-violet-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 p-5">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-black text-zinc-500 hover:bg-zinc-100">
            Cancel
          </button>
          <button
            onClick={confirmAssignment}
            disabled={isFull || !selectedUserId}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionManagerPage() {
  const navigate = useNavigate();
  const currentUser = auth.getCurrentUser();
  const rawSubscriptions = (useQuery(api.subscriptions.getSubscriptionManagerData) || []) as SubscriptionRecord[];
  const users = useQuery(api.admin.getAllUsers) || [];
  const activityLogs = useQuery(api.adminEnhanced.getAdminLogs, { limit: 8 }) || [];
  const removeUser = useMutation(api.adminEnhanced.adminRemoveUserFromSlot);
  const updateSlotRenewalDate = useMutation(api.subscriptions.adminUpdateSlotRenewalDate);
  const renewSlot = useMutation(api.subscriptions.renewSlot);

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignSlot, setAssignSlot] = useState<SlotRecord | null>(null);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [savingDateFor, setSavingDateFor] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("service_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"marketplace">>>(new Set());
  const pageSize = 10;

  const services = useMemo(() => ["All", ...Array.from(new Set(rawSubscriptions.map((item) => item.service_name))).sort()], [rawSubscriptions]);

  const subscriptions = useMemo(
    () => rawSubscriptions.map((sub) => ({ ...sub, manager_status: getManagerStatus(sub) })),
    [rawSubscriptions],
  );

  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions.filter((sub) => {
      const matchesSearch = `${sub.service_name} ${sub.plan_type} ${sub.owner_email} ${sub.account_email}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesService = serviceFilter === "All" || sub.service_name === serviceFilter;
      const matchesStatus = statusFilter === "All" || sub.manager_status === statusFilter;
      return matchesSearch && matchesService && matchesStatus;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "service_name") cmp = a.service_name.localeCompare(b.service_name);
      else if (sortColumn === "owner_email") cmp = a.owner_email.localeCompare(b.owner_email);
      else if (sortColumn === "monthly_price") cmp = a.monthly_price - b.monthly_price;
      else if (sortColumn === "price_per_user") cmp = a.price_per_user - b.price_per_user;
      else if (sortColumn === "total_slots") cmp = a.used_slots / Math.max(a.total_slots, 1) - b.used_slots / Math.max(b.total_slots, 1);
      else if (sortColumn === "renewal_date") cmp = (a.renewal_date || "").localeCompare(b.renewal_date || "");
      else if (sortColumn === "status") cmp = a.manager_status.localeCompare(b.manager_status);
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [subscriptions, search, serviceFilter, statusFilter, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSubscriptions = filteredSubscriptions.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedSubscription = useMemo(() => {
    return subscriptions.find((item) => item._id === selectedId) || null;
  }, [subscriptions, selectedId]);

  const totals = useMemo(() => {
    const totalSlots = rawSubscriptions.reduce((sum, item) => sum + item.total_slots, 0);
    const usedSlots = rawSubscriptions.reduce((sum, item) => sum + item.used_slots, 0);
    const activeSlots = rawSubscriptions.filter((s) => s.available_slots > 0);
    const monthlyRevenue = rawSubscriptions.reduce((sum, s) => sum + s.monthly_price, 0);
    const activeUsers = rawSubscriptions.reduce((sum, s) => sum + s.used_slots, 0);
    const prices = rawSubscriptions.map(s => s.price_per_user).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    return {
      totalSubscriptions: rawSubscriptions.length,
      totalSlots,
      usedSlots,
      availableSlots: Math.max(0, totalSlots - usedSlots),
      monthlyRevenue,
      activeUsers,
      avgPricePerSlot: avgPrice,
    };
  }, [rawSubscriptions]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const toggleBulkSelect = (id: Id<"marketplace">) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSubscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSubscriptions.map(s => s._id)));
    }
  };

  const handleRemove = async (slot: SlotRecord) => {
    if (!currentUser?._id || !slot.user_id) return;
    if (!window.confirm("Remove this user from the subscription slot?")) return;
    try {
      await removeUser({
        adminId: currentUser._id as Id<"users">,
        slotId: slot.slot_id,
        reason: "Removed via Subscription Manager",
      });
      toast.success("User removed from slot");
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove user");
    }
  };

  const handleSlotRenewalDateSave = async (slot: SlotRecord) => {
    const draft = dateDrafts[slot.slot_id] ?? toDateInputValue(slot.renewal_date);
    if (!currentUser?._id || !draft) return;
    try {
      setSavingDateFor(slot.slot_id);
      await updateSlotRenewalDate({
        adminId: currentUser._id as Id<"users">,
        slotId: slot.slot_id,
        renewalDate: draft,
      });
      setDateDrafts((current) => { const next = { ...current }; delete next[slot.slot_id]; return next; });
      toast.success("User renewal date updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user renewal date");
    } finally {
      setSavingDateFor(null);
    }
  };

  const handleRenewSlot = async (slotId: Id<"subscription_slots">) => {
    if (!window.confirm("Renew this slot now? This will charge the user's wallet.")) return;
    try {
      await renewSlot({ id: slotId });
      toast.success("Slot renewed successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to renew slot");
    }
  };

  const SortHeader = ({ column, children, className }: { column: SortColumn; children: ReactNode; className?: string }) => (
    <button onClick={() => handleSort(column)} className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 ${className || ""}`}>
      {children}
      <ArrowUpDown size={12} className={`transition-opacity ${sortColumn === column ? "opacity-100" : "opacity-30"}`} />
    </button>
  );

  const selectedSubscriptionHealth = selectedSubscription ? getHealthColor(selectedSubscription) : "emerald";
  const selectedCountdown = selectedSubscription ? getRenewalCountdown(selectedSubscription.renewal_date) : { label: "", urgent: false };

  return (
    <AdminShell activeItem="subscription_manager" currentUser={currentUser} title="Subscription Manager" subtitle="Slot Assignments">
      <div className="space-y-5">
        {/* Compact Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <button onClick={() => navigate("/admin")} className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-wider">
              <ArrowLeft size={12} /> Back to admin
            </button>
            <h1 className="text-xl font-black tracking-tight text-zinc-950">Subscription Manager</h1>
            <p className="mt-0.5 text-sm font-semibold text-zinc-500">Manage subscriptions, pricing, slots and assignments.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-violet-700 transition">
              <Plus size={14} /> Add Subscription
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50 transition">
              <Upload size={14} /> Import
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50 transition">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* KPI Row - compact */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <KpiCard label="Total Subscriptions" value={totals.totalSubscriptions} icon={<ShieldCheck size={14} />} />
          <KpiCard label="Total Slots" value={totals.totalSlots} icon={<Users size={14} />} />
          <KpiCard label="Used Slots" value={totals.usedSlots} icon={<CheckCircle2 size={14} />} />
          <KpiCard label="Available Slots" value={totals.availableSlots} icon={<AlertCircle size={14} />} />
        </div>

        {/* 70/30 Layout */}
        <div className="flex flex-col gap-5 xl:flex-row">
          {/* LEFT - Subscription Table (70%) */}
          <div className="min-w-0 flex-1 xl:w-[70%]">
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5">
                <p className="text-xs font-bold text-violet-700">{selectedIds.size} selected</p>
                <div className="flex items-center gap-2">
                  <button className="rounded-md bg-white px-3 py-1.5 text-[10px] font-black text-zinc-600 shadow-sm border border-zinc-200 hover:bg-zinc-100">Renew All</button>
                  <button onClick={() => setSelectedIds(new Set())} className="rounded-md bg-white px-3 py-1.5 text-[10px] font-black text-zinc-600 shadow-sm border border-zinc-200 hover:bg-zinc-100">Clear</button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              {/* Table toolbar */}
              <div className="border-b border-zinc-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      placeholder="Search subscriptions..."
                      className="w-full rounded-md border border-zinc-200 py-2 pl-8 pr-3 text-xs font-semibold outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                  <div className="relative">
                    <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }} className="appearance-none rounded-md border border-zinc-200 bg-white py-2 pl-8 pr-7 text-xs font-black outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                      {services.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-xs font-black outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                    {["All", "Active", "Almost Full", "Full"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === paginatedSubscriptions.length && paginatedSubscriptions.length > 0}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                        />
                      </th>
                      <th className="px-3 py-2.5"><SortHeader column="service_name">Subscription</SortHeader></th>
                      <th className="px-3 py-2.5"><SortHeader column="owner_email">Owner</SortHeader></th>
                      <th className="px-3 py-2.5 text-right"><SortHeader column="monthly_price">Monthly</SortHeader></th>
                      <th className="px-3 py-2.5 text-right"><SortHeader column="price_per_user">Per User</SortHeader></th>
                      <th className="px-3 py-2.5 text-right"><SortHeader column="total_slots">Slots</SortHeader></th>
                      <th className="px-3 py-2.5"><SortHeader column="renewal_date">Renewal</SortHeader></th>
                      <th className="px-3 py-2.5"><SortHeader column="status">Status</SortHeader></th>
                      <th className="w-12 px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {paginatedSubscriptions.map((sub) => {
                      const health = getHealthColor(sub);
                      const countdown = getRenewalCountdown(sub.renewal_date);
                      const pct = sub.total_slots > 0 ? Math.round((sub.used_slots / sub.total_slots) * 100) : 0;
                      return (
                        <tr
                          key={sub._id}
                          onClick={() => { setSelectedId(sub._id); setSelectedIds(prev => { const n = new Set(prev); n.add(sub._id); return n; }); }}
                          className={`cursor-pointer transition text-[13px] ${selectedId === sub._id ? "bg-violet-50/60" : "hover:bg-zinc-50"}`}
                        >
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(sub._id)}
                              onChange={() => toggleBulkSelect(sub._id)}
                              className="h-3.5 w-3.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <HealthDot health={health} />
                              <div className="min-w-0">
                                <p className="truncate font-black text-zinc-950">{sub.service_name}</p>
                                <p className="truncate text-[11px] font-semibold text-zinc-400">{sub.plan_type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="truncate font-semibold text-zinc-600 max-w-[140px]">{sub.owner_email}</p>
                          </td>
                          <td className="px-3 py-3 text-right font-black text-zinc-950">{fmtCurrency(sub.monthly_price)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-zinc-600">{fmtCurrency(sub.price_per_user)}</td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-black text-zinc-950">{sub.used_slots}</span>
                            <span className="text-zinc-400">/{sub.total_slots}</span>
                            <p className={`text-[10px] font-bold ${pct >= 100 ? "text-red-500" : pct > 50 ? "text-amber-500" : "text-emerald-500"}`}>
                              {pct}%
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="whitespace-nowrap text-xs font-semibold text-zinc-600">{formatDate(sub.renewal_date)}</p>
                            <p className={`text-[10px] font-bold ${countdown.urgent ? "text-red-500" : "text-zinc-400"}`}>{countdown.label}</p>
                          </td>
                          <td className="px-3 py-3">
                            <StatusPill status={sub.manager_status} />
                          </td>
                          <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block group">
                              <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">
                                <EllipsisVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-full z-10 mt-1 hidden w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg group-hover:block">
                                <button onClick={() => setSelectedId(sub._id)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700">
                                  <Eye size={14} /> View Details
                                </button>
                                <button className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700">
                                  <Edit3 size={14} /> Edit
                                </button>
                                <button className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700">
                                  <PauseCircle size={14} /> Pause
                                </button>
                                <hr className="my-1 border-zinc-100" />
                                <button onClick={() => sub.slots.filter(s => s.user_id).forEach(s => handleRenewSlot(s.slot_id))} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700">
                                  <RefreshCw size={14} /> Renew All
                                </button>
                                <button className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedSubscriptions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-10 text-center text-sm font-bold text-zinc-400">No subscriptions match your filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-zinc-400">
                  {filteredSubscriptions.length > 0
                    ? `Showing ${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, filteredSubscriptions.length)} of ${filteredSubscriptions.length}`
                    : "No results"}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-7 min-w-[28px] rounded-md text-[11px] font-bold transition ${
                          page === safePage ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Details Panel (30%) */}
          <div className="w-full xl:w-[30%] xl:min-w-[340px] xl:max-w-[420px] space-y-4">
            {selectedSubscription ? (
              <>
                {/* Detail Card */}
                <div className="rounded-xl border border-zinc-200 bg-white">
                  {/* Header */}
                  <div className="border-b border-zinc-100 px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <HealthDot health={selectedSubscriptionHealth} />
                          <h2 className="truncate text-base font-black text-zinc-950">{selectedSubscription.service_name}</h2>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-zinc-500">{selectedSubscription.plan_type}</p>
                      </div>
                      <StatusPill status={getManagerStatus(selectedSubscription)} />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-px bg-zinc-100">
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Monthly Price</p>
                      <p className="mt-0.5 text-sm font-black text-zinc-950">{fmtCurrency(selectedSubscription.monthly_price)}</p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Price/User</p>
                      <p className="mt-0.5 text-sm font-black text-zinc-950">{fmtCurrency(selectedSubscription.price_per_user)}</p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Available</p>
                      <p className="mt-0.5 text-sm font-black text-zinc-950">{selectedSubscription.available_slots}</p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Renewal</p>
                      <p className={`mt-0.5 text-sm font-black ${selectedCountdown.urgent ? "text-red-500" : "text-zinc-950"}`}>
                        {formatDate(selectedSubscription.renewal_date)}
                      </p>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="border-t border-zinc-100 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Owner</p>
                    <p className="mt-0.5 truncate text-sm font-black text-zinc-900">{selectedSubscription.owner_name}</p>
                    <p className="truncate text-xs font-semibold text-zinc-500">{selectedSubscription.owner_email}</p>
                  </div>

                  {/* Slot Utilization */}
                  <div className="border-t border-zinc-100 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Slot Utilization</p>
                      <p className="text-xs font-black text-zinc-700">{selectedSubscription.used_slots}/{selectedSubscription.total_slots}</p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedSubscription.available_slots <= 0
                            ? "bg-red-500"
                            : selectedSubscription.used_slots / Math.max(selectedSubscription.total_slots, 1) > 0.5
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${selectedSubscription.total_slots > 0 ? (selectedSubscription.used_slots / selectedSubscription.total_slots) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] font-bold text-zinc-400">
                        {selectedSubscription.total_slots > 0
                          ? Math.round((selectedSubscription.used_slots / selectedSubscription.total_slots) * 100)
                          : 0}% used
                      </p>
                      <p className={`text-[10px] font-bold ${selectedCountdown.urgent ? "text-red-500" : "text-zinc-400"}`}>
                        {selectedCountdown.label}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Users */}
                  <div className="border-t border-zinc-100 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Assigned Users</p>
                      <span className="text-[10px] font-bold text-zinc-400">{selectedSubscription.used_slots}</span>
                    </div>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {selectedSubscription.slots.filter(s => s.user_id).map((slot) => (
                        <div key={slot.slot_id} className="flex items-center justify-between rounded-md border border-zinc-100 px-2.5 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-zinc-900">{slot.user_name}</p>
                            <p className="truncate text-[10px] font-semibold text-zinc-400">{slot.user_email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${slot.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {slot.payment_status}
                            </span>
                            <button
                              onClick={() => setAssignSlot(slot)}
                              className="rounded p-1 text-zinc-400 hover:bg-violet-50 hover:text-violet-600"
                              title="Replace user"
                            >
                              <UserPlus size={12} />
                            </button>
                            <button
                              onClick={() => handleRemove(slot)}
                              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                              title="Remove user"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {selectedSubscription.slots.filter(s => !s.user_id).map((slot) => (
                        <div key={slot.slot_id} className="flex items-center justify-between rounded-md border border-dashed border-zinc-200 px-2.5 py-2">
                          <p className="text-xs font-semibold text-zinc-400">Slot {slot.slot_number} — Available</p>
                          <button onClick={() => setAssignSlot(slot)} className="rounded p-1 text-zinc-400 hover:bg-violet-50 hover:text-violet-600">
                            <UserPlus size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="sticky bottom-0 border-t border-zinc-100 bg-zinc-50 px-4 py-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">Quick Actions</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          const empty = selectedSubscription.slots.find(s => !s.user_id);
                          if (empty) setAssignSlot(empty);
                          else toast.error("No available slots");
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-violet-700 transition"
                      >
                        <UserPlus size={12} /> Assign
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition">
                        <RefreshCw size={12} /> Transfer
                      </button>
                      <button
                        onClick={() => {
                          const filledSlots = selectedSubscription.slots.filter(s => s.user_id);
                          filledSlots.forEach(s => handleRenewSlot(s.slot_id));
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"
                      >
                        <RefreshCw size={12} /> Renew
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition">
                        <PauseCircle size={12} /> Pause
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-50 transition">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Revenue Summary */}
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3">Revenue Summary</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-500">Monthly Revenue</p>
                      <p className="text-sm font-black text-emerald-600">{fmtCurrency(totals.monthlyRevenue)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-500">Total Active Users</p>
                      <p className="text-sm font-black text-zinc-950">{totals.activeUsers}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-500">Avg Price / Slot</p>
                      <p className="text-sm font-black text-zinc-950">{fmtCurrency(Math.round(totals.avgPricePerSlot))}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-violet-500" />
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Activity Log</p>
                  </div>
                  <div className="space-y-2">
                    {activityLogs.map((log: any) => (
                      <div key={log._id} className="rounded-lg border border-zinc-100 px-3 py-2">
                        <p className="text-xs font-black text-zinc-900">{log.action_type?.replaceAll("_", " ") || "Admin action"}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-zinc-500 line-clamp-1">{log.details || log.reason || "Subscription activity updated"}</p>
                        <p className="mt-1 text-[10px] font-bold text-zinc-300">{log.admin_name || "Admin"} — {new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {activityLogs.length === 0 && <p className="text-xs font-bold text-zinc-400">No recent activity.</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8">
                <div className="text-center">
                  <ShieldCheck size={32} className="mx-auto text-zinc-300" />
                  <p className="mt-3 text-sm font-black text-zinc-400">Select a subscription</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-300">Choose from the table to view details and manage slots.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSubscription && assignSlot && (
        <AssignUserModal
          subscription={selectedSubscription}
          slot={assignSlot}
          users={users}
          currentAdminId={currentUser?._id as Id<"users"> | undefined}
          onClose={() => setAssignSlot(null)}
        />
      )}
    </AdminShell>
  );
}
