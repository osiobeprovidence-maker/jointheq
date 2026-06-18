import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Ban,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  Edit3,
  EllipsisVertical,
  ExternalLink,
  Eye,
  Filter,
  Mail,
  PauseCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  User,
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

type UserAssignment = {
  subscription: SubscriptionRecord;
  slot: SlotRecord | null;
  role: "owner" | "member";
};

type UserWithAssignments = {
  _id: Id<"users">;
  full_name?: string;
  email?: string;
  username?: string;
  phone?: string;
  is_admin?: boolean;
  is_banned?: boolean;
  is_suspended?: boolean;
  role?: string;
  created_at?: number;
  activeSubscriptions: number;
  totalPayments: number;
  subscriptionCount: number;
  slotsOccupied: number;
  assignments: UserAssignment[];
};

type SortColumn = "service_name" | "owner_email" | "monthly_price" | "price_per_user" | "total_slots" | "renewal_date" | "status";
type UserSortColumn = "full_name" | "email" | "username" | "subscriptionCount" | "slotsOccupied" | "activeSubscriptions" | "created_at";
type SortDirection = "asc" | "desc";
type ActiveView = "subscriptions" | "users";

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

function formatUnixDate(ts?: number) {
  if (!ts) return "N/A";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(ts));
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

function KpiCard({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
        <div className="text-violet-500">{icon}</div>
      </div>
      <p className="mt-1 text-lg font-black text-zinc-950">{value}</p>
    </div>
  );
}

