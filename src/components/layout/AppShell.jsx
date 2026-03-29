import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { BottomTabBar } from './BottomTabBar';
import { TopNavBar } from './TopNavBar';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';

function isCityRole(role) {
  return role === 'cityCountyCaptain';
}

export function AppShell() {
  const role = useAuthStore((s) => s.role);
  useOnlineStatus();

  const cityPortal = isCityRole(role);

  if (cityPortal) {
    return (
      <div className="min-h-screen bg-white dark:bg-[var(--color-surface-app)]" style={{ fontFamily: 'var(--font-body)' }}>
        <TopNavBar />
        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    );
  }

  // Community portal (residents + coordinators)
  return (
    <div className="min-h-screen bg-[var(--color-surface-app)]" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Sync banner at top */}
      <SyncStatusIndicator />

      <main className="mx-auto max-w-lg px-4 pb-20 pt-4">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  );
}
