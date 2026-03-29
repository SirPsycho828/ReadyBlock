import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

export default function Plans() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pt-2">
      <h1
        className="text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('nav.plans')}
      </h1>
      <div
        className="flex flex-col items-center justify-center rounded-xl bg-[var(--color-surface-primary)] p-8 shadow-sm"
        style={{ borderRadius: 'var(--radius-community)', minHeight: 200 }}
      >
        <FileText size={48} className="text-[var(--color-text-secondary)] mb-3" aria-hidden="true" />
        <p className="text-sm text-[var(--color-text-secondary)] text-center">
          {t('empty.welfareChecks')}
        </p>
      </div>
    </div>
  );
}
