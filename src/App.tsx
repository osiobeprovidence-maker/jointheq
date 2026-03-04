
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/auth/AuthGuards";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPanel from "./pages/AdminPanel";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import { ConsoleLogin, ConsoleDashboard } from "./pages/Console";

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/console" element={<ConsoleLogin />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel - Full Control Center */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Campaign Detail Page */}
        <Route
          path="/campaigns/:campaignId"
          element={
            <ProtectedRoute>
              <CampaignDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes (Console) */}
        <Route
          path="/console/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <ConsoleDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
