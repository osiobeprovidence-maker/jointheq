import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "motion/react";
import {
    Video,
    Loader2,
    Calendar,
    Clock,
    MapPin,
    Users,
    ExternalLink,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";

const statusFilters = ["all", "upcoming", "live", "completed", "cancelled"];

export default function LiveSessionsSection() {
    const user = auth.getCurrentUser();
    const [statusFilter, setStatusFilter] = useState("upcoming");

    const sessions = useQuery(api.qhub.getLiveSessions, {
        status: statusFilter === "all" ? undefined : statusFilter,
    });
    const userRegistrations = useQuery(
        api.qhub.getUserRegistrations,
        user?._id ? { userId: user._id as Id<"users"> } : "skip"
    );
    const registerForSession = useMutation(api.qhub.registerForSession);

    const registeredIds = new Set(userRegistrations?.map((s: any) => s._id) ?? []);

    const handleRegister = async (sessionId: Id<"hub_live_sessions">) => {
        if (!user) return;
        try {
            await registerForSession({ userId: user._id as Id<"users">, sessionId });
            toast.success("Registered successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to register");
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            upcoming: "bg-blue-50 text-blue-600",
            live: "bg-green-50 text-green-600",
            completed: "bg-zinc-100 text-zinc-500",
            cancelled: "bg-red-50 text-red-500",
        };
        return styles[status] || "bg-zinc-100 text-zinc-500";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
                {statusFilters.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                            statusFilter === s ? "bg-zinc-900 text-white" : "bg-white text-gray-500 hover:bg-zinc-100"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {!sessions ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[2rem] p-12 text-center">
                        <Video size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500 font-medium">No sessions found</p>
                    </div>
                ) : (
                    sessions.map((s: any) => (
                        <motion.div
                            key={s._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold">{s.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusBadge(s.status)}`}>
                                    {s.status}
                                </span>
                            </div>

                            <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{formatDate(s.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>{s.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{s.host}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span>{s.registered_count ?? 0} registered{s.max_attendees ? ` / ${s.max_attendees}` : ""}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {s.status === "upcoming" && (
                                    registeredIds.has(s._id) ? (
                                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                                            <CheckCircle2 size={14} />
                                            Registered
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleRegister(s._id)}
                                            className="bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-black transition-colors"
                                        >
                                            Register
                                        </button>
                                    )
                                )}
                                {s.meeting_link && (s.status === "live" || s.status === "upcoming") && (
                                    <a
                                        href={s.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-emerald-600 transition-colors"
                                    >
                                        <ExternalLink size={12} />
                                        Join
                                    </a>
                                )}
                                {s.access_code && (
                                    <span className="text-[10px] text-gray-400">Code: {s.access_code}</span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
