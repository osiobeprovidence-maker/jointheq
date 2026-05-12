import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  Headphones,
  Layers,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  PauseCircle,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
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

type ManagerStatus = "active" | "full" | "paused" | "expired" | "hidden";

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
  isListed?: boolean;
  visibility?: "marketplace" | "internal" | "private";
  visible_to_users?: boolean;
  auto_hide_when_full?: boolean;
  category: string;
  account_email: string;
  slots: SlotRecord[];
};

const statusStyles: Record<ManagerStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  full: "bg-red-50 text-red-700 border-red-100",
  paused: "bg-amber-50 text-amber-700 border-amber-100",
  expired: "bg-zinc-100 text-zinc-600 border-zinc-200",
  hidden: "bg-slate-100 text-slate-600 border-slate-200",
};

function getManagerStatus(subscription: SubscriptionRecord): ManagerStatus {
  if (subscription.status === "paused" || subscription.status === "expired" || subscription.status === "hidden") return subscription.status;
  if (subscription.available_slots <= 0 || subscription.status === "full") return "full";
  return "active";
}

function formatDate(date?: string) {
  if (!date) return "Not set";
  const ms = Date.parse(date);
  if (!Number.isFinite(ms)) return date;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(ms));
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
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black ${statusStyles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function VisibilityPill({ subscription }: { subscription: SubscriptionRecord }) {
  const visible = subscription.visible_to_users;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${
      visible ? "border-blue-100 bg-blue-50 text-blue-700" : "border-zinc-200 bg-zinc-100 text-zinc-500"
    }`}>
      {visible ? <Eye size={12} /> : <EyeOff size={12} />}
      {visible ? "Marketplace" : subscription.visibility || "internal"}
    </span>
  );
}

function StatTile({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-zinc-400">{label}</p>
        <div className="text-violet-500">{icon}</div>
      </div>
      <p className="mt-2 text-xl font-black text-zinc-950">{value}</p>
    </div>
  );
}

const adminNavItems = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin" },
  { label: "Subscriptions", icon: <Layers size={18} />, path: "/admin/subscriptions", active: true },
  { label: "Payments", icon: <CreditCard size={18} />, path: "/admin/payments" },
  { label: "Campaigns", icon: <Megaphone size={18} />, path: "/admin" },
  { label: "Quest Approval", icon: <ListTodo size={18} />, path: "/admin" },
  { label: "Security", icon: <ShieldCheck size={18} />, path: "/admin" },
  { label: "Support", icon: <Headphones size={18} />, path: "/admin" },
  { label: "Admins", icon: <Shield size={18} />, path: "/admin" },
  { label: "Campus Q", icon: <GraduationCap size={18} />, path: "/admin" },
  { label: "Notifications", icon: <Bell size={18} />, path: "/admin" },
  { label: "Leave Requests", icon: <UserMinus size={18} />, path: "/admin" },
];

function AdminPageShell({ children, currentUser }: { children: ReactNode; currentUser: any }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {adminNavItems.map((item) => (
        <button
          key={item.label}
          onClick={() => handleNavigate(item.path)}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
            item.active ? "bg-white text-zinc-950" : "text-white/55 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-['Inter',sans-serif] text-zinc-950">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-zinc-950 text-white md:flex">
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black">Q</div>
            <div>
              <div className="text-sm font-black">JoinTheQ</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Admin Control</div>
            </div>
          </div>
        </div>
        {nav}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-black">
              {currentUser?.profile_image_url ? (
                <img src={currentUser.profile_image_url} alt="Admin profile" className="h-full w-full object-cover" />
              ) : (
                currentUser?.full_name?.[0] || "A"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold">{currentUser?.full_name || currentUser?.username || "Admin"}</div>
              <div className="truncate text-[10px] font-bold uppercase tracking-widest text-white/35">{currentUser?.admin_role || "Admin"}</div>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Logout now?")) auth.logout();
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-xs font-bold text-white/70 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-zinc-950 px-4 text-white shadow-lg md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-black">Q</div>
          <span className="text-sm font-black">Admin Control</span>
        </div>
        <button onClick={() => setMobileMenuOpen((current) => !current)} className="rounded-xl bg-white/10 p-2">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close admin menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute bottom-0 left-0 top-16 flex w-[88%] max-w-[320px] flex-col bg-zinc-950 text-white">
            {nav}
          </aside>
        </div>
      )}

      <main className="min-h-screen pt-16 md:ml-64 md:pt-0">
        <div className="hidden items-center justify-between border-b border-black/5 bg-white px-8 py-5 md:flex">
          <div>
            <h1 className="text-xl font-black">Subscriptions</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subscription OS</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-sm font-black">
              {currentUser?.profile_image_url ? (
                <img src={currentUser.profile_image_url} alt="Admin profile" className="h-full w-full object-cover" />
              ) : (
                currentUser?.full_name?.[0] || "A"
              )}
            </div>
            <span className="text-sm font-black">{currentUser?.username || currentUser?.full_name || "Admin"}</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
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
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5">
          <div>
            <h2 className="text-xl font-black text-zinc-950">{slot?.user_id ? "Replace User" : "Assign User"}</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">{subscription.service_name} - {subscription.plan_type}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <StatTile label="Monthly" value={fmtCurrency(subscription.monthly_price)} icon={<Wallet size={16} />} />
          <StatTile label="User price" value={fmtCurrency(subscription.price_per_user)} icon={<Users size={16} />} />
          <StatTile label="Slot" value={slot ? `#${slot.slot_number}` : "Full"} icon={<ShieldCheck size={16} />} />
          <StatTile label="Renews" value={formatDate(subscription.renewal_date)} icon={<Calendar size={16} />} />
        </div>

        <div className="px-5 pb-5">
          {isFull ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              This subscription is full. Remove or replace an existing user before assigning someone new.
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search existing users by name, email, or username"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </div>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUserId(user._id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      selectedUserId === user._id ? "border-violet-300 bg-violet-50" : "border-zinc-100 hover:bg-zinc-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black text-zinc-950">{user.full_name || user.username || "Unnamed user"}</p>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">{user.email}</p>
                    </div>
                    {selectedUserId === user._id && <CheckCircle2 size={18} className="text-violet-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 p-5">
          <button onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-black text-zinc-500 hover:bg-zinc-100">
            Cancel
          </button>
          <button
            onClick={confirmAssignment}
            disabled={isFull || !selectedUserId}
            className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionManagerPage() {
  const navigate = useNavigate();
  const currentUser = auth.getCurrentUser();
  const subscriptions = (useQuery(api.subscriptions.getSubscriptionManagerData) || []) as SubscriptionRecord[];
  const users = useQuery(api.admin.getAllUsers) || [];
  const activityLogs = useQuery(api.adminEnhanced.getAdminLogs, { limit: 12 }) || [];
  const removeUser = useMutation(api.adminEnhanced.adminRemoveUserFromSlot);
  const updateSlotRenewalDate = useMutation(api.subscriptions.adminUpdateSlotRenewalDate);
  const updateSubscriptionControls = useMutation(api.subscriptions.adminUpdateSubscriptionControls);
  const deleteSubscription = useMutation(api.subscriptions.adminDeleteGroup);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignSlot, setAssignSlot] = useState<SlotRecord | null>(null);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingDateFor, setSavingDateFor] = useState<string | null>(null);
  const [savingControlFor, setSavingControlFor] = useState<string | null>(null);

  const services = useMemo(() => ["All", ...Array.from(new Set(subscriptions.map((item) => item.service_name))).sort()], [subscriptions]);
  const enrichedSubscriptions = useMemo(
    () => subscriptions.map((subscription) => ({ ...subscription, manager_status: getManagerStatus(subscription) })),
    [subscriptions],
  );
  const filteredSubscriptions = enrichedSubscriptions.filter((subscription) => {
    const matchesSearch = `${subscription.service_name} ${subscription.plan_type} ${subscription.owner_email} ${subscription.account_email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesService = serviceFilter === "All" || subscription.service_name === serviceFilter;
    const matchesStatus = statusFilter === "All" || subscription.manager_status === statusFilter;
    const matchesVisibility = visibilityFilter === "All" || subscription.visibility === visibilityFilter || (visibilityFilter === "listed" && subscription.visible_to_users);
    return matchesSearch && matchesService && matchesStatus && matchesVisibility;
  });
  const selectedSubscription = filteredSubscriptions.find((item) => item._id === selectedId) || filteredSubscriptions[0];

  const totals = useMemo(() => {
    const totalSlots = subscriptions.reduce((sum, item) => sum + item.total_slots, 0);
    const usedSlots = subscriptions.reduce((sum, item) => sum + item.used_slots, 0);
    return {
      totalSubscriptions: subscriptions.length,
      totalSlots,
      usedSlots,
      availableSlots: Math.max(0, totalSlots - usedSlots),
    };
  }, [subscriptions]);

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
      setDateDrafts((current) => {
        const next = { ...current };
        delete next[slot.slot_id];
        return next;
      });
      toast.success("User renewal date updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user renewal date");
    } finally {
      setSavingDateFor(null);
    }
  };

  const handleControlUpdate = async (subscription: SubscriptionRecord, patch: Record<string, any>) => {
    if (!currentUser?._id) return;
    try {
      setSavingControlFor(subscription._id);
      await updateSubscriptionControls({
        adminId: currentUser._id as Id<"users">,
        marketplaceId: subscription._id,
        ...patch,
      });
      toast.success("Subscription controls updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update subscription controls");
    } finally {
      setSavingControlFor(null);
    }
  };

  const handlePriceSave = async (subscription: SubscriptionRecord) => {
    const draft = priceDrafts[subscription._id] ?? String(subscription.price_per_user || 0);
    const slotPrice = Number(draft);
    if (!Number.isFinite(slotPrice)) {
      toast.error("Enter a valid price");
      return;
    }
    await handleControlUpdate(subscription, { slotPrice });
    setPriceDrafts((current) => {
      const next = { ...current };
      delete next[subscription._id];
      return next;
    });
  };

  const handleDeleteSubscription = async (subscription: SubscriptionRecord) => {
    if (!window.confirm(`Delete ${subscription.service_name} and all of its slots? This cannot be undone.`)) return;
    try {
      await deleteSubscription({ group_id: subscription._id });
      toast.success("Subscription deleted");
      setSelectedId(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete subscription");
    }
  };

  return (
    <AdminPageShell currentUser={currentUser}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate("/admin")} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-zinc-400 hover:text-zinc-900">
              <ArrowLeft size={14} /> Back to admin
            </button>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">Subscriptions</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-zinc-500">
              Manage inventory, slots, marketplace visibility, renewals, pricing, and assignments from one operating system.
            </p>
          </div>
          <div className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700">
            {totals.availableSlots} slots available
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Subscriptions" value={totals.totalSubscriptions} icon={<ShieldCheck size={16} />} />
          <StatTile label="Total slots" value={totals.totalSlots} icon={<Users size={16} />} />
          <StatTile label="Used slots" value={totals.usedSlots} icon={<CheckCircle2 size={16} />} />
          <StatTile label="Available" value={totals.availableSlots} icon={<AlertCircle size={16} />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
          <section className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_150px_170px]">
                <div className="relative">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search subscription, owner, or account email"
                    className="w-full rounded-lg border border-zinc-200 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm font-black outline-none">
                    {services.map((service) => <option key={service}>{service}</option>)}
                  </select>
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-black outline-none">
                  {["All", "active", "full", "paused", "expired", "hidden"].map((status) => <option key={status} value={status}>{status === "All" ? "All" : status}</option>)}
                </select>
                <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-black outline-none">
                  {["All", "listed", "marketplace", "internal", "private"].map((visibility) => <option key={visibility} value={visibility}>{visibility === "All" ? "All visibility" : visibility}</option>)}
                </select>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {filteredSubscriptions.map((subscription) => {
                const isSelected = selectedSubscription?._id === subscription._id;
                return (
                  <button
                    key={subscription._id}
                    onClick={() => setSelectedId(subscription._id)}
                    className={`grid w-full gap-3 p-4 text-left transition hover:bg-zinc-50 lg:grid-cols-[minmax(0,1fr)_120px_120px_120px] ${
                      isSelected ? "bg-violet-50/70" : "bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-zinc-950">{subscription.service_name}</h2>
                        <StatusPill status={subscription.manager_status} />
                        <VisibilityPill subscription={subscription} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-500">{subscription.plan_type}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-zinc-400">
                        <Mail size={13} /> Owner: {subscription.owner_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-zinc-400">Monthly</p>
                      <p className="mt-1 text-sm font-black text-zinc-900">{fmtCurrency(subscription.monthly_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-zinc-400">User price</p>
                      <p className="mt-1 text-sm font-black text-zinc-900">{fmtCurrency(subscription.price_per_user)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-zinc-400">Slots</p>
                      <p className="mt-1 text-sm font-black text-zinc-900">{subscription.used_slots}/{subscription.total_slots} used</p>
                      <p className={`mt-1 text-xs font-black ${subscription.available_slots > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {subscription.available_slots} available
                      </p>
                    </div>
                  </button>
                );
              })}
              {filteredSubscriptions.length === 0 && (
                <div className="p-10 text-center text-sm font-bold text-zinc-400">No subscriptions match your filters.</div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            {selectedSubscription ? (
              <section className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-950">{selectedSubscription.service_name}</h2>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">{selectedSubscription.plan_type}</p>
                  </div>
                  <StatusPill status={getManagerStatus(selectedSubscription)} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <StatTile label="Monthly price" value={fmtCurrency(selectedSubscription.monthly_price)} icon={<Wallet size={16} />} />
                  <StatTile label="Price per user" value={fmtCurrency(selectedSubscription.price_per_user)} icon={<Users size={16} />} />
                  <StatTile label="Renewal date" value={formatDate(selectedSubscription.renewal_date)} icon={<Calendar size={16} />} />
                  <StatTile label="Available slots" value={selectedSubscription.available_slots} icon={<CheckCircle2 size={16} />} />
                </div>

                <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase text-zinc-400">Owner email</p>
                  <p className="mt-1 break-all text-sm font-black text-zinc-900">{selectedSubscription.owner_email}</p>
                </div>

                <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase text-zinc-500">Marketplace Control</h3>
                      <p className="mt-1 text-xs font-semibold text-zinc-400">Listing, visibility, pricing, and lifecycle controls.</p>
                    </div>
                    <VisibilityPill subscription={selectedSubscription} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3">
                      <span className="text-xs font-black text-zinc-700">Listed on Marketplace</span>
                      <input
                        type="checkbox"
                        checked={selectedSubscription.isListed ?? true}
                        onChange={(event) => handleControlUpdate(selectedSubscription, { isListed: event.target.checked })}
                        disabled={savingControlFor === selectedSubscription._id}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3">
                      <span className="text-xs font-black text-zinc-700">Visible to users</span>
                      <input
                        type="checkbox"
                        checked={(selectedSubscription.visibility ?? "marketplace") === "marketplace"}
                        onChange={(event) => handleControlUpdate(selectedSubscription, { visibility: event.target.checked ? "marketplace" : "internal" })}
                        disabled={savingControlFor === selectedSubscription._id}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3">
                      <span className="text-xs font-black text-zinc-700">Auto-hide when full</span>
                      <input
                        type="checkbox"
                        checked={selectedSubscription.auto_hide_when_full ?? true}
                        onChange={(event) => handleControlUpdate(selectedSubscription, { autoHideWhenFull: event.target.checked })}
                        disabled={savingControlFor === selectedSubscription._id}
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                      <label className="text-[10px] font-black uppercase text-zinc-400">User price</label>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={priceDrafts[selectedSubscription._id] ?? String(selectedSubscription.price_per_user || 0)}
                          onChange={(event) => setPriceDrafts((current) => ({ ...current, [selectedSubscription._id]: event.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-black outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                        />
                        <button
                          onClick={() => handlePriceSave(selectedSubscription)}
                          disabled={savingControlFor === selectedSubscription._id}
                          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                        >
                          <Save size={14} /> Save
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => handleControlUpdate(selectedSubscription, { status: "active" })} className="rounded-lg bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700">Activate</button>
                      <button onClick={() => handleControlUpdate(selectedSubscription, { status: "paused" })} className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 px-3 py-3 text-xs font-black text-amber-700"><PauseCircle size={14} /> Pause</button>
                      <button onClick={() => handleControlUpdate(selectedSubscription, { status: "hidden", isListed: false, visibility: "private" })} className="rounded-lg bg-zinc-100 px-3 py-3 text-xs font-black text-zinc-600">Hide</button>
                      <button onClick={() => handleDeleteSubscription(selectedSubscription)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-3 text-xs font-black text-red-700"><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase text-zinc-500">Slot Management</h3>
                    <span className="text-xs font-black text-zinc-400">{selectedSubscription.used_slots}/{selectedSubscription.total_slots} occupied</span>
                  </div>
                  <div className="space-y-3">
                    {selectedSubscription.slots.map((slot) => {
                      const isEmpty = !slot.user_id;
                      const slotDateDraft = dateDrafts[slot.slot_id] ?? toDateInputValue(slot.renewal_date || selectedSubscription.renewal_date);
                      const slotSavedDate = toDateInputValue(slot.renewal_date || selectedSubscription.renewal_date);
                      return (
                        <div key={slot.slot_id} className={`rounded-lg border p-4 ${isEmpty ? "border-dashed border-emerald-200 bg-emerald-50/40" : "border-zinc-200 bg-white"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-zinc-950">Slot {slot.slot_number}</p>
                              <p className="mt-1 text-xs font-bold text-zinc-400">{slot.slot_name} - {fmtCurrency(slot.slot_price)}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${isEmpty ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                              {isEmpty ? "Available Slot" : slot.user_status}
                            </span>
                          </div>
                          {isEmpty ? (
                            <p className="mt-3 text-sm font-bold text-emerald-700">Available Slot</p>
                          ) : (
                            <div className="mt-3">
                              <p className="text-sm font-black text-zinc-900">{slot.user_name}</p>
                              <p className="mt-1 text-xs font-semibold text-zinc-500">{slot.user_email}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{slot.payment_status}</span>
                                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-600">{slot.user_status}</span>
                              </div>
                            </div>
                          )}
                          {!isEmpty && (
                            <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <label className="flex-1">
                                  <span className="text-[10px] font-black uppercase text-zinc-400">User renewal date</span>
                                  <input
                                    type="date"
                                    value={slotDateDraft}
                                    onChange={(event) => setDateDrafts((current) => ({ ...current, [slot.slot_id]: event.target.value }))}
                                    className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-black text-zinc-900 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                                  />
                                </label>
                                <button
                                  onClick={() => handleSlotRenewalDateSave(slot)}
                                  disabled={!slotDateDraft || slotDateDraft === slotSavedDate || savingDateFor === slot.slot_id}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 py-2.5 text-xs font-black text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Save size={14} /> {savingDateFor === slot.slot_id ? "Saving" : "Save date"}
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => setAssignSlot(slot)}
                              disabled={isEmpty && selectedSubscription.available_slots <= 0}
                              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700 disabled:opacity-50"
                            >
                              <UserPlus size={14} /> {isEmpty ? "Assign User" : "Replace User"}
                            </button>
                            {!isEmpty && (
                              <button onClick={() => handleRemove(slot)} className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-700 hover:bg-red-50 hover:text-red-600">
                                <UserMinus size={14} /> Remove User
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock size={18} className="text-violet-500" />
                <h2 className="text-lg font-black text-zinc-950">Activity Log</h2>
              </div>
              <div className="space-y-3">
                {activityLogs.map((log: any) => (
                  <div key={log._id} className="rounded-lg border border-zinc-100 p-3">
                    <p className="text-sm font-black text-zinc-900">{log.action_type?.replaceAll("_", " ") || "Admin action"}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">{log.details || log.reason || "Subscription activity updated"}</p>
                    <p className="mt-2 text-[11px] font-bold text-zinc-400">{log.admin_name || "Admin"} - {new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
                {activityLogs.length === 0 && <p className="text-sm font-bold text-zinc-400">No recent activity.</p>}
              </div>
            </section>
          </aside>
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
    </AdminPageShell>
  );
}
