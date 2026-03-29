import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function PendingVerification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);

  // When role changes from unverified, redirect to dashboard
  useEffect(() => {
    if (role && role !== 'unverified') {
      navigate('/', { replace: true });
    }
  }, [role, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-app)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-secondary)]">
          <Clock size={40} className="text-[var(--color-brand-secondary)]" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          {t('auth.pendingTitle')}
        </h1>

        <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          {t('auth.pendingMessage')}
        </p>

        <div
          className="rounded-xl bg-[var(--color-surface-primary)] p-4 shadow-sm"
          style={{ borderRadius: 'var(--radius-community)' }}
        >
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('auth.pendingWhileWaiting')}
          </p>
        </div>
      </div>
    </div>
  );
}
