import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Undo2, Check, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { sendImAlive, getImAliveContacts } from '@/services/imAlive.service';
import { toast } from 'sonner';

const UNDO_WINDOW_SECONDS = 60;

export default function ImAlive() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [phase, setPhase] = useState('ready'); // ready | confirming | countdown | sent
  const [countdown, setCountdown] = useState(UNDO_WINDOW_SECONDS);
  const [contacts, setContacts] = useState([]);
  const [result, setResult] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      getImAliveContacts(user.uid).then(setContacts);
    }
  }, [user?.uid]);

  const handleSend = useCallback(() => {
    setPhase('countdown');
    setCountdown(UNDO_WINDOW_SECONDS);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Actually send
          doSend();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setUndoTimer(timer);
  }, [contacts]);

  async function doSend() {
    setPhase('sent');
    const res = await sendImAlive(contacts);
    if (res.success) {
      setResult(res.data);
      if (res.data.queued) {
        toast.success(t('emergency.imAliveQueued'));
      } else {
        toast.success(
          t('emergency.imAliveSent', {
            count: res.data.deliveredCount,
            total: res.data.totalCount,
          }),
        );
      }
    } else {
      toast.error(t('common.error'));
    }
  }

  function handleUndo() {
    if (undoTimer) {
      clearInterval(undoTimer);
      setUndoTimer(null);
    }
    setPhase('ready');
    setCountdown(UNDO_WINDOW_SECONDS);
  }

  return (
    <div className="space-y-6 pt-2">
      <h1
        className="text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('emergency.imAlive')}
      </h1>

      {phase === 'ready' && (
        <>
          <button
            onClick={() => setPhase('confirming')}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-[var(--color-brand-secondary)] text-white font-bold text-lg transition-colors hover:opacity-90"
            style={{ minHeight: 64, borderRadius: 'var(--radius-community)' }}
          >
            <Shield size={28} aria-hidden="true" />
            {t('emergency.imAlive')}
          </button>
          <p className="text-sm text-center text-[var(--color-text-secondary)]">
            {t('emergency.imAliveDescription', { count: contacts.length })}
          </p>
        </>
      )}

      {phase === 'confirming' && (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm space-y-4" style={{ borderRadius: 'var(--radius-community)' }}>
          <p className="text-lg font-medium text-[var(--color-text-primary)] text-center">
            {t('emergency.imAliveConfirm')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setPhase('ready')}
              className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] font-medium"
              style={{ minHeight: 48 }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSend}
              className="flex-1 rounded-lg bg-[var(--color-brand-secondary)] text-white font-medium flex items-center justify-center gap-2"
              style={{ minHeight: 48 }}
            >
              <Check size={18} aria-hidden="true" />
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm space-y-4 text-center" style={{ borderRadius: 'var(--radius-community)' }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-caution)]">
            <Clock size={32} className="text-white" aria-hidden="true" />
          </div>
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t('emergency.undoCountdown', { seconds: countdown })}
          </p>
          <button
            onClick={handleUndo}
            className="w-full rounded-lg border-2 border-[var(--color-status-caution)] text-[var(--color-status-caution)] font-medium flex items-center justify-center gap-2"
            style={{ minHeight: 48 }}
          >
            <Undo2 size={18} aria-hidden="true" />
            {t('emergency.imAliveUndo')}
          </button>
        </div>
      )}

      {phase === 'sent' && (
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm text-center space-y-3" style={{ borderRadius: 'var(--radius-community)' }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-confirmed)]">
            <Check size={32} className="text-white" aria-hidden="true" />
          </div>
          {result?.queued ? (
            <p className="text-[var(--color-text-primary)]">{t('emergency.imAliveQueued')}</p>
          ) : (
            <p className="text-[var(--color-text-primary)]">
              {t('emergency.imAliveSent', {
                count: result?.deliveredCount || 0,
                total: result?.totalCount || 0,
              })}
            </p>
          )}
          <button
            onClick={() => { setPhase('ready'); setResult(null); }}
            className="mt-4 text-sm font-medium text-[var(--color-brand-primary)]"
            style={{ minHeight: 44 }}
          >
            {t('common.done')}
          </button>
        </div>
      )}
    </div>
  );
}
