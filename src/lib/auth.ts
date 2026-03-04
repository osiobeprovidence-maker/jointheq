
import { User } from "../types";

const AUTH_STORAGE_KEY = "q_user";

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
    },

    logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('verification_days_remaining');
        localStorage.removeItem('verification_deadline');
        window.location.href = "/";
    },

    isAuthenticated: (): boolean => {
        return !!auth.getCurrentUser();
    },

    isAdmin: (): boolean => {
        const user = auth.getCurrentUser();
        return !!(user?.is_admin || user?.role === "admin");
    }
};
