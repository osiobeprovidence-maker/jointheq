
import { User } from "../types";

const AUTH_STORAGE_KEY = "q_user";
const NOTIFICATION_PROMPT_DUE_KEY = "q_notification_prompt_due_user";
const NOTIFICATION_PROMPT_ASKED_KEY = "q_notification_prompt_asked_user";

const getPromptUserId = (user: User) => String(user._id || user.email || "");

const queueNotificationPrompt = (user: User) => {
    if (typeof window === "undefined") return;

    const userId = getPromptUserId(user);
    if (!userId) return;

    const alreadyAskedForUser = sessionStorage.getItem(NOTIFICATION_PROMPT_ASKED_KEY) === userId;
    if (!alreadyAskedForUser) {
        sessionStorage.setItem(NOTIFICATION_PROMPT_DUE_KEY, userId);
    }
};

export const auth = {
    getCurrentUser: (): User | null => {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to parse auth user", e);
            return null;
        }
    },

    login: (user: User) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        queueNotificationPrompt(user);
    },

    logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('verification_days_remaining');
        localStorage.removeItem('verification_deadline');
        sessionStorage.removeItem(NOTIFICATION_PROMPT_DUE_KEY);
        sessionStorage.removeItem(NOTIFICATION_PROMPT_ASKED_KEY);
        sessionStorage.removeItem('notified_prompt_shown');
        window.location.href = "/";
    },

    getQueuedNotificationPromptUserId: (): string | null => {
        return sessionStorage.getItem(NOTIFICATION_PROMPT_DUE_KEY);
    },

    markNotificationPromptHandled: (user: User) => {
        const userId = getPromptUserId(user);
        if (!userId) return;

        sessionStorage.setItem(NOTIFICATION_PROMPT_ASKED_KEY, userId);
        sessionStorage.removeItem(NOTIFICATION_PROMPT_DUE_KEY);
        sessionStorage.removeItem('notified_prompt_shown');
    },

    isAuthenticated: (): boolean => {
        return !!auth.getCurrentUser();
    },

    isAdmin: (): boolean => {
        const user = auth.getCurrentUser();
        return !!(
            user?.is_admin || 
            user?.role === "admin" || 
            user?.admin_role === "super" || 
            user?.role === "super"
        );
    }
};
