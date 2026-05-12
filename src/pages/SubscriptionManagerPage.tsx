import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  Save,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { MainLayout } from "../layouts/MainLayout";
import { auth } from "../lib/auth";
import { fmtCurrency } from "../lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type ManagerStatus = "Active" | "Almost Full" | "Full" | "Expiring Soon";

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
  category: string;
  account_email: string;
  slots: SlotRecord[];
};

const statusStyles: Record<ManagerStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Almost Full": "bg-orange-50 text-orange-700 border-orange-100",
  Full: "bg-red-50 text-red-700 border-red-100",
  "Expiring Soon": "bg-violet-50 text-violet-700 border-violet-100",
};

function getDaysUntil(date?: string) {
  if (!date) return null;
  const ms = Date.parse(date);
  if (!Number.isFinite(ms)) return null;
  return Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000));
}

function getManagerStatus(subscription: SubscriptionRecord): ManagerStatus {
  const daysUntilRenewal = getDaysUntil(subscription.renewal_date);
  if (subscription.available_slots <= 0) return "Full";
  if (daysUntilRenewal !== null && daysUntilRenewal >= 0 && daysUntilRenewal <= 3) return "Expiring Soon";
  if (subscription.available_slots === 1) return "Almost Full";
  return "Active";
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
      {status}
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
  const [activeTab, setActiveTab] = useState("admin");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignSlot, setAssignSlot] = useState<SlotRecord | null>(null);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [savingDateFor, setSavingDateFor] = useState<string | null>(null);

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
    return matchesSearch && matchesService && matchesStatus;
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

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate("/admin")} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-zinc-400 hover:text-zinc-900">
              <ArrowLeft size={14} /> Back to admin
            </button>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">Subscription Manager</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-zinc-500">
              Manage accounts, slots, renewals, pricing, and user assignments from one clear workspace.
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
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px]">
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
                  {["All", "Active", "Almost Full", "Full", "Expiring Soon"].map((status) => <option key={status}>{status}</option>)}
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
    </MainLayout>
  );
}
