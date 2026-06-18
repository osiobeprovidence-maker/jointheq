import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

const hasActiveSubscription = async (ctx: any, userId: Id<"users">) => {
    const slots = await ctx.db
        .query("subscription_slots")
        .withIndex("by_user", (q: any) => q.eq("user_id", userId))
        .filter((q: any) => q.eq(q.field("status"), "filled"))
        .collect();
    return slots.length > 0;
};

const requireSubscriber = async (ctx: any, userId: Id<"users">) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.is_admin) return user;
    const active = await hasActiveSubscription(ctx, userId);
    if (!active) throw new Error("Active subscription required to access Q Hub");
    return user;
};

// ─── DISCUSSIONS ───

export const getDiscussionCategories = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("hub_discussion_categories").order("asc").collect();
    },
});

export const getDiscussions = query({
    args: { category: v.optional(v.string()), search: v.optional(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let query = ctx.db.query("hub_discussions").withIndex("by_last_activity");
        if (args.category) {
            query = query.filter((q: any) => q.eq(q.field("category"), args.category));
        }
        let posts = await query.order("desc").take(args.limit ?? 50);
        if (args.search) {
            const s = args.search.toLowerCase();
            posts = posts.filter(p => p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s));
        }
        const authorIds = [...new Set(posts.map(p => p.author_id))];
        const authors = await Promise.all(authorIds.map((id: any) => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map((a: any) => [a._id, a]));
        return posts.map(p => ({ ...p, author: authorMap.get(p.author_id) ?? null }));
    },
});

export const getDiscussion = query({
    args: { id: v.id("hub_discussions") },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if (!post) throw new Error("Post not found");
        const author = await ctx.db.get(post.author_id);
        return { ...post, author };
    },
});

export const createDiscussion = mutation({
    args: { userId: v.id("users"), title: v.string(), content: v.string(), category: v.string() },
    handler: async (ctx, args) => {
        await requireSubscriber(ctx, args.userId);
        const now = Date.now();
        const id = await ctx.db.insert("hub_discussions", {
            author_id: args.userId,
            title: args.title,
            content: args.content,
            category: args.category,
            like_count: 0,
            comment_count: 0,
            view_count: 0,
            last_activity_at: now,
            created_at: now,
        });
        return id;
    },
});

export const updateDiscussion = mutation({
    args: { postId: v.id("hub_discussions"), userId: v.id("users"), title: v.optional(v.string()), content: v.optional(v.string()), category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");
        const user = await ctx.db.get(args.userId);
        if (post.author_id !== args.userId && !user?.is_admin) throw new Error("Unauthorized");
        const updates: any = { updated_at: Date.now() };
        if (args.title) updates.title = args.title;
        if (args.content) updates.content = args.content;
        if (args.category) updates.category = args.category;
        await ctx.db.patch(args.postId, updates);
    },
});

