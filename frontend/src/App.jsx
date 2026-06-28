/*
 * ARCHITECTURE RULES — App Entry Point
 *
 * 1. Auth pages (/login, /signup, /forgot-password, /reset-password)
 *    MUST use the shared <AuthLayout> wrapper — no inline layout logic.
 *
 * 2. Protected dashboard routes are nested under /dashboard/*
 *    and rendered inside DashboardLayout, which enforces the
 *    device-specific navigation system (Sidebar for desktop,
 *    BottomNav for mobile).
 *
 * 3. OnboardingWizard is rendered outside routes so it overlays
 *    any page when active. It is gated by OnboardingProvider.
 *
 * 4. Toaster is rendered once at root level — no duplicate toast
 *    containers anywhere in the tree.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import OnboardingWizard from './components/OnboardingWizard';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import InsightsPage from './pages/InsightsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import RequestsPage from './pages/RequestsPage';
import NotFoundPage from './pages/NotFoundPage';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__spinner" />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* PUBLIC ROUTES — always use AuthLayout wrapper */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />

      {/* PROTECTED DASHBOARD ROUTES — nested under DashboardLayout for nav enforcement */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="activities" element={<ActivityLogPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['owner']}><UserManagementPage /></ProtectedRoute>} />
        <Route path="requests" element={<ProtectedRoute roles={['owner', 'manager']}><RequestsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* CATCH ALL — redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  /*
   * OnboardingProvider wraps routes so onboarding state is available
   * to all pages. OnboardingWizard renders as a fixed overlay when
   * the owner starts the onboarding flow.
   */
  return (
    <OnboardingProvider>
      <AppRoutes />
      <OnboardingWizard />
    </OnboardingProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '0.875rem', borderRadius: 8, padding: '0.625rem 1rem' } }} />
      <AppContent />
    </AuthProvider>
  );
}
