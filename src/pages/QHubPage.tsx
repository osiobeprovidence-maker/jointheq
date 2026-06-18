import { useState } from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import {
    GraduationCap,
    MessageSquare,
    Sparkles,
    BookOpen,
    Video,
    Download,
    Loader2,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { auth } from "../lib/auth";
import DiscussionsSection from "../components/qhub/DiscussionsSection";
import PromptsSection from "../components/qhub/PromptsSection";
import ResourcesSection from "../components/qhub/ResourcesSection";
import CoursesSection from "../components/qhub/CoursesSection";
import LiveSessionsSection from "../components/qhub/LiveSessionsSection";
import DownloadsSection from "../components/qhub/DownloadsSection";

const hubTabs = [
    { id: "discussions", label: "Discussions", icon: <MessageSquare size={18} /> },
    { id: "prompts", label: "Prompt Library", icon: <Sparkles size={18} /> },
    { id: "resources", label: "Resources", icon: <BookOpen size={18} /> },
    { id: "courses", label: "Courses", icon: <GraduationCap size={18} /> },
    { id: "live", label: "Live Sessions", icon: <Video size={18} /> },
    { id: "downloads", label: "Downloads", icon: <Download size={18} /> },
];

type HubTab = (typeof hubTabs)[number]["id"];

export default function QHubPage() {
    const user = auth.getCurrentUser();
    const [activeTab, setActiveTab] = useState<HubTab>("discussions");

    const accessCheck = useQuery(
        api.qhub.checkHubAccess,
        user?._id ? { userId: user._id as any } : "skip"
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
                <div className="bg-white p-8 rounded-[2rem] shadow-lg text-center max-w-md">
                    <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-bold mb-2">Sign in Required</h2>
                    <p className="text-gray-500">Please sign in to access the Q Hub.</p>
                </div>
            </div>
        );
    }

    if (accessCheck === undefined) {
        return (
            <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f5f8]">
            <div className="lg:ml-64 pt-20 sm:pt-24 lg:pt-32 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {!accessCheck.hasAccess ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2rem] p-8 shadow-sm text-center max-w-lg mx-auto mt-20"
                    >
                        <GraduationCap size={64} className="mx-auto mb-6 text-gray-200" />
                        <h1 className="text-2xl font-bold mb-3">Q Hub</h1>
                        <p className="text-gray-500 mb-6">
                            The Q Hub is exclusive to subscribers. Subscribe to access discussions,
                            prompt library, courses, live sessions, and more.
                        </p>
                        <a
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-bold hover:bg-black transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </a>
                    </motion.div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6 sm:mb-8">
                            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Q Hub</h1>
                                <p className="text-sm text-gray-500">Community, learning & resources</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                            {hubTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all scale-100 hover:scale-[1.02] ${
                                        activeTab === tab.id
                                            ? "bg-zinc-900 text-white shadow-lg shadow-black/10"
                                            : "bg-white text-gray-600 hover:bg-zinc-100 hover:text-zinc-900"
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[60vh]">
                            <AnimatePresence mode="wait">
                                {activeTab === "discussions" && (
                                    <motion.div key="discussions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                                        <DiscussionsSection />
                                    </motion.div>
                                )}
                                {activeTab === "prompts" && (
                                    <motion.div key="prompts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                                        <PromptsSection />
                                    </motion.div>
                                )}
                                {activeTab === "resources" && (
                                    <motion.div key="resources" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                                        <ResourcesSection />
                                    </motion.div>
                                )}
                                {activeTab === "courses" && (
                                    <motion.div key="courses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                                        <CoursesSection />
                                    </motion.div>
                                )}
                                {activeTab === "live" && (
                                    <motion.div key="live" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                                        <LiveSessionsSection />
                                    </motion.div>
                                )}
                                {activeTab === "downloads" && (
                                    <motion.div key="downloads" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                                        <DownloadsSection />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