export const deleteDiscussion = mutation({
    args: { postId: v.id("hub_discussions"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");
        const user = await ctx.db.get(args.userId);
        if (post.author_id !== args.userId && !user?.is_admin) throw new Error("Unauthorized");
        await ctx.db.delete(args.postId);
        const comments = await ctx.db.query("hub_discussion_comments").withIndex("by_post", (q: any) => q.eq("post_id", args.postId)).collect();
        await Promise.all(comments.map(c => ctx.db.delete(c._id)));
        const likes = await ctx.db.query("hub_discussion_likes").withIndex("by_post_user", (q: any) => q.eq("post_id", args.postId)).collect();
        await Promise.all(likes.map(l => ctx.db.delete(l._id)));
    },
});

export const togglePinDiscussion = mutation({
    args: { postId: v.id("hub_discussions"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");
        await ctx.db.patch(args.postId, { is_pinned: !post.is_pinned });
    },
});

// ─── COMMENTS ───

export const getComments = query({
    args: { postId: v.id("hub_discussions") },
    handler: async (ctx, args) => {
        const comments = await ctx.db.query("hub_discussion_comments").withIndex("by_post", (q: any) => q.eq("post_id", args.postId)).order("asc").collect();
        const authorIds = [...new Set(comments.map(c => c.author_id))];
        const authors = await Promise.all(authorIds.map((id: any) => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map((a: any) => [a._id, a]));
        return comments.map(c => ({ ...c, author: authorMap.get(c.author_id) ?? null }));
    },
});

export const createComment = mutation({
    args: { userId: v.id("users"), postId: v.id("hub_discussions"), content: v.string(), parentId: v.optional(v.id("hub_discussion_comments")) },
    handler: async (ctx, args) => {
        await requireSubscriber(ctx, args.userId);
        const now = Date.now();
        await ctx.db.insert("hub_discussion_comments", {
            post_id: args.postId,
            author_id: args.userId,
            parent_id: args.parentId,
            content: args.content,
            created_at: now,
        });
        const post = await ctx.db.get(args.postId);
        if (post) {
            await ctx.db.patch(args.postId, {
                comment_count: (post.comment_count || 0) + 1,
                last_activity_at: now,
            });
        }
    },
});

export const deleteComment = mutation({
    args: { commentId: v.id("hub_discussion_comments"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");
        const user = await ctx.db.get(args.userId);
        if (comment.author_id !== args.userId && !user?.is_admin) throw new Error("Unauthorized");
        await ctx.db.patch(args.commentId, { is_deleted: true });
        const post = await ctx.db.get(comment.post_id);
        if (post) {
            await ctx.db.patch(comment.post_id, { comment_count: Math.max(0, (post.comment_count || 0) - 1) });
        }
    },
});

// ─── LIKES ───

export const toggleLike = mutation({
    args: { userId: v.id("users"), postId: v.id("hub_discussions") },
    handler: async (ctx, args) => {
        await requireSubscriber(ctx, args.userId);
        const existing = await ctx.db.query("hub_discussion_likes").withIndex("by_post_user", (q: any) => q.eq("post_id", args.postId).eq("user_id", args.userId)).first();
        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");
        if (existing) {
            await ctx.db.delete(existing._id);
            await ctx.db.patch(args.postId, { like_count: Math.max(0, (post.like_count || 0) - 1) });
            return { liked: false };
        } else {
            await ctx.db.insert("hub_discussion_likes", { post_id: args.postId, user_id: args.userId, created_at: Date.now() });
            await ctx.db.patch(args.postId, { like_count: (post.like_count || 0) + 1 });
            return { liked: true };
        }
    },
});

export const getLikedPosts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const likes = await ctx.db.query("hub_discussion_likes").withIndex("by_user", (q: any) => q.eq("user_id", args.userId)).collect();
        return new Set(likes.map(l => l.post_id));
    },
});

// ─── SAVE POSTS ───

export const toggleSavePost = mutation({
    args: { userId: v.id("users"), postId: v.id("hub_discussions") },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("hub_saved_posts").withIndex("by_post_user", (q: any) => q.eq("post_id", args.postId).eq("user_id", args.userId)).first();
        if (existing) {
            await ctx.db.delete(existing._id);
            return { saved: false };
        } else {
            await ctx.db.insert("hub_saved_posts", { post_id: args.postId, user_id: args.userId, created_at: Date.now() });
            return { saved: true };
        }
    },
});

export const getSavedPosts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const saved = await ctx.db.query("hub_saved_posts").withIndex("by_user", (q: any) => q.eq("user_id", args.userId)).order("desc").collect();
        const postIds = saved.map(s => s.post_id);
        const posts = await Promise.all(postIds.map((id: any) => ctx.db.get(id)));
        const validPosts = posts.filter(Boolean);
        const authorIds = [...new Set(validPosts.map((p: any) => p.author_id))];
        const authors = await Promise.all(authorIds.map((id: any) => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map((a: any) => [a._id, a]));
        return validPosts.map((p: any) => ({ ...p, author: authorMap.get(p.author_id) ?? null }));
    },
});

