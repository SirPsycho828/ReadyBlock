import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Power } from 'lucide-react';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { activateEmergencyMode, deactivateEmergencyMode } from '@/services/neighborhood.service';
import { toast } from 'sonner';

export default function EmergencyMode() {
  const { t } = useTranslation();
  const { neighborhood, emergencyMode, emergencyEventName, setEmergencyMode } = useNeighborhoodStore();
  const [eventName, setEventName] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function handleActivate() {
    if (!eventName.trim()) return;
    const result = await activateEmergencyMode(neighborhood.id, eventName);
    if (result.success) {
      setEmergencyMode(true, eventName);
      setConfirming(false);
      toast.success(t('emergency.activated'));
    }
  }

  async function handleDeactivate() {
    const result = await deactivateEmergencyMode(neighborhood.id);
    if (result.success) {
      setEmergencyMode(false);
      toast.success(t('emergency.deactivated'));
    }
  }

  if (emergencyMode) {
    return (
      <div className="space-y-4 pt-2">
        {/* Emergency active banner */}
        <div className="rounded-xl bg-[var(--color-status-alert-bg)] p-4 text-white" style={{ borderRadius: 'var(--radius-community)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={24} aria-hidden="true" />
            <h1 className="text-xl font-bold">{t('emergency.activeEvent')}</h1>
          </div>
          <p className="text-lg font-medium">{emergencyEventName}</p>
        </div>

        <button
          onClick={handleDeactivate}
          className="w-full rounded-lg border-2 border-[var(--color-status-alert)] text-[var(--color-status-alert)] font-medium flex items-center justify-center gap-2"
          style={{ minHeight: 48 }}
        >
          <Power size={18} aria-hidden="true" />
          {t('emergency.endEvent')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <h1
        className="text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('emergency.activateTitle')}
      </h1>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full rounded-xl bg-[var(--color-status-alert)] text-white font-bold text-lg flex items-center justify-center gap-2"
          style={{ minHeight: 56, borderRadius: 'var(--radius-community)' }}
        >
          <AlertTriangle size={24} aria-hidden="true" />
          {t('emergency.activateButton')}
        </button>
      ) : (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-5 shadow-sm space-y-4" style={{ borderRadius: 'var(--radius-community)' }}>
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {t('emergency.eventNameLabel')}
            </label>
            <input
              id="eventName"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder={t('emergency.eventNamePlaceholder')}
              className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
              style={{ minHeight: 44, fontSize: 16 }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] font-medium"
              style={{ minHeight: 48 }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleActivate}
              disabled={!eventName.trim()}
              className="flex-1 rounded-lg bg-[var(--color-status-alert)] text-white font-medium disabled:opacity-50"
              style={{ minHeight: 48 }}
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
