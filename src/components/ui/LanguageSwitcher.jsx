import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

/**
 * Compact language switcher.
 * When `fixed` (default), pins to top-right corner for standalone auth pages.
 * Pass `fixed={false}` when embedding inside an existing nav bar.
 */
export function LanguageSwitcher({ fixed = true }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('es') ? 'es' : 'en';
  const next = current === 'en' ? 'es' : 'en';
  const nextLabel = current === 'en' ? 'Español' : 'English';

  return (
    <button
      onClick={() => i18n.changeLanguage(next)}
      className={`${fixed ? 'fixed top-4 right-4 z-50' : ''} flex items-center gap-1.5 rounded-full bg-[var(--color-surface-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] transition-colors`}
      style={{ minHeight: 36 }}
      aria-label={`Switch to ${nextLabel}`}
    >
      <Globe size={14} aria-hidden="true" />
      {nextLabel}
    </button>
  );
}