// ─── PROMPTS ───

export const getPrompts = query({
    args: { category: v.optional(v.string()), search: v.optional(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let query = ctx.db.query("hub_prompts").withIndex("by_created_at");
        if (args.category) {
            query = query.filter((q: any) => q.eq(q.field("category"), args.category));
        }
        let prompts = await query.order("desc").take(args.limit ?? 50);
        if (args.search) {
            const s = args.search.toLowerCase();
            prompts = prompts.filter(p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.content.toLowerCase().includes(s));
        }
        const authorIds = [...new Set(prompts.map(p => p.author_id))];
        const authors = await Promise.all(authorIds.map((id: any) => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map((a: any) => [a._id, a]));
        return prompts.map(p => ({ ...p, author: authorMap.get(p.author_id) ?? null }));
    },
});

export const getFeaturedPrompts = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db.query("hub_prompts").withIndex("by_featured", (q: any) => q.eq("is_featured", true)).order("desc").take(args.limit ?? 10);
    },
});

export const createPrompt = mutation({
    args: { userId: v.id("users"), title: v.string(), description: v.string(), category: v.string(), difficulty: v.string(), toolCompatibility: v.string(), content: v.string() },
    handler: async (ctx, args) => {
        await requireSubscriber(ctx, args.userId);
        return await ctx.db.insert("hub_prompts", {
            author_id: args.userId,
            title: args.title,
            description: args.description,
            category: args.category,
            difficulty: args.difficulty,
            tool_compatibility: args.toolCompatibility,
            content: args.content,
            copy_count: 0,
            avg_rating: 0,
            rating_count: 0,
            created_at: Date.now(),
        });
    },
});

export const incrementPromptCopy = mutation({
    args: { promptId: v.id("hub_prompts") },
    handler: async (ctx, args) => {
        const prompt = await ctx.db.get(args.promptId);
        if (!prompt) throw new Error("Prompt not found");
        await ctx.db.patch(args.promptId, { copy_count: (prompt.copy_count || 0) + 1 });
    },
});

export const ratePrompt = mutation({
    args: { userId: v.id("users"), promptId: v.id("hub_prompts"), rating: v.number() },
    handler: async (ctx, args) => {
        if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be 1-5");
        const existing = await ctx.db.query("hub_prompt_ratings").withIndex("by_prompt_user", (q: any) => q.eq("prompt_id", args.promptId).eq("user_id", args.userId)).first();
        const prompt = await ctx.db.get(args.promptId);
        if (!prompt) throw new Error("Prompt not found");
        if (existing) {
            await ctx.db.patch(existing._id, { rating: args.rating, created_at: Date.now() });
        } else {
            await ctx.db.insert("hub_prompt_ratings", { prompt_id: args.promptId, user_id: args.userId, rating: args.rating, created_at: Date.now() });
        }
        const allRatings = await ctx.db.query("hub_prompt_ratings").withIndex("by_prompt_user", (q: any) => q.eq("prompt_id", args.promptId)).collect();
        const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
        await ctx.db.patch(args.promptId, { avg_rating: Math.round(avg * 10) / 10, rating_count: allRatings.length });
    },
});

export const toggleSavePrompt = mutation({
    args: { userId: v.id("users"), promptId: v.id("hub_prompts") },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("hub_saved_prompts").withIndex("by_prompt_user", (q: any) => q.eq("prompt_id", args.promptId).eq("user_id", args.userId)).first();
        if (existing) {
            await ctx.db.delete(existing._id);
            return { saved: false };
        } else {
            await ctx.db.insert("hub_saved_prompts", { prompt_id: args.promptId, user_id: args.userId, created_at: Date.now() });
            return { saved: true };
        }
    },
});

export const getSavedPrompts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const saved = await ctx.db.query("hub_saved_prompts").withIndex("by_user", (q: any) => q.eq("user_id", args.userId)).order("desc").collect();
        const promptIds = saved.map(s => s.prompt_id);
        const prompts = await Promise.all(promptIds.map((id: any) => ctx.db.get(id)));
        return prompts.filter(Boolean);
    },
});

