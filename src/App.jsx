import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { initAuthListener } from '@/services/auth.service';
import { initializeSync } from '@/services/sync.service';
import { useAuthStore } from '@/stores/authStore';

// Layouts
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGate } from '@/components/layout/RoleGate';

// Auth pages
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import VerifyAddress from '@/pages/auth/VerifyAddress';
import PendingVerification from '@/pages/auth/PendingVerification';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthAction from '@/pages/auth/AuthAction';

// Resident pages
import ResidentDashboard from '@/pages/resident/Dashboard';
import MapView from '@/pages/resident/MapView';
import Profile from '@/pages/resident/Profile';
import ActionPlans from '@/pages/resident/ActionPlans';
import SettingsPage from '@/pages/resident/SettingsPage';
import Onboarding from '@/pages/resident/Onboarding';
import ImAlive from '@/pages/resident/ImAlive';

// Coordinator pages
import CoordinatorDashboard from '@/pages/coordinator/Dashboard';
import Members from '@/pages/coordinator/Members';
import EmergencyMode from '@/pages/coordinator/EmergencyMode';
import WelfareChecks from '@/pages/coordinator/WelfareChecks';
import DrillMode from '@/pages/coordinator/DrillMode';

// Admin pages
import AdminOverview from '@/pages/admin/Overview';
import AdminNeighborhoods from '@/pages/admin/Neighborhoods';
import AdminReports from '@/pages/admin/Reports';
import AuditLog from '@/pages/admin/AuditLog';

function SyncInitializer() {
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user) initializeSync();
  }, [user]);
  return null;
}

export default function App() {
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SyncInitializer />
        <Routes>
          {/* Auth routes — no shell */}
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/sign-up" element={<SignUp />} />
          <Route path="/auth/verify-address" element={<VerifyAddress />} />
          <Route path="/auth/pending" element={<PendingVerification />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/action" element={<AuthAction />} />

          {/* Onboarding — no shell */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Protected app routes — inside AppShell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Resident routes */}
            <Route index element={<ResidentDashboard />} />
            <Route path="map" element={<MapView />} />
            <Route path="profile" element={<Profile />} />
            <Route path="plans" element={<ActionPlans />} />
            <Route path="im-alive" element={<ImAlive />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Coordinator routes */}
            <Route path="coordinator">
              <Route
                path="dashboard"
                element={<RoleGate minRole="blockCaptain"><CoordinatorDashboard /></RoleGate>}
              />
              <Route
                path="members"
                element={<RoleGate minRole="blockCaptain"><Members /></RoleGate>}
              />
              <Route
                path="emergency"
                element={<RoleGate minRole="blockCaptain"><EmergencyMode /></RoleGate>}
              />
              <Route
                path="welfare-checks"
                element={<RoleGate minRole="blockCaptain"><WelfareChecks /></RoleGate>}
              />
              <Route
                path="drill"
                element={<RoleGate minRole="blockCaptain"><DrillMode /></RoleGate>}
              />
            </Route>

            {/* Admin routes */}
            <Route path="admin">
              <Route
                index
                element={<RoleGate allowedRoles={['cityCountyCaptain']}><AdminOverview /></RoleGate>}
              />
              <Route
                path="neighborhoods"
                element={<RoleGate allowedRoles={['cityCountyCaptain']}><AdminNeighborhoods /></RoleGate>}
              />
              <Route
                path="reports"
                element={<RoleGate allowedRoles={['cityCountyCaptain']}><AdminReports /></RoleGate>}
              />
              <Route
                path="audit"
                element={<RoleGate allowedRoles={['cityCountyCaptain']}><AuditLog /></RoleGate>}
              />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-primary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
