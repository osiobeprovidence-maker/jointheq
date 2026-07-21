
import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/auth/AuthGuards";
import InstallBanner from "./components/InstallBanner";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminEnhancedPage = lazy(() => import("./pages/AdminEnhancedPage"));
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
const GuestOnboardingPage = lazy(() => import("./pages/GuestOnboardingPage"));
const QHubPage = lazy(() => import("./pages/QHubPage"));
const CampaignPage = lazy(() => import("./pages/CampaignPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RafflePage = lazy(() => import("./pages/RafflePage"));
const AdminRafflePage = lazy(() => import("./pages/AdminRafflePage"));
const PartnerLoginPage = lazy(() => import("./pages/PartnerLoginPage"));
const BundleDetailPage = lazy(() => import("./pages/BundleDetailPage"));

const AdminAcceptPage = lazy(() => import("./pages/AdminAcceptPage"));

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
          <Route path="/raffle" element={<RafflePage />} />
          <Route path="/partner-login" element={<PartnerLoginPage />} />
          <Route path="/partner" element={<Navigate to="/dashboard?tab=partnership" replace />} />
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

          <Route
            path="/admin/raffle/new"
            element={
              <ProtectedRoute requireAdmin>
                <AdminRafflePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/raffle/edit/:raffleId"
            element={
              <ProtectedRoute requireAdmin>
                <AdminRafflePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/campaigns/:campaignId"
            element={
              <ProtectedRoute>
                <CampaignPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/register/:refCode" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
              <Suspense fallback={<RouteFallback />}>
                <ListSubscriptionPage />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/bundle/:bundleId"
            element={
              <Suspense fallback={<RouteFallback />}>
                <BundleDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/q-hub"
            element={
              <ProtectedRoute>
                <QHubPage />
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
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Admin Invitation Acceptance */}
          <Route path="/admin-accept" element={<AdminAcceptPage />} />

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
      <InstallBanner />
    </ErrorBoundary>
  );
}
