import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import {
    GraduationCap,
    Loader2,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Circle,
    Play,
    FileText,
    Video,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";

const courseCategories = ["all", "getting-started", "advanced", "marketing", "design", "business", "technology"];

export default function CoursesSection() {
    const user = auth.getCurrentUser();
    const [category, setCategory] = useState("all");
    const [selectedCourse, setSelectedCourse] = useState<Id<"hub_courses"> | null>(null);

    const courses = useQuery(api.qhub.getCourses, {
        category: category === "all" ? undefined : category,
    });

    if (selectedCourse) {
        return (
            <CourseDetailView
                courseId={selectedCourse}
                onBack={() => setSelectedCourse(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
                {courseCategories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                            category === cat ? "bg-zinc-900 text-white" : "bg-white text-gray-500 hover:bg-zinc-100"
                        }`}
                    >
                        {cat === "all" ? "All" : cat.replace(/-/g, " ")}
                    </button>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!courses ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[2rem] p-12 text-center">
                        <GraduationCap size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500 font-medium">No courses yet</p>
                    </div>
                ) : (
                    courses.map((c: any) => (
                        <motion.button
                            key={c._id}
                            onClick={() => setSelectedCourse(c._id)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-left bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all group"
                        >
                            {c.thumbnail_url && (
                                <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden mb-4">
                                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <h3 className="font-bold group-hover:underline">{c.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3">{c.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{c.difficulty}</span>
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{c.category}</span>
                                <span className="text-[10px] text-gray-400">{c.module_count ?? 0} modules</span>
                            </div>
                            {(c.completion_rate ?? 0) > 0 && (
                                <div className="mt-3">
                                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${c.completion_rate}%` }} />
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1">{c.completion_rate}% completion</span>
                                </div>
                            )}
                        </motion.button>
                    ))
                )}
            </div>
        </div>
    );
}

function CourseDetailView({ courseId, onBack }: { courseId: Id<"hub_courses">; onBack: () => void }) {
    const user = auth.getCurrentUser();
    const [selectedLesson, setSelectedLesson] = useState<Id<"hub_lessons"> | null>(null);
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    const course = useQuery(api.qhub.getCourse, { id: courseId });
    const progress = useQuery(
        api.qhub.getCourseProgress,
        user?._id ? { userId: user._id as Id<"users">, courseId } : "skip"
    );
    const markComplete = useMutation(api.qhub.markLessonComplete);

    if (!course) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
        );
    }

    const completedLessonIds = new Set(progress?.progress?.filter((p: any) => p.completed).map((p: any) => p.lesson_id) ?? []);

    const handleMarkComplete = async (lessonId: Id<"hub_lessons">) => {
        if (!user) return;
        try {
            await markComplete({ userId: user._id as Id<"users">, lessonId, courseId });
            toast.success("Lesson completed!");
        } catch (err: any) {
            toast.error(err.message || "Failed");
        }
    };

    const allLessons = course.modules?.flatMap((m: any) => m.lessons ?? []) ?? [];
    const currentLesson = selectedLesson
        ? allLessons.find((l: any) => l._id === selectedLesson)
        : null;
    const currentModule = currentLesson
        ? course.modules?.find((m: any) => m.lessons?.some((l: any) => l._id === selectedLesson))
        : null;

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-zinc-900 font-semibold text-sm transition-colors">
                <ChevronLeft size={18} />
                Back to courses
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {currentLesson && currentLesson ? (
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                                {currentModule && <span>{currentModule.title}</span>}
                                {currentModule && <span>/</span>}
                                <span>Lesson {currentLesson.sort_order}</span>
                            </div>
                            <h2 className="text-xl font-bold mb-4">{currentLesson.title}</h2>

                            {currentLesson.content_type === "video" && currentLesson.video_url && (
                                <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden mb-4">
                                    <video
                                        src={currentLesson.video_url}
                                        controls
                                        className="w-full h-full"
                                        controlsList="nodownload"
                                    />
                                </div>
                            )}

                            {currentLesson.text_content && (
                                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                                    {currentLesson.text_content}
                                </div>
                            )}

                            {currentLesson.attachment_url && (
                                <a
                                    href={currentLesson.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 bg-zinc-100 text-zinc-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors"
                                >
                                    <FileText size={16} />
                                    Download Attachment
                                </a>
                            )}

                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100">
                                <button
                                    onClick={() => {
                                        const all = allLessons;
                                        const idx = all.findIndex((l: any) => l._id === selectedLesson);
                                        if (idx > 0) setSelectedLesson(all[idx - 1]._id);
                                    }}
                                    disabled={allLessons.findIndex((l: any) => l._id === selectedLesson) === 0}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                {!completedLessonIds.has(selectedLesson) && (
                                    <button
                                        onClick={() => handleMarkComplete(selectedLesson)}
                                        className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 transition-colors"
                                    >
                                        <CheckCircle2 size={16} />
                                        Mark Complete
                                    </button>
                                )}
                                {completedLessonIds.has(selectedLesson) && (
                                    <span className="flex items-center gap-1 text-emerald-500 text-sm font-semibold">
                                        <CheckCircle2 size={16} />
                                        Completed
                                    </span>
                                )}

                                <button
                                    onClick={() => {
                                        const all = allLessons;
                                        const idx = all.findIndex((l: any) => l._id === selectedLesson);
                                        if (idx < all.length - 1) setSelectedLesson(all[idx + 1]._id);
                                    }}
                                    disabled={allLessons.findIndex((l: any) => l._id === selectedLesson) === allLessons.length - 1}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                            <p className="text-gray-500 text-sm mb-4">{course.description}</p>
                            <div className="flex items-center gap-2 flex-wrap mb-4">
                                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{course.difficulty}</span>
                                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{course.category}</span>
                                <span className="text-xs text-gray-400">{course.module_count ?? 0} modules &middot; {course.lesson_count ?? 0} lessons</span>
                            </div>
                            {progress && (
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-semibold">Progress</span>
                                        <span className="text-gray-500">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress.percentage}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Course Content</h3>
                    {course.modules?.map((mod: any) => (
                        <div key={mod._id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setExpandedModule(expandedModule === mod._id ? null : mod._id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="text-left">
                                    <span className="text-xs text-gray-400">Module {mod.sort_order}</span>
                                    <h4 className="font-semibold text-sm">{mod.title}</h4>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className={`text-gray-400 transition-transform ${expandedModule === mod._id ? "rotate-90" : ""}`}
                                />
                            </button>
                            <AnimatePresence>
                                {expandedModule === mod._id && mod.lessons && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-zinc-100">
                                            {mod.lessons.map((lesson: any) => (
                                                <button
                                                    key={lesson._id}
                                                    onClick={() => setSelectedLesson(lesson._id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 ${
                                                        selectedLesson === lesson._id ? "bg-zinc-50 font-semibold" : ""
                                                    }`}
                                                >
                                                    {completedLessonIds.has(lesson._id) ? (
                                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <Circle size={16} className="text-gray-300 shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <span className="truncate block">{lesson.title}</span>
                                                        <span className="text-[10px] text-gray-400">{lesson.content_type}</span>
                                                    </div>
                                                    {lesson.content_type === "video" && <Video size={12} className="text-gray-400 shrink-0" />}
                                                    {lesson.content_type === "text" && <FileText size={12} className="text-gray-400 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
