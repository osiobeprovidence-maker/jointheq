
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/auth/AuthGuards";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPanel from "./pages/AdminPanel";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import { ConsoleLogin, ConsoleDashboard } from "./pages/Console";
import CampusDashboardPage from "./pages/CampusDashboardPage";
import AdminMigrationPage from "./pages/AdminMigrationPage";
import WalletFundingPage from "./pages/WalletFundingPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import ListSubscriptionPage from "./pages/ListSubscriptionPage";
import OwnerEarningsPage from "./pages/OwnerEarningsPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import MigrationPage from "./pages/MigrationPage";

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

        <Route
          path="/admin/migrations"
          element={
            <ProtectedRoute requireAdmin>
              <AdminMigrationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fund-wallet"
          element={
            <ProtectedRoute>
              <WalletFundingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/listings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminListingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPaymentsPage />
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

        <Route
          path="/campus-dashboard"
          element={
            <ProtectedRoute>
              <CampusDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/list-subscription"
          element={
            <ProtectedRoute>
              <ListSubscriptionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute>
              <OwnerEarningsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/migrate"
          element={
            <ProtectedRoute>
              <MigrationPage />
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
