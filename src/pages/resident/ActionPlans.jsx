import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, MapPin, Flame, Droplets, Mountain, Zap } from 'lucide-react';
import localDb from '@/lib/db';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';

const SCENARIO_ICONS = {
  fire: Flame,
  flood: Droplets,
  earthquake: Mountain,
  powerOutage: Zap,
};

export default function ActionPlans() {
  const { t } = useTranslation();
  const neighborhood = useNeighborhoodStore((s) => s.neighborhood);
  const [protocols, setProtocols] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const cached = await localDb.protocols.toArray();
      setProtocols(cached);
    }
    load();
  }, []);

  if (selected) {
    return (
      <div className="space-y-4 pt-2">
        <button
          onClick={() => setSelected(null)}
          className="text-sm font-medium text-[var(--color-brand-primary)]"
          style={{ minHeight: 44 }}
        >
          {t('common.back')}
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{selected.title}</h1>
        <div
          className="rounded-xl bg-[var(--color-surface-primary)] p-5 shadow-sm prose prose-sm max-w-none"
          style={{ borderRadius: 'var(--radius-community)', color: 'var(--color-text-primary)' }}
          dangerouslySetInnerHTML={{ __html: selected.content || '<p>No content yet.</p>' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-3xl text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        {t('nav.plans')}
      </h1>

      {/* Rally points */}
      {neighborhood && (neighborhood.primaryRallyPoint || neighborhood.backupRallyPoint) && (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-4 shadow-sm space-y-3" style={{ borderRadius: 'var(--radius-community)' }}>
          <h2 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <MapPin size={18} aria-hidden="true" />
            {t('plans.rallyPoints')}
          </h2>
          {neighborhood.primaryRallyPoint && (
            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">
                {t('plans.primary')}: {neighborhood.primaryRallyPoint.name}
              </p>
              {neighborhood.primaryRallyPoint.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{neighborhood.primaryRallyPoint.description}</p>
              )}
            </div>
          )}
          {neighborhood.backupRallyPoint && (
            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)]">
              <p className="font-medium text-[var(--color-text-primary)]">
                {t('plans.backup')}: {neighborhood.backupRallyPoint.name}
              </p>
              {neighborhood.backupRallyPoint.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{neighborhood.backupRallyPoint.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scenario plans */}
      {protocols.length > 0 ? (
        <div className="space-y-3">
          {protocols.map((plan) => {
            const Icon = SCENARIO_ICONS[plan.scenarioType] || FileText;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan)}
                className="w-full flex items-center gap-3 rounded-xl bg-[var(--color-surface-primary)] p-4 shadow-sm text-left"
                style={{ borderRadius: 'var(--radius-community)', minHeight: 56 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-secondary)]">
                  <Icon size={20} className="text-[var(--color-brand-primary)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{plan.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{plan.scenarioType}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-8 shadow-sm text-center" style={{ borderRadius: 'var(--radius-community)' }}>
          <FileText size={48} className="mx-auto text-[var(--color-text-secondary)] mb-3" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-secondary)]">{t('empty.welfareChecks')}</p>
        </div>
      )}
    </div>
  );
}
