import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "motion/react";
import {
    Sparkles,
    Copy,
    Star,
    Bookmark,
    Search,
    X,
    Loader2,
    Check,
    ChevronDown,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";

const promptCategories = ["all", "writing", "coding", "design", "marketing", "business", "productivity", "education", "entertainment", "other"];

export default function PromptsSection() {
    const user = auth.getCurrentUser();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const prompts = useQuery(api.qhub.getPrompts, {
        category: category === "all" ? undefined : category,
        search: search || undefined,
    });
    const featured = useQuery(api.qhub.getFeaturedPrompts, { limit: 5 });
    const savedPrompts = useQuery(api.qhub.getSavedPrompts, user?._id ? { userId: user._id as Id<"users"> } : "skip");

    const incrementCopy = useMutation(api.qhub.incrementPromptCopy);
    const toggleSavePrompt = useMutation(api.qhub.toggleSavePrompt);
    const ratePrompt = useMutation(api.qhub.ratePrompt);

    const savedSet = new Set(savedPrompts?.map((p: any) => p._id) ?? []);

    const handleCopy = async (promptId: Id<"hub_prompts">, content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(promptId);
            incrementCopy({ promptId });
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleSave = async (promptId: Id<"hub_prompts">) => {
        if (!user) return;
        try {
            await toggleSavePrompt({ userId: user._id as Id<"users">, promptId });
            toast.success(savedSet.has(promptId) ? "Unsaved" : "Saved!");
        } catch (err: any) {
            toast.error(err.message || "Failed");
        }
    };

    const handleRate = async (promptId: Id<"hub_prompts">, rating: number) => {
        if (!user) return;
        try {
            await ratePrompt({ userId: user._id as Id<"users">, promptId, rating });
        } catch (err: any) {
            toast.error(err.message || "Failed to rate");
        }
    };

    return (
        <div className="space-y-6">
            {featured && featured.length > 0 && (
                <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[2rem] p-6 text-white">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-amber-400" />
                        <h3 className="font-bold">Featured Prompts</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {featured.slice(0, 4).map((p: any) => (
                            <div key={p._id} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                <h4 className="font-semibold text-sm mb-1">{p.title}</h4>
                                <p className="text-xs text-white/60 line-clamp-2">{p.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">{p.difficulty}</span>
                                    <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">{p.tool_compatibility}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {promptCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                                category === cat ? "bg-zinc-900 text-white" : "bg-white text-gray-500 hover:bg-zinc-100"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search prompts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white pl-12 pr-4 py-3 rounded-full border-none shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 text-sm"
                />
                {search && (
                    <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {!prompts ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[2rem] p-12 text-center">
                        <Sparkles size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500 font-medium">No prompts yet</p>
                    </div>
                ) : (
                    prompts.map((p: any) => (
                        <motion.div
                            key={p._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate">{p.title}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                                </div>
                                <button
                                    onClick={() => handleSave(p._id)}
                                    className={`shrink-0 p-2 rounded-full transition-colors ${savedSet.has(p._id) ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:bg-zinc-100"}`}
                                >
                                    <Bookmark size={16} fill={savedSet.has(p._id) ? "currentColor" : "none"} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{p.difficulty}</span>
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{p.tool_compatibility}</span>
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{p.category}</span>
                            </div>

                            <div className="bg-zinc-50 rounded-xl p-3 mb-3 font-mono text-xs text-gray-600 line-clamp-4 whitespace-pre-wrap max-h-24 overflow-y-auto">
                                {p.content}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} onClick={() => handleRate(p._id, star)} className="text-gray-300 hover:text-amber-400 transition-colors">
                                            <Star size={14} fill={star <= Math.round(p.avg_rating || 0) ? "currentColor" : "none"} className={star <= Math.round(p.avg_rating || 0) ? "text-amber-400" : ""} />
                                        </button>
                                    ))}
                                    {p.rating_count > 0 && (
                                        <span className="text-[10px] text-gray-400 ml-1">({p.rating_count})</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-400">{p.copy_count ?? 0} copies</span>
                                    <button
                                        onClick={() => handleCopy(p._id, p.content)}
                                        className="bg-zinc-900 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1"
                                    >
                                        {copiedId === p._id ? <Check size={12} /> : <Copy size={12} />}
                                        {copiedId === p._id ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