function UserStatusBadge({ user }: { user: { is_banned?: boolean; is_suspended?: boolean; is_admin?: boolean } }) {
  if (user.is_banned) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-600">Banned</span>;
  if (user.is_suspended) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">Suspended</span>;
  if (user.is_admin) return <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black text-violet-700">Admin</span>;
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">Active</span>;
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
        await removeUser({ adminId: currentAdminId, slotId: slot.slot_id, reason: "Replacing user via Subscription Manager" });
      }
      await assignUser({ adminId: currentAdminId, userId: selectedUserId, slotId: slot.slot_id, reason: slot.user_id ? "User replaced via Subscription Manager" : "User assigned via Subscription Manager" });
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
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-4 gap-3 p-5">
          <KpiCard label="Monthly" value={fmtCurrency(subscription.monthly_price)} icon={<Wallet size={14} />} />
          <KpiCard label="Per user" value={fmtCurrency(subscription.price_per_user)} icon={<Users size={14} />} />
          <KpiCard label="Slot" value={slot ? `#${slot.slot_number}` : "Full"} icon={<ShieldCheck size={14} />} />
          <KpiCard label="Renews" value={formatDate(subscription.renewal_date)} icon={<Calendar size={14} />} />
        </div>
        <div className="px-5 pb-5">
          {isFull ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">This subscription is full. Remove or replace an existing user before assigning someone new.</div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by name, email, or username..." className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" />
              </div>
              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button key={user._id} onClick={() => setSelectedUserId(user._id)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${selectedUserId === user._id ? "border-violet-300 bg-violet-50" : "border-zinc-100 hover:bg-zinc-50"}`}>
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
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-black text-zinc-500 hover:bg-zinc-100">Cancel</button>
          <button onClick={confirmAssignment} disabled={isFull || !selectedUserId} className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionManagerPage() {
  const navigate = useNavigate();
  const currentUser = auth.getCurrentUser();
  const rawSubscriptions = (useQuery(api.subscriptions.getSubscriptionManagerData) || []) as SubscriptionRecord[];
  const rawUsers = useQuery(api.admin.getAllUsers) || [];
  const activityLogs = useQuery(api.adminEnhanced.getAdminLogs, { limit: 8 }) || [];
  const removeUser = useMutation(api.adminEnhanced.adminRemoveUserFromSlot);
  const updateSlotRenewalDate = useMutation(api.subscriptions.adminUpdateSlotRenewalDate);
  const renewSlot = useMutation(api.subscriptions.renewSlot);
  const suspendUserMut = useMutation(api.admin.suspendUser);
  const unsuspendUserMut = useMutation(api.admin.unsuspendUser);
  const sendNotificationMut = useMutation(api.admin.adminSendNotification);

  const [activeView, setActiveView] = useState<ActiveView>("subscriptions");
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

  const [userSearch, setUserSearch] = useState("");
  const [userServiceFilter, setUserServiceFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState("All");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSortColumn, setUserSortColumn] = useState<UserSortColumn>("full_name");
  const [userSortDirection, setUserSortDirection] = useState<SortDirection>("asc");
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 10;

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

  const selectedSubscription = useMemo(() => subscriptions.find((item) => item._id === selectedId) || null, [subscriptions, selectedId]);

  const totals = useMemo(() => {
    const totalSlots = rawSubscriptions.reduce((sum, item) => sum + item.total_slots, 0);
    const usedSlots = rawSubscriptions.reduce((sum, item) => sum + item.used_slots, 0);
    const monthlyRevenue = rawSubscriptions.reduce((sum, s) => sum + s.monthly_price, 0);
    const activeUsers = rawSubscriptions.reduce((sum, s) => sum + s.used_slots, 0);
    const prices = rawSubscriptions.map(s => s.price_per_user).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    return { totalSubscriptions: rawSubscriptions.length, totalSlots, usedSlots, availableSlots: Math.max(0, totalSlots - usedSlots), monthlyRevenue, activeUsers, avgPricePerSlot: avgPrice };
  }, [rawSubscriptions]);

  // ----- User assignments derivation -----
  const userAssignments = useMemo(() => {
    const map = new Map<Id<"users">, UserAssignment[]>();
    for (const sub of subscriptions) {
      const ownerUser = rawUsers.find((u: any) => u.email === sub.owner_email);
      if (ownerUser) {
        const existing = map.get(ownerUser._id) || [];
        existing.push({ subscription: sub, slot: null, role: "owner" });
        map.set(ownerUser._id, existing);
      }
      for (const slot of sub.slots) {
        if (slot.user_id) {
          const existing = map.get(slot.user_id) || [];
          existing.push({ subscription: sub, slot, role: "member" });
          map.set(slot.user_id, existing);
        }
      }
    }
    return map;
  }, [subscriptions, rawUsers]);

  const enrichedUsers: UserWithAssignments[] = useMemo(() => {
    return rawUsers.map((user: any) => {
      const assignments = userAssignments.get(user._id) || [];
      const uniqueSubs = new Set(assignments.filter(a => a.role === "member").map(a => a.subscription._id));
      return {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        is_admin: user.is_admin,
        is_banned: user.is_banned,
        is_suspended: user.is_suspended,
        role: user.role,
        created_at: user.created_at,
        activeSubscriptions: user.activeSubscriptions || 0,
        totalPayments: user.totalPayments || 0,
        subscriptionCount: uniqueSubs.size,
        slotsOccupied: assignments.filter(a => a.role === "member" && a.slot).length,
        assignments,
      };
    });
  }, [rawUsers, userAssignments]);

  const filteredUsers = useMemo(() => {
    let result = enrichedUsers.filter((user) => {
      const text = `${user.full_name || ""} ${user.email || ""} ${user.username || ""} ${user.phone || ""}`.toLowerCase();
      const q = userSearch.trim().toLowerCase();
      const matchesSearch = !q || text.includes(q);

      const matchesService = userServiceFilter === "All" || user.assignments.some(a => a.subscription.service_name === userServiceFilter);

      let matchesStatus = true;
      if (userStatusFilter === "Active") matchesStatus = !user.is_banned && !user.is_suspended;
      else if (userStatusFilter === "Suspended") matchesStatus = !!user.is_suspended && !user.is_banned;
      else if (userStatusFilter === "Banned") matchesStatus = !!user.is_banned;

      let matchesRole = true;
      if (userRoleFilter === "Admin") matchesRole = !!user.is_admin;
      else if (userRoleFilter === "Owner") matchesRole = user.assignments.some(a => a.role === "owner");
      else if (userRoleFilter === "Member") matchesRole = user.assignments.some(a => a.role === "member") || (!user.is_admin && !user.assignments.some(a => a.role === "owner"));
      else if (userRoleFilter === "Unassigned") matchesRole = user.assignments.length === 0 && !user.is_admin;

      return matchesSearch && matchesService && matchesStatus && matchesRole;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (userSortColumn === "full_name") cmp = (a.full_name || "").localeCompare(b.full_name || "");
      else if (userSortColumn === "email") cmp = (a.email || "").localeCompare(b.email || "");
      else if (userSortColumn === "username") cmp = (a.username || "").localeCompare(b.username || "");
      else if (userSortColumn === "subscriptionCount") cmp = a.subscriptionCount - b.subscriptionCount;
      else if (userSortColumn === "slotsOccupied") cmp = a.slotsOccupied - b.slotsOccupied;
      else if (userSortColumn === "activeSubscriptions") cmp = a.activeSubscriptions - b.activeSubscriptions;
      else if (userSortColumn === "created_at") cmp = (a.created_at || 0) - (b.created_at || 0);
      return userSortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [enrichedUsers, userSearch, userServiceFilter, userStatusFilter, userRoleFilter, userSortColumn, userSortDirection]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const safeUserPage = Math.min(userPage, userTotalPages);
  const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * userPageSize, safeUserPage * userPageSize);

  const selectedUser = useMemo(() => enrichedUsers.find((u) => u._id === selectedUserId) || null, [enrichedUsers, selectedUserId]);

  // ----- Handlers -----
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };

  const handleUserSort = (col: UserSortColumn) => {
    if (userSortColumn === col) setUserSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setUserSortColumn(col); setUserSortDirection("asc"); }
  };

  const toggleBulkSelect = (id: Id<"marketplace">) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSubscriptions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedSubscriptions.map(s => s._id)));
  };

  const handleRemove = async (slot: SlotRecord) => {
    if (!currentUser?._id || !slot.user_id) return;
    if (!window.confirm("Remove this user from the subscription slot?")) return;
    try {
      await removeUser({ adminId: currentUser._id as Id<"users">, slotId: slot.slot_id, reason: "Removed via Subscription Manager" });
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
      await updateSlotRenewalDate({ adminId: currentUser._id as Id<"users">, slotId: slot.slot_id, renewalDate: draft });
      setDateDrafts((current) => { const next = { ...current }; delete next[slot.slot_id]; return next; });
      toast.success("User renewal date updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user renewal date");
    } finally { setSavingDateFor(null); }
  };

  const handleRenewSlot = async (slotId: Id<"subscription_slots">) => {
    if (!window.confirm("Renew this slot now? This will charge the user's wallet.")) return;
    try { await renewSlot({ id: slotId }); toast.success("Slot renewed successfully"); }
    catch (error: any) { toast.error(error?.message || "Failed to renew slot"); }
  };

  const handleRemoveUserFromAll = async (user: UserWithAssignments) => {
    const memberSlots = user.assignments.filter(a => a.role === "member" && a.slot);
    if (memberSlots.length === 0) { toast.error("No member slots to remove"); return; }
    if (!window.confirm(`Remove ${user.full_name || "this user"} from all ${memberSlots.length} subscription slot(s)?`)) return;
    for (const a of memberSlots) {
      if (a.slot) {
        try { await removeUser({ adminId: currentUser!._id as Id<"users">, slotId: a.slot.slot_id, reason: "Bulk removed via User Search Panel" }); }
        catch (e: any) { toast.error(e?.message || "Failed"); }
      }
    }
    toast.success("User removed from all slots");
  };

  const handleToggleSuspend = async (user: UserWithAssignments) => {
    if (!currentUser?._id) return;
    try {
      if (user.is_suspended) {
        await unsuspendUserMut({ userId: user._id, executorId: currentUser._id as Id<"users"> });
        toast.success("User unsuspended");
      } else {
        await suspendUserMut({ userId: user._id, executorId: currentUser._id as Id<"users"> });
        toast.success("User suspended");
      }
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const handleSendNotification = async (user: UserWithAssignments) => {
    const msg = prompt("Notification message:");
    if (!msg || !currentUser?._id) return;
    try {
      await sendNotificationMut({ userId: user._id, title: "Admin Notification", message: msg, type: "admin", executorId: currentUser._id as Id<"users"> });
      toast.success("Notification sent");
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  const SortHeader = ({ column, children }: { column: SortColumn; children: ReactNode }) => (
    <button onClick={() => handleSort(column)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">
      {children}
      <ArrowUpDown size={12} className={`transition-opacity ${sortColumn === column ? "opacity-100" : "opacity-30"}`} />
    </button>
  );

  const UserSortHeader = ({ column, children }: { column: UserSortColumn; children: ReactNode }) => (
    <button onClick={() => handleUserSort(column)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">
      {children}
      <ArrowUpDown size={12} className={`transition-opacity ${userSortColumn === column ? "opacity-100" : "opacity-30"}`} />
    </button>
  );

  const selectedSubscriptionHealth = selectedSubscription ? getHealthColor(selectedSubscription) : "emerald";
  const selectedCountdown = selectedSubscription ? getRenewalCountdown(selectedSubscription.renewal_date) : { label: "", urgent: false };

  return (
    <AdminShell activeItem="subscription_manager" currentUser={currentUser} title="Subscription Manager" subtitle="Slot Assignments">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <button onClick={() => navigate("/admin")} className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-wider">
              <ArrowLeft size={12} /> Back to admin
            </button>
            <h1 className="text-xl font-black tracking-tight text-zinc-950">Subscription Manager</h1>
            <p className="mt-0.5 text-sm font-semibold text-zinc-500">Manage subscriptions, pricing, slots and assignments.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-violet-700 transition"><Plus size={14} /> Add Subscription</button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50 transition"><Upload size={14} /> Import</button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50 transition"><Download size={14} /> Export</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100/50 p-1 w-fit">
          <button onClick={() => { setActiveView("subscriptions"); setSelectedId(null); }} className={`rounded-md px-4 py-1.5 text-xs font-black transition ${activeView === "subscriptions" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}>
            Subscriptions
          </button>
          <button onClick={() => { setActiveView("users"); setSelectedUserId(null); }} className={`rounded-md px-4 py-1.5 text-xs font-black transition ${activeView === "users" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}>
            Users
          </button>
        </div>

        {activeView === "subscriptions" && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <KpiCard label="Total Subscriptions" value={totals.totalSubscriptions} icon={<ShieldCheck size={14} />} />
              <KpiCard label="Total Slots" value={totals.totalSlots} icon={<Users size={14} />} />
              <KpiCard label="Used Slots" value={totals.usedSlots} icon={<CheckCircle2 size={14} />} />
              <KpiCard label="Available Slots" value={totals.availableSlots} icon={<AlertCircle size={14} />} />
            </div>

            {/* 70/30 Layout */}
            <div className="flex flex-col gap-5 xl:flex-row">
              <div className="min-w-0 flex-1 xl:w-[70%]">
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
                  <div className="border-b border-zinc-100 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[160px]">
                        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search subscriptions..." className="w-full rounded-md border border-zinc-200 py-2 pl-8 pr-3 text-xs font-semibold outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100" />
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={selectedIds.size === paginatedSubscriptions.length && paginatedSubscriptions.length > 0} onChange={toggleSelectAll} className="h-3.5 w-3.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500" /></th>
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
                            <tr key={sub._id} onClick={() => { setSelectedId(sub._id); setSelectedIds(prev => { const n = new Set(prev); n.add(sub._id); return n; }); }} className={`cursor-pointer transition text-[13px] ${selectedId === sub._id ? "bg-violet-50/60" : "hover:bg-zinc-50"}`}>
                              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(sub._id)} onChange={() => toggleBulkSelect(sub._id)} className="h-3.5 w-3.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500" /></td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2.5">
                                  <HealthDot health={health} />
                                  <div className="min-w-0"><p className="truncate font-black text-zinc-950">{sub.service_name}</p><p className="truncate text-[11px] font-semibold text-zinc-400">{sub.plan_type}</p></div>
                                </div>
                              </td>
                              <td className="px-3 py-3"><p className="truncate font-semibold text-zinc-600 max-w-[140px]">{sub.owner_email}</p></td>
                              <td className="px-3 py-3 text-right font-black text-zinc-950">{fmtCurrency(sub.monthly_price)}</td>
                              <td className="px-3 py-3 text-right font-semibold text-zinc-600">{fmtCurrency(sub.price_per_user)}</td>
                              <td className="px-3 py-3 text-right">
                                <span className="font-black text-zinc-950">{sub.used_slots}</span><span className="text-zinc-400">/{sub.total_slots}</span>
                                <p className={`text-[10px] font-bold ${pct >= 100 ? "text-red-500" : pct > 50 ? "text-amber-500" : "text-emerald-500"}`}>{pct}%</p>
                              </td>
                              <td className="px-3 py-3"><p className="whitespace-nowrap text-xs font-semibold text-zinc-600">{formatDate(sub.renewal_date)}</p><p className={`text-[10px] font-bold ${countdown.urgent ? "text-red-500" : "text-zinc-400"}`}>{countdown.label}</p></td>
                              <td className="px-3 py-3"><StatusPill status={sub.manager_status} /></td>
                              <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="relative inline-block group">
                                  <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"><EllipsisVertical size={15} /></button>
                                  <div className="absolute right-0 top-full z-10 mt-1 hidden w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg group-hover:block">
                                    <button onClick={() => setSelectedId(sub._id)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><Eye size={14} /> View Details</button>
                                    <button className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><Edit3 size={14} /> Edit</button>
                                    <button className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><PauseCircle size={14} /> Pause</button>
                                    <hr className="my-1 border-zinc-100" />
                                    <button onClick={() => sub.slots.filter(s => s.user_id).forEach(s => handleRenewSlot(s.slot_id))} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><RefreshCw size={14} /> Renew All</button>
                                    <button className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedSubscriptions.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-sm font-bold text-zinc-400">No subscriptions match your filters.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-zinc-400">{filteredSubscriptions.length > 0 ? `Showing ${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, filteredSubscriptions.length)} of ${filteredSubscriptions.length}` : "No results"}</p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, Math.min(safePage - 2, totalPages - 4)); const page = start + i; if (page > totalPages) return null; return (<button key={page} onClick={() => setCurrentPage(page)} className={`h-7 min-w-[28px] rounded-md text-[11px] font-bold transition ${page === safePage ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}>{page}</button>); })}
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT - Subscription Details Panel */}
              <div className="w-full xl:w-[30%] xl:min-w-[340px] xl:max-w-[420px] space-y-4">
                {selectedSubscription ? (
                  <>
                    <div className="rounded-xl border border-zinc-200 bg-white">
                      <div className="border-b border-zinc-100 px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2"><HealthDot health={selectedSubscriptionHealth} /><h2 className="truncate text-base font-black text-zinc-950">{selectedSubscription.service_name}</h2></div>
                            <p className="mt-0.5 truncate text-xs font-semibold text-zinc-500">{selectedSubscription.plan_type}</p>
                          </div>
                          <StatusPill status={getManagerStatus(selectedSubscription)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-px bg-zinc-100">
                        <div className="bg-white px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Monthly Price</p><p className="mt-0.5 text-sm font-black text-zinc-950">{fmtCurrency(selectedSubscription.monthly_price)}</p></div>
                        <div className="bg-white px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Price/User</p><p className="mt-0.5 text-sm font-black text-zinc-950">{fmtCurrency(selectedSubscription.price_per_user)}</p></div>
                        <div className="bg-white px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Available</p><p className="mt-0.5 text-sm font-black text-zinc-950">{selectedSubscription.available_slots}</p></div>
                        <div className="bg-white px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Renewal</p><p className={`mt-0.5 text-sm font-black ${selectedCountdown.urgent ? "text-red-500" : "text-zinc-950"}`}>{formatDate(selectedSubscription.renewal_date)}</p></div>
                      </div>
                      <div className="border-t border-zinc-100 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Owner</p><p className="mt-0.5 truncate text-sm font-black text-zinc-900">{selectedSubscription.owner_name}</p><p className="truncate text-xs font-semibold text-zinc-500">{selectedSubscription.owner_email}</p></div>
                      <div className="border-t border-zinc-100 px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Slot Utilization</p><p className="text-xs font-black text-zinc-700">{selectedSubscription.used_slots}/{selectedSubscription.total_slots}</p></div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div className={`h-full rounded-full transition-all ${selectedSubscription.available_slots <= 0 ? "bg-red-500" : selectedSubscription.used_slots / Math.max(selectedSubscription.total_slots, 1) > 0.5 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${selectedSubscription.total_slots > 0 ? (selectedSubscription.used_slots / selectedSubscription.total_slots) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1"><p className="text-[10px] font-bold text-zinc-400">{selectedSubscription.total_slots > 0 ? Math.round((selectedSubscription.used_slots / selectedSubscription.total_slots) * 100) : 0}% used</p><p className={`text-[10px] font-bold ${selectedCountdown.urgent ? "text-red-500" : "text-zinc-400"}`}>{selectedCountdown.label}</p></div>
                      </div>
                      <div className="border-t border-zinc-100 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Assigned Users</p><span className="text-[10px] font-bold text-zinc-400">{selectedSubscription.used_slots}</span></div>
                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                          {selectedSubscription.slots.filter(s => s.user_id).map((slot) => (
                            <div key={slot.slot_id} className="flex items-center justify-between rounded-md border border-zinc-100 px-2.5 py-2">
                              <div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-zinc-900">{slot.user_name}</p><p className="truncate text-[10px] font-semibold text-zinc-400">{slot.user_email}</p></div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${slot.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{slot.payment_status}</span>
                                <button onClick={() => setAssignSlot(slot)} className="rounded p-1 text-zinc-400 hover:bg-violet-50 hover:text-violet-600" title="Replace user"><UserPlus size={12} /></button>
                                <button onClick={() => handleRemove(slot)} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500" title="Remove user"><UserMinus size={12} /></button>
                              </div>
                            </div>
                          ))}
                          {selectedSubscription.slots.filter(s => !s.user_id).map((slot) => (
                            <div key={slot.slot_id} className="flex items-center justify-between rounded-md border border-dashed border-zinc-200 px-2.5 py-2">
                              <p className="text-xs font-semibold text-zinc-400">Slot {slot.slot_number} — Available</p>
                              <button onClick={() => setAssignSlot(slot)} className="rounded p-1 text-zinc-400 hover:bg-violet-50 hover:text-violet-600"><UserPlus size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="sticky bottom-0 border-t border-zinc-100 bg-zinc-50 px-4 py-3">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">Quick Actions</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => { const empty = selectedSubscription.slots.find(s => !s.user_id); if (empty) setAssignSlot(empty); else toast.error("No available slots"); }} className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-violet-700 transition"><UserPlus size={12} /> Assign</button>
                          <button className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><RefreshCw size={12} /> Transfer</button>
                          <button onClick={() => selectedSubscription.slots.filter(s => s.user_id).forEach(s => handleRenewSlot(s.slot_id))} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><RefreshCw size={12} /> Renew</button>
                          <button className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><Edit3 size={12} /> Edit</button>
                          <button className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><PauseCircle size={12} /> Pause</button>
                          <button className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-50 transition"><Trash2 size={12} /> Delete</button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3">Revenue Summary</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold text-zinc-500">Monthly Revenue</p><p className="text-sm font-black text-emerald-600">{fmtCurrency(totals.monthlyRevenue)}</p></div>
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold text-zinc-500">Total Active Users</p><p className="text-sm font-black text-zinc-950">{totals.activeUsers}</p></div>
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold text-zinc-500">Avg Price / Slot</p><p className="text-sm font-black text-zinc-950">{fmtCurrency(Math.round(totals.avgPricePerSlot))}</p></div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2"><Clock size={14} className="text-violet-500" /><p className="text-xs font-black uppercase tracking-wider text-zinc-400">Activity Log</p></div>
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
                    <div className="text-center"><ShieldCheck size={32} className="mx-auto text-zinc-300" /><p className="mt-3 text-sm font-black text-zinc-400">Select a subscription</p><p className="mt-1 text-xs font-semibold text-zinc-300">Choose from the table to view details and manage slots.</p></div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeView === "users" && (
          <div className="flex flex-col gap-5 xl:flex-row">
            {/* LEFT - Users Table */}
            <div className="min-w-0 flex-1 xl:w-[70%]">
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                {/* Global Search + Filters */}
                <div className="border-b border-zinc-100 p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                        placeholder="Search users, emails, usernames, subscriptions..."
                        className="w-full rounded-md border border-zinc-200 py-2 pl-8 pr-3 text-xs font-semibold outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <select value={userServiceFilter} onChange={(e) => { setUserServiceFilter(e.target.value); setUserPage(1); }} className="appearance-none rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-7 text-[10px] font-black outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                        <option value="All">All Subscriptions</option>
                        {services.filter(s => s !== "All").map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <select value={userStatusFilter} onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }} className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-black outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Banned">Banned</option>
                    </select>
                    <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }} className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-black outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                      <option value="All">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Owner">Owner</option>
                      <option value="Member">Member</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="px-3 py-2.5"><UserSortHeader column="full_name">Name</UserSortHeader></th>
                        <th className="px-3 py-2.5"><UserSortHeader column="username">Username</UserSortHeader></th>
                        <th className="px-3 py-2.5"><UserSortHeader column="email">Email</UserSortHeader></th>
                        <th className="px-3 py-2.5 text-right"><UserSortHeader column="subscriptionCount">Subs</UserSortHeader></th>
                        <th className="px-3 py-2.5 text-right"><UserSortHeader column="slotsOccupied">Slots</UserSortHeader></th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {paginatedUsers.map((user) => {
                        const hasOwnerAssignments = user.assignments.some(a => a.role === "owner");
                        return (
                          <tr key={user._id} onClick={() => setSelectedUserId(user._id === selectedUserId ? null : user._id)} className={`cursor-pointer transition text-[13px] ${selectedUserId === user._id ? "bg-violet-50/60" : "hover:bg-zinc-50"}`}>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                  {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                                </div>
                                <p className="truncate font-black text-zinc-950 max-w-[160px]">{user.full_name || "Unnamed"}</p>
                              </div>
                            </td>
                            <td className="px-3 py-3"><p className="truncate font-semibold text-zinc-500 max-w-[100px]">{user.username ? `@${user.username}` : "—"}</p></td>
                            <td className="px-3 py-3"><p className="truncate font-semibold text-zinc-600 max-w-[160px]">{user.email || "—"}</p></td>
                            <td className="px-3 py-3 text-right font-black text-zinc-950">{user.subscriptionCount}</td>
                            <td className="px-3 py-3 text-right font-black text-zinc-950">{user.slotsOccupied}</td>
                            <td className="px-3 py-3">
                              {user.is_admin ? (
                                <span className="text-[10px] font-black text-violet-600 uppercase">Admin</span>
                              ) : hasOwnerAssignments ? (
                                <span className="text-[10px] font-black text-amber-600 uppercase">Owner</span>
                              ) : user.assignments.length > 0 ? (
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Member</span>
                              ) : (
                                <span className="text-[10px] font-black text-zinc-300 uppercase">None</span>
                              )}
                            </td>
                            <td className="px-3 py-3"><UserStatusBadge user={user} /></td>
                            <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block group">
                                <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"><EllipsisVertical size={15} /></button>
                                <div className="absolute right-0 top-full z-10 mt-1 hidden w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg group-hover:block">
                                  <button onClick={() => { setSelectedUserId(user._id); window.open(`/admin/users?userId=${user._id}`, '_blank'); }} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><ExternalLink size={14} /> View Profile</button>
                                  <button onClick={handleToggleSuspend.bind(null, user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><Ban size={14} /> {user.is_suspended ? "Unsuspend" : "Suspend"}</button>
                                  <button onClick={handleSendNotification.bind(null, user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-violet-50 hover:text-violet-700"><Send size={14} /> Send Notification</button>
                                  <hr className="my-1 border-zinc-100" />
                                  <button onClick={handleRemoveUserFromAll.bind(null, user)} className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><UserMinus size={14} /> Remove From All</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedUsers.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-sm font-bold text-zinc-400">No users match your filters.</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-zinc-400">{filteredUsers.length > 0 ? `Showing ${(safeUserPage - 1) * userPageSize + 1}-${Math.min(safeUserPage * userPageSize, filteredUsers.length)} of ${filteredUsers.length}` : "No results"}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={safeUserPage <= 1} className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
                    {Array.from({ length: Math.min(userTotalPages, 5) }, (_, i) => { const start = Math.max(1, Math.min(safeUserPage - 2, userTotalPages - 4)); const page = start + i; if (page > userTotalPages) return null; return (<button key={page} onClick={() => setUserPage(page)} className={`h-7 min-w-[28px] rounded-md text-[11px] font-bold transition ${page === safeUserPage ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}>{page}</button>); })}
                    <button onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))} disabled={safeUserPage >= userTotalPages} className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - User Detail Panel */}
            <div className="w-full xl:w-[30%] xl:min-w-[340px] xl:max-w-[420px] space-y-4">
              {selectedUser ? (
                <>
                  {/* User Profile Card */}
                  <div className="rounded-xl border border-zinc-200 bg-white">
                    <div className="border-b border-zinc-100 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-lg font-black shrink-0">
                          {(selectedUser.full_name?.[0] || selectedUser.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="truncate text-base font-black text-zinc-950">{selectedUser.full_name || "Unnamed"}</h2>
                            <UserStatusBadge user={selectedUser} />
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-zinc-500">@{selectedUser.username || "—"}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><Mail size={13} className="shrink-0 text-zinc-400" /><span className="truncate">{selectedUser.email || "—"}</span></div>
                        {selectedUser.phone && <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><Smartphone size={13} className="shrink-0 text-zinc-400" /><span>{selectedUser.phone}</span></div>}
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><User size={13} className="shrink-0 text-zinc-400" /><span>{selectedUser.role || (selectedUser.is_admin ? "Admin" : "Member")}</span></div>
                      </div>
                    </div>

                    {/* User Slot Summary */}
                    <div className="grid grid-cols-3 gap-px bg-zinc-100">
                      <div className="bg-white px-4 py-3 text-center"><p className="text-lg font-black text-zinc-950">{selectedUser.assignments.filter(a => a.role === "member").length}</p><p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Active Subs</p></div>
                      <div className="bg-white px-4 py-3 text-center"><p className="text-lg font-black text-zinc-950">{selectedUser.slotsOccupied}</p><p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Slots</p></div>
                      <div className="bg-white px-4 py-3 text-center"><p className="text-lg font-black text-zinc-950">{selectedUser.created_at ? formatUnixDate(selectedUser.created_at) : "—"}</p><p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Joined</p></div>
                    </div>
                  </div>

                  {/* Subscription Assignments */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-zinc-400">Subscription Assignments ({selectedUser.assignments.length})</p>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                      {selectedUser.assignments.map((a, idx) => (
                        <div key={idx} className="rounded-lg border border-zinc-100 px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-black text-zinc-950">{a.subscription.service_name}</p>
                                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ${a.role === "owner" ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-700"}`}>{a.role}</span>
                              </div>
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-400">Owner: {a.subscription.owner_email}</p>
                              {a.slot && (
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-semibold text-zinc-500">
                                  <span>Slot #{a.slot.slot_number} of {a.subscription.total_slots}</span>
                                  <span>Renews: {formatDate(a.slot.renewal_date)}</span>
                                  <span className={`${a.slot.payment_status === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>{a.slot.payment_status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {a.slot && a.role === "member" && (
                            <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-50 pt-2">
                              <button onClick={() => { setAssignSlot(a.slot); setActiveView("subscriptions"); setSelectedId(a.subscription._id); }} className="rounded-md bg-violet-50 px-2 py-1 text-[9px] font-black text-violet-700 hover:bg-violet-100 transition" title="Move to different slot"><ArrowRight size={11} className="inline" /> Move</button>
                              <button onClick={() => handleRemove(a.slot!)} className="rounded-md bg-red-50 px-2 py-1 text-[9px] font-black text-red-600 hover:bg-red-100 transition"><UserMinus size={11} className="inline" /> Remove</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedUser.assignments.length === 0 && (
                        <div className="py-6 text-center text-xs font-semibold text-zinc-400">This user has no subscription assignments.</div>
                      )}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <p className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">Admin Actions</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => window.open(`/admin/users?userId=${selectedUser._id}`, '_blank')} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><ExternalLink size={12} /> View Profile</button>
                      <button onClick={handleToggleSuspend.bind(null, selectedUser)} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><Ban size={12} /> {selectedUser.is_suspended ? "Unsuspend" : "Suspend"}</button>
                      <button onClick={handleSendNotification.bind(null, selectedUser)} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-zinc-600 hover:bg-zinc-100 transition"><Bell size={12} /> Notify</button>
                      <button onClick={handleRemoveUserFromAll.bind(null, selectedUser)} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-50 transition"><Trash2 size={12} /> Remove All</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8">
                  <div className="text-center"><Users size={32} className="mx-auto text-zinc-300" /><p className="mt-3 text-sm font-black text-zinc-400">Select a user</p><p className="mt-1 text-xs font-semibold text-zinc-300">Search and click a user to view their assignments and manage their access.</p></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedSubscription && assignSlot && (
        <AssignUserModal
          subscription={selectedSubscription}
          slot={assignSlot}
          users={rawUsers}
          currentAdminId={currentUser?._id as Id<"users"> | undefined}
          onClose={() => setAssignSlot(null)}
        />
      )}
    </AdminShell>
  );
}