export const getUserPromptRating = query({
    args: { userId: v.id("users"), promptId: v.id("hub_prompts") },
    handler: async (ctx, args) => {
        const rating = await ctx.db.query("hub_prompt_ratings").withIndex("by_prompt_user", (q: any) => q.eq("prompt_id", args.promptId).eq("user_id", args.userId)).first();
        return rating?.rating ?? null;
    },
});

// ─── RESOURCES ───

export const getResources = query({
    args: { category: v.optional(v.string()), contentType: v.optional(v.string()), search: v.optional(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let query = ctx.db.query("hub_resources").withIndex("by_created_at");
        if (args.category) query = query.filter((q: any) => q.eq(q.field("category"), args.category));
        if (args.contentType) query = query.filter((q: any) => q.eq(q.field("content_type"), args.contentType));
        let resources = await query.order("desc").take(args.limit ?? 50);
        if (args.search) {
            const s = args.search.toLowerCase();
            resources = resources.filter(r => r.title.toLowerCase().includes(s) || r.description.toLowerCase().includes(s));
        }
        const authorIds = [...new Set(resources.map(r => r.author_id))];
        const authors = await Promise.all(authorIds.map((id: any) => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map((a: any) => [a._id, a]));
        return resources.map(r => ({ ...r, author: authorMap.get(r.author_id) ?? null }));
    },
});

export const createResource = mutation({
    args: { userId: v.id("users"), title: v.string(), description: v.string(), category: v.string(), contentType: v.string(), fileUrl: v.optional(v.string()), thumbnailUrl: v.optional(v.string()), fileSize: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        return await ctx.db.insert("hub_resources", {
            author_id: args.userId,
            title: args.title,
            description: args.description,
            category: args.category,
            content_type: args.contentType,
            file_url: args.fileUrl,
            file_size: args.fileSize,
            thumbnail_url: args.thumbnailUrl,
            download_count: 0,
            created_at: Date.now(),
        });
    },
});

// ─── COURSES ───

export const getCourses = query({
    args: { category: v.optional(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let query = ctx.db.query("hub_courses").withIndex("by_published", (q: any) => q.eq("is_published", true));
        if (args.category) query = query.filter((q: any) => q.eq(q.field("category"), args.category));
        const courses = await query.order("desc").take(args.limit ?? 50);
        const authorIds = [...new Set(courses.map(c => c.author_id))];
        const authors = await Promise.all(authorIds.map((id: any) => ctx.db.get(id)));
        const authorMap = new Map(authors.filter(Boolean).map((a: any) => [a._id, a]));
        return courses.map(c => ({ ...c, author: authorMap.get(c.author_id) ?? null }));
    },
});

export const getCourse = query({
    args: { id: v.id("hub_courses") },
    handler: async (ctx, args) => {
        const course = await ctx.db.get(args.id);
        if (!course) throw new Error("Course not found");
        const author = await ctx.db.get(course.author_id);
        const modules = await ctx.db.query("hub_modules").withIndex("by_course", (q: any) => q.eq("course_id", args.id)).order("asc").collect();
        const moduleIds = modules.map(m => m._id);
        const lessonsByModule: Record<string, any[]> = {};
        for (const mid of moduleIds) {
            lessonsByModule[mid as any] = await ctx.db.query("hub_lessons").withIndex("by_module", (q: any) => q.eq("module_id", mid)).order("asc").collect();
        }
        return { ...course, author, modules: modules.map(m => ({ ...m, lessons: lessonsByModule[m._id as any] || [] })) };
    },
});

export const createCourse = mutation({
    args: { userId: v.id("users"), title: v.string(), description: v.string(), category: v.string(), difficulty: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        return await ctx.db.insert("hub_courses", {
            author_id: args.userId,
            title: args.title,
            description: args.description,
            category: args.category,
            difficulty: args.difficulty,
            module_count: 0,
            lesson_count: 0,
            enrollment_count: 0,
            completion_rate: 0,
            is_published: false,
            created_at: Date.now(),
        });
    },
});

export const updateCourse = mutation({
    args: { courseId: v.id("hub_courses"), userId: v.id("users"), title: v.optional(v.string()), description: v.optional(v.string()), isPublished: v.optional(v.boolean()), thumbnailUrl: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        const updates: any = { updated_at: Date.now() };
        if (args.title) updates.title = args.title;
        if (args.description) updates.description = args.description;
        if (args.isPublished !== undefined) updates.is_published = args.isPublished;
        if (args.thumbnailUrl !== undefined) updates.thumbnail_url = args.thumbnailUrl;
        await ctx.db.patch(args.courseId, updates);
    },
});

export const createModule = mutation({
    args: { userId: v.id("users"), courseId: v.id("hub_courses"), title: v.string(), description: v.optional(v.string()), sortOrder: v.number() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        const id = await ctx.db.insert("hub_modules", {
            course_id: args.courseId,
            title: args.title,
            description: args.description,
            sort_order: args.sortOrder,
            lesson_count: 0,
            created_at: Date.now(),
        });
        const course = await ctx.db.get(args.courseId);
        if (course) await ctx.db.patch(args.courseId, { module_count: (course.module_count || 0) + 1 });
        return id;
    },
});

export const createLesson = mutation({
    args: { userId: v.id("users"), moduleId: v.id("hub_modules"), courseId: v.id("hub_courses"), title: v.string(), contentType: v.string(), videoUrl: v.optional(v.string()), textContent: v.optional(v.string()), sortOrder: v.number() },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        const id = await ctx.db.insert("hub_lessons", {
            module_id: args.moduleId,
            course_id: args.courseId,
            title: args.title,
            content_type: args.contentType,
            video_url: args.videoUrl,
            text_content: args.textContent,
            sort_order: args.sortOrder,
            created_at: Date.now(),
        });
        const module = await ctx.db.get(args.moduleId);
        if (module) await ctx.db.patch(args.moduleId, { lesson_count: (module.lesson_count || 0) + 1 });
        const course = await ctx.db.get(args.courseId);
        if (course) await ctx.db.patch(args.courseId, { lesson_count: (course.lesson_count || 0) + 1 });
        return id;
    },
});

// ─── LESSON PROGRESS ───

export const getCourseProgress = query({
    args: { userId: v.id("users"), courseId: v.id("hub_courses") },
    handler: async (ctx, args) => {
        const progress = await ctx.db.query("hub_lesson_progress").withIndex("by_user_course", (q: any) => q.eq("user_id", args.userId).eq("course_id", args.courseId)).collect();
        const completed = progress.filter(p => p.completed).length;
        const lessons = await ctx.db.query("hub_lessons").withIndex("by_course", (q: any) => q.eq("course_id", args.courseId)).collect();
        const total = lessons.length;
        return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0, progress };
    },
});

export const markLessonComplete = mutation({
    args: { userId: v.id("users"), lessonId: v.id("hub_lessons"), courseId: v.id("hub_courses") },
    handler: async (ctx, args) => {
        await requireSubscriber(ctx, args.userId);
        const existing = await ctx.db.query("hub_lesson_progress").withIndex("by_user_course", (q: any) => q.eq("user_id", args.userId).eq("course_id", args.courseId).eq("lesson_id", args.lessonId)).first();
        if (existing) {
            if (!existing.completed) {
                await ctx.db.patch(existing._id, { completed: true, completed_at: Date.now() });
            }
            return;
        }
        await ctx.db.insert("hub_lesson_progress", {
            user_id: args.userId,
            lesson_id: args.lessonId,
            course_id: args.courseId,
            completed: true,
            completed_at: Date.now(),
            created_at: Date.now(),
        });
        const progress = await ctx.db.query("hub_lesson_progress").withIndex("by_user_course", (q: any) => q.eq("user_id", args.userId).eq("course_id", args.courseId)).collect();
        const completed = progress.filter(p => p.completed).length;
        const lessons = await ctx.db.query("hub_lessons").withIndex("by_course", (q: any) => q.eq("course_id", args.courseId)).collect();
        const total = lessons.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        await ctx.db.patch(args.courseId, { completion_rate: rate });
    },
});

export const getMyCourseProgress = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const progress = await ctx.db.query("hub_lesson_progress").withIndex("by_user", (q: any) => q.eq("user_id", args.userId)).collect();
        const courseMap: Record<string, { completed: number; total: number }> = {};
        for (const p of progress) {
            if (!courseMap[p.course_id as any]) courseMap[p.course_id as any] = { completed: 0, total: 0 };
            if (p.completed) courseMap[p.course_id as any].completed += 1;
        }
        const courseIds = Object.keys(courseMap);
        for (const cid of courseIds) {
            const lessons = await ctx.db.query("hub_lessons").withIndex("by_course", (q: any) => q.eq("course_id", cid as any)).collect();
            courseMap[cid].total = lessons.length;
        }
        return Object.entries(courseMap).map(([courseId, data]) => ({
            courseId: courseId as Id<"hub_courses">,
            ...data,
            percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        }));
    },
});

