import { useTranslation } from 'react-i18next';
import { Map as MapIcon } from 'lucide-react';

export default function MapView() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pt-2">
      <h1
        className="text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('nav.map')}
      </h1>

      <div
        className="flex flex-col items-center justify-center rounded-xl bg-[var(--color-surface-primary)] p-8 shadow-sm"
        style={{ borderRadius: 'var(--radius-community)', minHeight: 300 }}
      >
        <MapIcon size={48} className="text-[var(--color-text-secondary)] mb-3" aria-hidden="true" />
        <p className="text-sm text-[var(--color-text-secondary)] text-center">
          {t('empty.residentMap', { block: 'Your Block' })}
        </p>
      </div>
    </div>
  );
}
