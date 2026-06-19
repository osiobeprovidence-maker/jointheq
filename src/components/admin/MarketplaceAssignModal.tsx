import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Search, UserCheck, AlertCircle, Users } from "lucide-react";
import toast from "react-hot-toast";

interface MemberSlot {
    slot_id: Id<"subscription_slots">;
    slot_name: string;
    user_name: string;
    user_id?: Id<"users">;
    renewal?: string;
}

interface Props {
    listingId?: string;
    listingName: string;
    groupSlots: MemberSlot[];
    emptySlots: MemberSlot[];
    adminId: Id<"users">;
    groupIds: Id<"groups">[];
    onClose: () => void;
    onAssigned: () => void;
}

export const MarketplaceAssignModal: React.FC<Props> = ({
    listingId,
    listingName,
    groupSlots,
    emptySlots,
    adminId,
    groupIds,
    onClose,
    onAssigned,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [selectedUser, setSelectedUser] = useState<{ _id: Id<"users">; full_name: string; email: string } | null>(null);
    const [selectedSlots, setSelectedSlots] = useState<Set<Id<"subscription_slots">>>(new Set());
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery]);

    const searchEnabled = debouncedSearch.trim().length >= 2;
    const searchResults = useQuery(
        api.adminEnhanced.searchAllUsers,
        searchEnabled ? { search: debouncedSearch.trim(), limit: 15 } : "skip"
    );
    const userSubs = useQuery(
        api.adminEnhanced.getUserSubscriptionsSummary,
        selectedUser ? { userId: selectedUser._id } : "skip"
    );

    const assignToSlot = useMutation(api.adminEnhanced.adminAssignUserToExactSlot);
    const bulkAssign = useMutation(api.adminEnhanced.adminBulkAssignSlots);

    const filledUserIds = new Set(
        groupSlots.filter(s => s.user_id).map(s => s.user_id!.toString())
    );

    const toggleSlot = (slotId: Id<"subscription_slots">) => {
        setSelectedSlots(prev => {
            const next = new Set(prev);
            if (next.has(slotId)) next.delete(slotId);
            else next.add(slotId);
            return next;
        });
    };

    const handleAssign = useCallback(async () => {
        if (!selectedUser || selectedSlots.size === 0) return;
        setAssigning(true);
        try {
            if (selectedSlots.size === 1) {
                const slotId = [...selectedSlots][0];
                const slot = groupSlots.find(s => s.slot_id === slotId);
                if (slot?.user_id) {
                    await assignToSlot({
                        adminId,
                        userId: selectedUser._id,
                        slotId,
                        reason: "Replace user via Marketplace",
                    });
                } else {
                    await assignToSlot({
                        adminId,
                        userId: selectedUser._id,
                        slotId,
                        reason: "Assign via Marketplace",
                    });
                }
            } else {
                const assignments = [...selectedSlots].map(slotId => ({
                    slotId,
                    userId: selectedUser._id,
                }));
                await bulkAssign({
                    adminId,
                    assignments,
                    reason: "Bulk assign via Marketplace",
                });
            }
            toast.success(`Assigned ${selectedUser.full_name} to ${selectedSlots.size} slot(s)`);
            onAssigned();
            onClose();
        } catch (e: any) {
            toast.error(e.message || "Failed to assign user");
        } finally {
            setAssigning(false);
        }
    }, [selectedUser, selectedSlots, groupSlots, adminId, assignToSlot, bulkAssign, onAssigned, onClose]);

    const filteredUsers = (searchResults ?? []).filter((u: any) => u?._id && !filledUserIds.has(u._id.toString()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-black/5">
                    <div>
                        <h3 className="text-lg font-black text-zinc-900">Assign Member</h3>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">{listingName}</p>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Slot selection */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                            Target Slots ({selectedSlots.size} selected)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {emptySlots.map(slot => (
                                <button
                                    key={slot.slot_id}
                                    onClick={() => toggleSlot(slot.slot_id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedSlots.has(slot.slot_id) ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"}`}
                                >
                                    {slot.slot_name}
                                </button>
                            ))}
                            {emptySlots.length === 0 && (
                                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                                    <AlertCircle size={13} />
                                    No empty slots available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User search */}
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Search Users</p>
                        <label className="relative block">
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setSelectedUser(null); }}
                                placeholder="Type name or email..."
                                className="w-full h-11 rounded-2xl border border-black/8 bg-zinc-50 pl-10 pr-3 text-sm font-bold outline-none focus:border-zinc-900 focus:bg-white"
                            />
                        </label>
                    </div>

                    {/* Search results */}
                    {debouncedSearch.trim().length >= 2 && (
                        <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 px-1">
                            {!searchResults ? (
                                <div className="text-center py-6 text-gray-400 text-sm font-bold">Searching...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 text-sm font-bold">
                                    {searchResults.length > 0
                                        ? "All users in results are already members of this group"
                                        : "No users found"}
                                </div>
                            ) : filteredUsers.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${selectedUser?._id === u._id ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${selectedUser?._id === u._id ? "bg-white/20" : "bg-zinc-200"}`}>
                                        {u.full_name?.[0] || "?"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-sm font-black truncate ${selectedUser?._id === u._id ? "text-white" : "text-zinc-900"}`}>
                                            {u.full_name}
                                        </div>
                                        <div className={`text-xs font-bold truncate ${selectedUser?._id === u._id ? "text-white/60" : "text-gray-400"}`}>
                                            {u.email}
                                        </div>
                                    </div>
                                    {selectedUser?._id === u._id && <UserCheck size={16} className="text-white shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected user's current subscriptions */}
                    {selectedUser && userSubs && userSubs.length > 0 && (
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50">
                            <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-widest mb-2">
                                <Users size={13} />
                                Already in {userSubs.length} subscription(s)
                            </div>
                            <div className="space-y-1.5">
                                {userSubs.map(sub => (
                                    <div key={sub.slot_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 text-xs">
                                        <span className="font-bold text-zinc-800">{sub.service_name} - {sub.slot_name}</span>
                                        <span className="text-gray-400">Renews {sub.renewal_date || "N/A"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 p-5 border-t border-black/5">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl text-xs font-black bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedUser || selectedSlots.size === 0 || assigning}
                        className="px-5 py-2.5 rounded-2xl text-xs font-black bg-zinc-900 text-white hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {assigning ? "Assigning..." : `Assign to ${selectedSlots.size} slot(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
};
