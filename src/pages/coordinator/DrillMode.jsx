import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Play, Square } from 'lucide-react';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function DrillMode() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const neighborhood = useNeighborhoodStore((s) => s.neighborhood);
  const emergencyMode = useNeighborhoodStore((s) => s.emergencyMode);
  const [activeDrill, setActiveDrill] = useState(null);
  const [drillName, setDrillName] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function handleStartDrill() {
    if (!drillName.trim() || !neighborhood?.id) return;

    try {
      const ref = await addDoc(collection(db, 'drills'), {
        neighborhoodId: neighborhood.id,
        name: drillName,
        startedBy: user.uid,
        startedAt: serverTimestamp(),
        endedAt: null,
        participationRate: 0,
      });
      setActiveDrill({ id: ref.id, name: drillName });
      setShowForm(false);
      toast.success(t('emergency.drillStarted'));
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function handleEndDrill() {
    if (!activeDrill) return;
    try {
      await updateDoc(doc(db, 'drills', activeDrill.id), {
        endedAt: serverTimestamp(),
      });
      toast.success(t('emergency.drillComplete'));
      setActiveDrill(null);
      setDrillName('');
    } catch {
      toast.error(t('common.error'));
    }
  }

  // Block drills during active emergency
  if (emergencyMode) {
    return (
      <div className="space-y-4 pt-2">
        <h1 className="text-3xl text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          {t('coordinator.drills')}
        </h1>
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm text-center" style={{ borderRadius: 'var(--radius-community)' }}>
          <p className="text-[var(--color-text-secondary)]">{t('coordinator.drillBlockedDuringEmergency')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-3xl text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        {t('coordinator.drills')}
      </h1>

      {/* Active drill banner */}
      {activeDrill && (
        <div className="rounded-xl bg-[var(--color-status-caution)] p-4 text-[var(--color-text-primary)]" style={{ borderRadius: 'var(--radius-community)' }}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={20} aria-hidden="true" />
            <span className="font-bold">{t('emergency.drillBanner')}</span>
          </div>
          <p className="text-sm">{activeDrill.name}</p>
          <button
            onClick={handleEndDrill}
            className="mt-3 w-full rounded-lg bg-white text-[var(--color-text-primary)] font-medium flex items-center justify-center gap-2"
            style={{ minHeight: 44 }}
          >
            <Square size={16} aria-hidden="true" />
            {t('coordinator.endDrill')}
          </button>
        </div>
      )}

      {/* Start drill form */}
      {!activeDrill && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl bg-[var(--color-status-caution)] text-[var(--color-text-primary)] font-bold text-lg flex items-center justify-center gap-2"
          style={{ minHeight: 56, borderRadius: 'var(--radius-community)' }}
        >
          <Play size={24} aria-hidden="true" />
          {t('emergency.startDrill')}
        </button>
      )}

      {!activeDrill && showForm && (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-5 shadow-sm space-y-4" style={{ borderRadius: 'var(--radius-community)' }}>
          <div>
            <label htmlFor="drillName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {t('coordinator.drillName')}
            </label>
            <input
              id="drillName"
              type="text"
              value={drillName}
              onChange={(e) => setDrillName(e.target.value)}
              placeholder={t('coordinator.drillNamePlaceholder')}
              className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
              style={{ minHeight: 44, fontSize: 16 }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] font-medium"
              style={{ minHeight: 48 }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleStartDrill}
              disabled={!drillName.trim()}
              className="flex-1 rounded-lg bg-[var(--color-status-caution)] text-[var(--color-text-primary)] font-medium disabled:opacity-50"
              style={{ minHeight: 48 }}
            >
              {t('emergency.startDrill')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
