import { useTranslation } from 'react-i18next';
import { Sun, Monitor, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const OPTIONS = [
  { value: 'light', icon: Sun },
  { value: 'system', icon: Monitor },
  { value: 'dark', icon: Moon },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label={t('theme.label')} className="flex gap-1 rounded-lg bg-[var(--color-surface-secondary)] p-1">
      {OPTIONS.map(({ value, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={t(`theme.${value}`)}
            onClick={() => setTheme(value)}
            className={`flex items-center justify-center rounded-md px-3 py-2 transition-colors
              ${active
                ? 'bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="ml-1.5 text-sm font-medium hidden sm:inline">
              {t(`theme.${value}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
