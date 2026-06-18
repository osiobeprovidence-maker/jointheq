import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "motion/react";
import {
    Download,
    Search,
    X,
    Loader2,
    File,
    FileText,
    Image,
    Video,
    Archive,
    ExternalLink,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";

const downloadCategories = ["all", "templates", "guides", "ebooks", "tools", "worksheets", "presentations", "other"];

const typeIcons: Record<string, any> = {
    pdf: <FileText size={16} />,
    doc: <FileText size={16} />,
    docx: <FileText size={16} />,
    xlsx: <FileText size={16} />,
    ppt: <FileText size={16} />,
    png: <Image size={16} />,
    jpg: <Image size={16} />,
    jpeg: <Image size={16} />,
    mp4: <Video size={16} />,
    zip: <Archive size={16} />,
    rar: <Archive size={16} />,
};

export default function DownloadsSection() {
    const user = auth.getCurrentUser();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");

    const downloads = useQuery(api.qhub.getDownloads, {
        category: category === "all" ? undefined : category,
        search: search || undefined,
    });
    const trackDownload = useMutation(api.qhub.trackDownload);

    const handleDownload = async (downloadId: Id<"hub_downloads">, fileUrl: string) => {
        if (!user) return;
        try {
            await trackDownload({ userId: user._id as Id<"users">, downloadId });
            window.open(fileUrl, "_blank", "noopener");
            toast.success("Download tracked");
        } catch (err: any) {
            window.open(fileUrl, "_blank", "noopener");
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
                {downloadCategories.map((cat) => (
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

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search downloads..."
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
                {!downloads ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : downloads.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[2rem] p-12 text-center">
                        <Download size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500 font-medium">No downloads yet</p>
                    </div>
                ) : (
                    downloads.map((d: any) => (
                        <motion.div
                            key={d._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all"
                        >
                            {d.thumbnail_url && (
                                <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden mb-4">
                                    <img src={d.thumbnail_url} alt={d.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-zinc-500">{typeIcons[d.file_type] || <File size={16} />}</span>
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{d.category}</span>
                                <span className="text-[10px] text-gray-400 uppercase">{d.file_type}</span>
                                {d.file_size && <span className="text-[10px] text-gray-400">{formatSize(d.file_size)}</span>}
                            </div>
                            <h3 className="font-bold text-sm mb-1">{d.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{d.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{d.download_count ?? 0} downloads</span>
                                <button
                                    onClick={() => handleDownload(d._id, d.file_url)}
                                    className="flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-black transition-colors"
                                >
                                    <Download size={12} />
                                    Download
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
