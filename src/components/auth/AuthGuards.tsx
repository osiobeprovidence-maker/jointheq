
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../../lib/auth";

interface AuthGuardProps {
    children: ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<AuthGuardProps> = ({ children, requireAdmin = false }) => {
    const location = useLocation();
    const user = auth.getCurrentUser();

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (requireAdmin && !auth.isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
