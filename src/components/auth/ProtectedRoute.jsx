import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-surface-app)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="animate-spin text-[var(--color-brand-primary)]"
            size={32}
            aria-hidden="true"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  return children;
}
