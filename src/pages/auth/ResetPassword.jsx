import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phase, setPhase] = useState('verifying'); // verifying | form | success | error
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setPhase('error');
      setErrorMessage(t('auth.reset.invalidLink'));
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setPhase('form');
      })
      .catch(() => {
        setPhase('error');
        setErrorMessage(t('auth.reset.expiredLink'));
      });
  }, [oobCode, t]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error(t('auth.errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('auth.errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setPhase('success');
    } catch {
      toast.error(t('auth.reset.failed'));
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-app)] px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-normal text-[var(--color-brand-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('app.name')}
          </h1>
          <p className="text-[var(--color-text-secondary)]">{t('app.tagline')}</p>
        </div>

        <div
          className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm"
          style={{ borderRadius: 'var(--radius-community)' }}
        >
          {/* Verifying code */}
          {phase === 'verifying' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 size={32} className="animate-spin text-[var(--color-brand-primary)]" aria-hidden="true" />
              <p className="text-sm text-[var(--color-text-secondary)]">{t('auth.reset.verifying')}</p>
            </div>
          )}

          {/* Reset form */}
          {phase === 'form' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] mb-4">
                  <KeyRound size={28} className="text-[var(--color-brand-primary)]" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {t('auth.reset.title')}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {email}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {t('auth.reset.newPassword')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.reset.newPasswordPlaceholder')}
                    className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                    style={{ minHeight: 44, fontSize: 16 }}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                    style={{ minHeight: 44, fontSize: 16 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[var(--color-brand-primary)] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ minHeight: 48, fontSize: 16 }}
                >
                  {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                  {t('auth.reset.savePassword')}
                </button>
              </form>
            </>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-confirmed)]">
                <CheckCircle size={32} className="text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {t('auth.reset.successTitle')}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('auth.reset.successMessage')}
              </p>
              <Link
                to="/auth/sign-in"
                className="w-full rounded-lg bg-[var(--color-brand-primary)] font-medium text-white transition-colors hover:opacity-90 flex items-center justify-center"
                style={{ minHeight: 48, fontSize: 16 }}
              >
                {t('auth.signIn')}
              </Link>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-alert)]">
                <AlertCircle size={32} className="text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {t('auth.reset.errorTitle')}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {errorMessage}
              </p>
              <Link
                to="/auth/sign-in"
                className="w-full rounded-lg bg-[var(--color-brand-primary)] font-medium text-white transition-colors hover:opacity-90 flex items-center justify-center"
                style={{ minHeight: 48, fontSize: 16 }}
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
