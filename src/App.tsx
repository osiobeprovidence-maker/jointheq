
import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/auth/AuthGuards";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminEnhancedPage = lazy(() => import("./pages/AdminEnhancedPage"));
const CampaignDetailPage = lazy(() => import("./pages/CampaignDetailPage"));
const ConsoleLogin = lazy(() =>
  import("./pages/Console").then((module) => ({ default: module.ConsoleLogin })),
);
const ConsoleDashboard = lazy(() =>
  import("./pages/Console").then((module) => ({ default: module.ConsoleDashboard })),
);
const CampusDashboardPage = lazy(() => import("./pages/CampusDashboardPage"));
const AdminMigrationPage = lazy(() => import("./pages/AdminMigrationPage"));
const WalletFundingPage = lazy(() => import("./pages/WalletFundingPage"));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPaymentsPage"));
const ListSubscriptionPage = lazy(() => import("./pages/ListSubscriptionPage"));
const OwnerEarningsPage = lazy(() => import("./pages/OwnerEarningsPage"));
const AdminListingsPage = lazy(() => import("./pages/AdminListingsPage"));
const MigrationPage = lazy(() => import("./pages/MigrationPage"));
const GuestOnboardingPage = lazy(() => import("./pages/GuestOnboardingPage"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5f8] text-zinc-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-zinc-900/15 border-t-zinc-900 rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-widest uppercase text-zinc-500">Loading workspace</p>
      </div>
    </div>
  );
}

function ReferralRedirect() {
  const { refCode } = useParams();
  const normalizedRefCode = refCode?.trim();

  if (!normalizedRefCode) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/?ref=${encodeURIComponent(normalizedRefCode)}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/r/:refCode" element={<ReferralRedirect />} />
          <Route path="/guest-onboarding" element={<GuestOnboardingPage />} />
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

          {/* Enhanced Admin System */}
          <Route
            path="/admin/enhanced"
            element={
              <ProtectedRoute requireAdmin>
                <AdminEnhancedPage />
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
      </Suspense>
    </ErrorBoundary>
  );
}
