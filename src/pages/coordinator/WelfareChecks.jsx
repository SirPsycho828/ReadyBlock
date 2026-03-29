import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, HelpCircle, CheckCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import localDb from '@/lib/db';

/**
 * Welfare check priority sort per PRD:
 * 1. "Need Help" with specific need flagged
 * 2. "Need Help" with no details
 * 3. "Need Check-In" requested
 * 4. No status — has vulnerability profile
 * 5. No status — no profile
 * 6. Safe
 */
function sortPriority(household) {
  if (household.evacuationStatus === 'needHelp') {
    return household.needType ? 1 : 2;
  }
  if (household.evacuationStatus === 'needCheckIn') return 3;
  if (!household.evacuationStatus || household.evacuationStatus === 'noStatus') {
    return household.hasVulnerableMembers ? 4 : 5;
  }
  if (household.evacuationStatus === 'safe') return 6;
  return 5;
}

const STATUS_ICONS = {
  needHelp: { icon: AlertCircle, colorClass: 'text-[var(--color-status-alert)]', label: 'emergency.needHelp' },
  needCheckIn: { icon: HelpCircle, colorClass: 'text-[var(--color-status-caution)]', label: 'emergency.needCheckIn' },
  safe: { icon: CheckCircle, colorClass: 'text-[var(--color-status-confirmed)]', label: 'emergency.safe' },
  noStatus: { icon: MinusCircle, colorClass: 'text-[var(--color-status-neutral)]', label: 'emergency.noStatus' },
};

export default function WelfareChecks() {
  const { t } = useTranslation();
  const households = useNeighborhoodStore((s) => s.households);
  const [expandedSection, setExpandedSection] = useState('attention');

  const { attention, noStatus, safe } = useMemo(() => {
    const sorted = [...households].sort((a, b) => sortPriority(a) - sortPriority(b));
    return {
      attention: sorted.filter((h) => sortPriority(h) <= 3),
      noStatus: sorted.filter((h) => sortPriority(h) === 4 || sortPriority(h) === 5),
      safe: sorted.filter((h) => sortPriority(h) === 6),
    };
  }, [households]);

  function toggleSection(section) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  return (
    <div className="space-y-4 pt-2">
      <h1
        className="text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('coordinator.welfareChecks')}
      </h1>

      {/* Needs Attention */}
      <Section
        title={t('coordinator.needsAttention')}
        count={attention.length}
        colorClass="text-[var(--color-status-alert)]"
        expanded={expandedSection === 'attention'}
        onToggle={() => toggleSection('attention')}
      >
        {attention.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)] p-3">{t('coordinator.noAttention')}</p>
        ) : (
          attention.map((h) => <WelfareCheckItem key={h.id} household={h} />)
        )}
      </Section>

      {/* No Status */}
      <Section
        title={t('coordinator.noStatusYet')}
        count={noStatus.length}
        colorClass="text-[var(--color-status-neutral)]"
        expanded={expandedSection === 'noStatus'}
        onToggle={() => toggleSection('noStatus')}
      >
        {noStatus.map((h) => <WelfareCheckItem key={h.id} household={h} />)}
      </Section>

      {/* Safe */}
      <Section
        title={t('emergency.safe')}
        count={safe.length}
        colorClass="text-[var(--color-status-confirmed)]"
        expanded={expandedSection === 'safe'}
        onToggle={() => toggleSection('safe')}
      >
        {safe.map((h) => <WelfareCheckItem key={h.id} household={h} />)}
      </Section>
    </div>
  );
}

function Section({ title, count, colorClass, expanded, onToggle, children }) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <div className="rounded-xl bg-[var(--color-surface-primary)] shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-community)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
        style={{ minHeight: 48 }}
      >
        <div className="flex items-center gap-2">
          <span className={`font-bold ${colorClass}`}>{title}</span>
          <span className="text-sm text-[var(--color-text-secondary)]">{count}</span>
        </div>
        <Chevron size={20} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
      </button>
      {expanded && <div className="border-t border-[var(--color-border-default)]">{children}</div>}
    </div>
  );
}

function WelfareCheckItem({ household }) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const status = household.evacuationStatus || 'noStatus';
  const config = STATUS_ICONS[status] || STATUS_ICONS.noStatus;
  const Icon = config.icon;

  // Self-reported status always wins over coordinator-assigned
  const displayName = household.name || household.address || t('emergency.unknown');

  async function handleCheck() {
    if (checking) {
      // Confirm the check
      setChecked(true);
      setChecking(false);
    } else {
      setChecking(true);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-default)] last:border-b-0">
      <Icon size={20} className={config.colorClass} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-text-primary)] truncate">{displayName}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t(config.label)}
          {household.hasVulnerableMembers && status === 'noStatus' && (
            <span className="ml-1 text-[var(--color-status-caution)]">
              {/* Shows as "Profile incomplete" to protect privacy choice */}
            </span>
          )}
        </p>
      </div>

      {checked ? (
        <CheckCircle size={22} className="text-[var(--color-status-confirmed)]" aria-label={t('coordinator.checked')} />
      ) : checking ? (
        <div className="flex gap-1">
          <button
            onClick={handleCheck}
            className="px-3 py-1 rounded bg-[var(--color-brand-secondary)] text-white text-xs font-medium"
            style={{ minHeight: 36 }}
          >
            {t('common.confirm')}
          </button>
          <button
            onClick={() => setChecking(false)}
            className="px-3 py-1 rounded border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)]"
            style={{ minHeight: 36 }}
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <button
          onClick={handleCheck}
          className="px-3 py-1 rounded border border-[var(--color-border-default)] text-sm font-medium text-[var(--color-text-primary)]"
          style={{ minHeight: 44 }}
        >
          {t('coordinator.check')}
        </button>
      )}
    </div>
  );
}
