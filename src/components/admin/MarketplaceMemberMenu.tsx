import React, { useState, useRef, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Eye, ArrowRight, Repeat, UserMinus, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
    member: {
        slot_id: Id<"subscription_slots">;
        user_id?: Id<"users">;
        user_name: string;
        slot_name: string;
    };
    adminId: Id<"users">;
    groupIds: Id<"groups">[];
    onViewProfile: (userId: Id<"users">) => void;
    onRemove: (slotId: Id<"subscription_slots">) => void;
    onReplace: (slotId: Id<"subscription_slots">) => void;
    onMove: (slotId: Id<"subscription_slots">, userId: Id<"users">) => void;
}

export const MarketplaceMemberMenu: React.FC<Props> = ({
    member,
    adminId,
    groupIds,
    onViewProfile,
    onRemove,
    onReplace,
    onMove,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const items = [
        {
            label: "View Profile",
            icon: <Eye size={14} />,
            onClick: () => { member.user_id && onViewProfile(member.user_id); setOpen(false); },
            danger: false,
        },
        {
            label: "Move To Another Group",
            icon: <ArrowRight size={14} />,
            onClick: () => { member.user_id && onMove(member.slot_id, member.user_id); setOpen(false); },
            danger: false,
        },
        {
            label: "Replace Member",
            icon: <Repeat size={14} />,
            onClick: () => { onReplace(member.slot_id); setOpen(false); },
            danger: false,
        },
        {
            label: "Remove From Group",
            icon: <UserMinus size={14} />,
            onClick: () => { onRemove(member.slot_id); setOpen(false); },
            danger: true,
        },
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                title="Member actions"
            >
                <MoreVertical size={14} />
            </button>
            {open && (
                <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl border border-black/5 bg-white shadow-xl shadow-black/10 py-1.5">
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={item.onClick}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-left transition-colors ${item.danger ? "text-red-500 hover:bg-red-50" : "text-zinc-700 hover:bg-zinc-50"}`}
                        >
                            <span className={`${item.danger ? "text-red-400" : "text-gray-400"}`}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
