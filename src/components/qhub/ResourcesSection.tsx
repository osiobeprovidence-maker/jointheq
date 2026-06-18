import { useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import {
    BookOpen,
    Search,
    X,
    Loader2,
    ExternalLink,
    Download,
    FileText,
    Video,
    Link2,
    Image,
    File,
    ChevronDown,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const resourceCategories = ["all", "guides", "templates", "tutorials", "documentation", "tools", "other"];
const contentTypeIcons: Record<string, any> = {
    pdf: <FileText size={16} />,
    video: <Video size={16} />,
    link: <Link2 size={16} />,
    image: <Image size={16} />,
    doc: <File size={16} />,
};

export default function ResourcesSection() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");

    const resources = useQuery(api.qhub.getResources, {
        category: category === "all" ? undefined : category,
        search: search || undefined,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {resourceCategories.map((cat) => (
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
                    placeholder="Search resources..."
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!resources ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[2rem] p-12 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500 font-medium">No resources yet</p>
                    </div>
                ) : (
                    resources.map((r: any) => (
                        <motion.div
                            key={r._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all group"
                        >
                            {r.thumbnail_url && (
                                <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden mb-4">
                                    <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-zinc-500">{contentTypeIcons[r.content_type] || <File size={16} />}</span>
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{r.category}</span>
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{r.content_type}</span>
                            </div>
                            <h3 className="font-bold text-sm mb-1 group-hover:underline">{r.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{r.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{r.download_count ?? 0} downloads</span>
                                {r.file_url && (
                                    <a
                                        href={r.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-900 text-white px-3 py-1.5 rounded-full hover:bg-black transition-colors"
                                    >
                                        <ExternalLink size={12} />
                                        Open
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