// ─── LIVE SESSIONS ───

export const getLiveSessions = query({
    args: { status: v.optional(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let q = ctx.db.query("hub_live_sessions").withIndex("by_date");
        if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
        return await q.order("desc").take(args.limit ?? 50);
    },
});

export const createLiveSession = mutation({
    args: { userId: v.id("users"), title: v.string(), description: v.string(), date: v.number(), time: v.string(), host: v.string(), meetingLink: v.optional(v.string()), accessCode: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        return await ctx.db.insert("hub_live_sessions", {
            title: args.title,
            description: args.description,
            date: args.date,
            time: args.time,
            host: args.host,
            host_id: args.userId,
            meeting_link: args.meetingLink,
            access_code: args.accessCode,
            registered_count: 0,
            status: "upcoming",
            created_by: args.userId,
            created_at: Date.now(),
        });
    },
});

export const registerForSession = mutation({
    args: { userId: v.id("users"), sessionId: v.id("hub_live_sessions") },
    handler: async (ctx, args) => {
        await requireSubscriber(ctx, args.userId);
        const existing = await ctx.db.query("hub_session_registrations").withIndex("by_session_user", (q: any) => q.eq("session_id", args.sessionId).eq("user_id", args.userId)).first();
        if (existing) throw new Error("Already registered");
        await ctx.db.insert("hub_session_registrations", { session_id: args.sessionId, user_id: args.userId, registered_at: Date.now() });
        const session = await ctx.db.get(args.sessionId);
        if (session) await ctx.db.patch(args.sessionId, { registered_count: (session.registered_count || 0) + 1 });
    },
});

export const getUserRegistrations = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const regs = await ctx.db.query("hub_session_registrations").withIndex("by_user", (q: any) => q.eq("user_id", args.userId)).collect();
        const sessionIds = regs.map(r => r.session_id);
        const sessions = await Promise.all(sessionIds.map((id: any) => ctx.db.get(id)));
        return sessions.filter(Boolean);
    },
});

