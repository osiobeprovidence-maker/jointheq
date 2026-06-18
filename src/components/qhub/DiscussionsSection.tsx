import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import {
    MessageSquare,
    Plus,
    Heart,
    Bookmark,
    MessageCircle,
    Search,
    X,
    Loader2,
    Send,
    Trash2,
    Pin,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { auth } from "../../lib/auth";
import toast from "react-hot-toast";

export default function DiscussionsSection() {
    const user = auth.getCurrentUser();
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [search, setSearch] = useState("");
    const [showNewPost, setShowNewPost] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Id<"hub_discussions"> | null>(null);
    const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });

    const categories = useQuery(api.qhub.getDiscussionCategories);
    const discussions = useQuery(api.qhub.getDiscussions, { category: selectedCategory, search: search || undefined });
    const likedPosts = useQuery(api.qhub.getLikedPosts, user?._id ? { userId: user._id as Id<"users"> } : "skip");
    const savedPosts = useQuery(api.qhub.getSavedPosts, user?._id ? { userId: user._id as Id<"users"> } : "skip");

    const createDiscussion = useMutation(api.qhub.createDiscussion);
    const toggleLike = useMutation(api.qhub.toggleLike);
    const toggleSavePost = useMutation(api.qhub.toggleSavePost);
    const deleteDiscussion = useMutation(api.qhub.deleteDiscussion);

    const handleCreatePost = async () => {
        if (!user || !newPost.title.trim() || !newPost.content.trim()) {
            toast.error("Title and content are required");
            return;
        }
        try {
            await createDiscussion({ userId: user._id as Id<"users">, title: newPost.title, content: newPost.content, category: newPost.category });
            toast.success("Post created!");
            setNewPost({ title: "", content: "", category: "general" });
            setShowNewPost(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create post");
        }
    };

    const handleLike = async (postId: Id<"hub_discussions">) => {
        if (!user) return;
        try {
            await toggleLike({ userId: user._id as Id<"users">, postId });
        } catch (err: any) {
            toast.error(err.message || "Failed to toggle like");
        }
    };

    const handleSave = async (postId: Id<"hub_discussions">) => {
        if (!user) return;
        try {
            await toggleSavePost({ userId: user._id as Id<"users">, postId });
        } catch (err: any) {
            toast.error(err.message || "Failed to save post");
        }
    };

    const handleDelete = async (postId: Id<"hub_discussions">) => {
        if (!user) return;
        if (!window.confirm("Delete this post permanently?")) return;
        try {
            await deleteDiscussion({ postId, userId: user._id as Id<"users"> });
            toast.success("Post deleted");
            if (selectedPost === postId) setSelectedPost(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        }
    };

    const isLiked = (postId: Id<"hub_discussions">) => likedPosts?.includes(postId) ?? false;
    const isSaved = (postId: Id<"hub_discussions">) => savedPosts?.some((s: any) => s._id === postId) ?? false;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory(undefined)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!selectedCategory ? "bg-zinc-900 text-white" : "bg-white text-gray-500 hover:bg-zinc-100"}`}
                    >
                        All
                    </button>
                    {categories?.map((cat: any) => (
                        <button
                            key={cat._id}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat.slug ? "bg-zinc-900 text-white" : "bg-white text-gray-500 hover:bg-zinc-100"}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowNewPost(true)}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-black transition-all scale-100 hover:scale-[1.02]"
                >
                    <Plus size={16} />
                    New Discussion
                </button>
            </div>

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search discussions..."
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

            {selectedPost ? (
                <DiscussionDetail
                    postId={selectedPost}
                    onBack={() => setSelectedPost(null)}
                    isLiked={isLiked}
                    isSaved={isSaved}
                    onLike={handleLike}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="space-y-3">
                    {!discussions ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={24} className="animate-spin text-gray-400" />
                        </div>
                    ) : discussions.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-12 text-center">
                            <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
                            <p className="text-gray-500 font-medium">No discussions yet</p>
                            <p className="text-sm text-gray-400 mt-1">Be the first to start a conversation!</p>
                        </div>
                    ) : (
                        discussions.map((post: any) => (
                            <motion.button
                                key={post._id}
                                onClick={() => setSelectedPost(post._id)}
                                className="w-full text-left bg-white rounded-[2rem] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all scale-100 hover:scale-[1.01]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {post.is_pinned && <Pin size={14} className="text-amber-500" />}
                                            <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">
                                                {post.category}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-base sm:text-lg truncate">{post.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                            {post.content}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Heart size={13} />
                                                {post.like_count ?? 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle size={13} />
                                                {post.comment_count ?? 0}
                                            </span>
                                            <span>by @{post.author?.username || "unknown"}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>
            )}

            <AnimatePresence>
                {showNewPost && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowNewPost(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-[2rem] p-6 shadow-2xl z-50 overflow-y-auto max-h-[85vh]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold">New Discussion</h2>
                                <button onClick={() => setShowNewPost(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
                                    <select
                                        value={newPost.category}
                                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                                    >
                                        {categories?.map((cat: any) => (
                                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                        {!categories?.length && <option value="general">General</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Title</label>
                                    <input
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Content</label>
                                    <textarea
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        rows={5}
                                        placeholder="Share your thoughts..."
                                        className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 resize-none"
                                    />
                                </div>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={!newPost.title.trim() || !newPost.content.trim()}
                                    className="w-full bg-zinc-900 text-white py-3 rounded-full font-bold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Post Discussion
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function DiscussionDetail({
    postId,
    onBack,
    isLiked,
    isSaved,
    onLike,
    onSave,
    onDelete,
}: {
    postId: Id<"hub_discussions">;
    onBack: () => void;
    isLiked: (id: Id<"hub_discussions">) => boolean;
    isSaved: (id: Id<"hub_discussions">) => boolean;
    onLike: (id: Id<"hub_discussions">) => void;
    onSave: (id: Id<"hub_discussions">) => void;
    onDelete: (id: Id<"hub_discussions">) => void;
}) {
    const user = auth.getCurrentUser();
    const [commentText, setCommentText] = useState("");

    const post = useQuery(api.qhub.getDiscussion, { id: postId });
    const comments = useQuery(api.qhub.getComments, { postId });
    const createComment = useMutation(api.qhub.createComment);
    const deleteComment = useMutation(api.qhub.deleteComment);

    const handleComment = async () => {
        if (!user || !commentText.trim()) return;
        try {
            await createComment({ userId: user._id as Id<"users">, postId, content: commentText });
            setCommentText("");
            toast.success("Comment added");
        } catch (err: any) {
            toast.error(err.message || "Failed to comment");
        }
    };

    const handleDeleteComment = async (commentId: Id<"hub_discussion_comments">) => {
        if (!user || !window.confirm("Delete this comment?")) return;
        try {
            await deleteComment({ commentId, userId: user._id as Id<"users"> });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete comment");
        }
    };

    if (!post) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
        );
    }

    const isAuthor = user?._id === post.author_id;
    const isAdmin = user?.is_admin || user?.role === "admin";

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-zinc-900 font-semibold text-sm transition-colors">
                <ChevronLeft size={18} />
                Back to discussions
            </button>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    {post.is_pinned && <Pin size={14} className="text-amber-500" />}
                    <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{post.category}</span>
                </div>
                <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>by @{post.author?.username || "unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onLike(postId)} className={`p-2 rounded-full transition-colors ${isLiked(postId) ? "text-red-500 bg-red-50" : "text-gray-400 hover:bg-zinc-100"}`}>
                            <Heart size={18} fill={isLiked(postId) ? "currentColor" : "none"} />
                        </button>
                        <span className="text-xs text-gray-400">{post.like_count ?? 0}</span>
                        <button onClick={() => onSave(postId)} className={`p-2 rounded-full transition-colors ${isSaved(postId) ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:bg-zinc-100"}`}>
                            <Bookmark size={18} fill={isSaved(postId) ? "currentColor" : "none"} />
                        </button>
                        {(isAuthor || isAdmin) && (
                            <button onClick={() => onDelete(postId)} className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <MessageCircle size={18} />
                    Comments ({comments?.length ?? 0})
                </h3>

                <div className="space-y-4 mb-6">
                    {!comments ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-gray-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((comment: any) => (
                            <div key={comment._id} className="bg-zinc-50 rounded-2xl p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-sm">@{comment.author?.username || "unknown"}</span>
                                    </div>
                                    {(user?._id === comment.author_id || isAdmin) && !comment.is_deleted && (
                                        <button onClick={() => handleDeleteComment(comment._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">
                                    {comment.is_deleted ? <span className="italic text-gray-400">[deleted]</span> : comment.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-zinc-50 border-none rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                        onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    />
                    <button
                        onClick={handleComment}
                        disabled={!commentText.trim()}
                        className="bg-zinc-900 text-white p-2.5 rounded-full hover:bg-black transition-colors disabled:opacity-40"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
