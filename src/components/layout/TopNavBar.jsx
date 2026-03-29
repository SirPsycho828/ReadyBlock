import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const ADMIN_LINKS = [
  { to: '/admin', labelKey: 'nav.overview', end: true },
  { to: '/admin/neighborhoods', labelKey: 'nav.neighborhoods' },
  { to: '/admin/reports', labelKey: 'nav.reports' },
];

export function TopNavBar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--color-surface-primary)] border-[var(--color-border-default)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span
            className="text-lg font-bold text-[var(--color-brand-primary)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('app.name')}
          </span>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {ADMIN_LINKS.map(({ to, labelKey, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-[var(--color-surface-secondary)] text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`
                }
                style={{ minHeight: 44 }}
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <SyncStatusIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
