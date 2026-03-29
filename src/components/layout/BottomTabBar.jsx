import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Map, User, FileText, Settings, LayoutDashboard, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const RESIDENT_TABS = [
  { to: '/', icon: Home, labelKey: 'nav.home' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
  { to: '/plans', icon: FileText, labelKey: 'nav.plans' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

const COORDINATOR_TABS = [
  { to: '/', icon: Home, labelKey: 'nav.home' },
  { to: '/coordinator/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/coordinator/members', icon: Users, labelKey: 'nav.members' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

function isCoordinatorRole(role) {
  return ['blockCaptain', 'neighborhoodCaptain'].includes(role);
}

export function BottomTabBar() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);
  const tabs = isCoordinatorRole(role) ? COORDINATOR_TABS : RESIDENT_TABS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-[var(--color-surface-primary)] border-[var(--color-border-default)]"
      aria-label={t('nav.home')}
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors
              ${isActive
                ? 'text-[var(--color-brand-primary)] font-medium'
                : 'text-[var(--color-text-secondary)]'
              }`
            }
            style={{ minHeight: 56 }}
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} aria-hidden="true" />
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