// ─── DOWNLOADS ───

export const getDownloads = query({
    args: { category: v.optional(v.string()), search: v.optional(v.string()), featured: v.optional(v.boolean()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let q;
        if (args.featured) {
            q = ctx.db.query("hub_downloads").withIndex("by_featured", (f: any) => f.eq("is_featured", true));
        } else {
            q = ctx.db.query("hub_downloads").withIndex("by_created_at");
        }
        if (args.category) q = q.filter((f: any) => f.eq(f.field("category"), args.category));
        let downloads = await q.order("desc").take(args.limit ?? 50);
        if (args.search) {
            const s = args.search.toLowerCase();
            downloads = downloads.filter(d => d.title.toLowerCase().includes(s) || d.description.toLowerCase().includes(s));
        }
        return downloads;
    },
});

export const trackDownload = mutation({
    args: { userId: v.id("users"), downloadId: v.id("hub_downloads") },
    handler: async (ctx, args) => {
        const download = await ctx.db.get(args.downloadId);
        if (!download) throw new Error("Download not found");
        await ctx.db.patch(args.downloadId, { download_count: (download.download_count || 0) + 1 });
        await ctx.db.insert("hub_download_logs", { download_id: args.downloadId, user_id: args.userId, downloaded_at: Date.now() });
    },
});

export const createDownload = mutation({
    args: { userId: v.id("users"), title: v.string(), description: v.string(), category: v.string(), fileUrl: v.string(), fileType: v.string(), fileSize: v.optional(v.number()), thumbnailUrl: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        return await ctx.db.insert("hub_downloads", {
            author_id: args.userId,
            title: args.title,
            description: args.description,
            category: args.category,
            file_url: args.fileUrl,
            file_type: args.fileType,
            file_size: args.fileSize,
            thumbnail_url: args.thumbnailUrl,
            download_count: 0,
            created_at: Date.now(),
        });
    },
});

// ─── ANALYTICS ───

export const trackEvent = internalMutation({
    args: { eventType: v.string(), entityType: v.string(), entityId: v.string(), userId: v.optional(v.id("users")), metadata: v.optional(v.any()) },
    handler: async (ctx, args) => {
        await ctx.db.insert("hub_analytics_events", {
            event_type: args.eventType,
            entity_type: args.entityType,
            entity_id: args.entityId,
            user_id: args.userId,
            metadata: args.metadata,
            created_at: Date.now(),
        });
    },
});

export const getHubAnalytics = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.is_admin) throw new Error("Unauthorized");
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const activeMembers = await ctx.db.query("subscription_slots").withIndex("by_status", (q: any) => q.eq("status", "filled")).collect();
        const uniqueUsers = new Set(activeMembers.map(s => s.user_id).filter(Boolean));

        const events = await ctx.db.query("hub_analytics_events").filter((q: any) => q.gte(q.field("created_at"), thirtyDaysAgo)).collect();

        const downloads = await ctx.db.query("hub_downloads").withIndex("by_downloads").order("desc").take(10);

        const prompts = await ctx.db.query("hub_prompts").withIndex("by_created_at").order("desc").take(10);

        const courses = await ctx.db.query("hub_courses").filter((q: any) => q.eq(q.field("is_published"), true)).collect();

        const discussions = await ctx.db.query("hub_discussions").filter((q: any) => q.gte(q.field("created_at"), thirtyDaysAgo)).collect();

        const eventViews = events.filter(e => e.event_type === "view");
        const viewCounts: Record<string, number> = {};
        for (const ev of eventViews) {
            const key = `${ev.entity_type}:${ev.entity_id}`;
            viewCounts[key] = (viewCounts[key] || 0) + 1;
        }
        const mostViewed = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));

        return {
            activeMembers: uniqueUsers.size,
            totalDownloads: downloads.reduce((s, d) => s + (d.download_count || 0), 0),
            popularDownloads: downloads.filter(d => (d.download_count || 0) > 0).slice(0, 5),
            popularPrompts: prompts.filter(p => (p.copy_count || 0) > 0).slice(0, 5),
            courseCompletionRates: courses.map(c => ({ title: c.title, rate: c.completion_rate || 0 })),
            forumActivity: { totalPosts: discussions.length, postsLast30Days: discussions.length },
            mostViewedResources: mostViewed,
        };
    },
});

// ─── ACCESS CHECK ───

export const checkHubAccess = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return { hasAccess: false, isAdmin: false };
        if (user.is_admin) return { hasAccess: true, isAdmin: true };
        const active = await hasActiveSubscription(ctx, args.userId);
        return { hasAccess: active, isAdmin: false };
    },
});
