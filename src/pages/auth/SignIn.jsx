import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { signIn, resetPassword } from '@/services/auth.service';
import { toast } from 'sonner';

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      const messages = {
        'invalid-credentials': t('auth.errors.invalidCredentials'),
        'not-found': t('auth.errors.invalidCredentials'),
        'rate-limited': t('auth.errors.rateLimited'),
        'network-unavailable': t('auth.errors.networkUnavailable'),
      };
      toast.error(messages[result.error] || t('common.error'));
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    const result = await resetPassword(resetEmail);
    setResetLoading(false);

    if (result.success) {
      toast.success(t('auth.resetEmailSent'));
      setShowReset(false);
      setResetEmail('');
    } else {
      toast.error(t('auth.errors.resetFailed'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-app)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-normal text-[var(--color-brand-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('app.name')}
          </h1>
          <p className="text-[var(--color-text-secondary)]">{t('app.tagline')}</p>
        </div>

        <div className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm" style={{ borderRadius: 'var(--radius-community)' }}>
          {showReset ? (
            <>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                {t('auth.resetPassword')}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                {t('auth.resetPasswordDescription')}
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {t('auth.email')}
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                    style={{ minHeight: 44, fontSize: 16 }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-lg bg-[var(--color-brand-primary)] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ minHeight: 48, fontSize: 16 }}
                >
                  {resetLoading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                  {t('auth.sendResetLink')}
                </button>
              </form>
              <button
                onClick={() => setShowReset(false)}
                className="mt-4 w-full text-center text-sm font-medium text-[var(--color-brand-primary)] hover:underline"
                style={{ minHeight: 44 }}
              >
                {t('auth.backToSignIn')}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
                {t('auth.signIn')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {t('auth.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                    style={{ minHeight: 44, fontSize: 16 }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)]">
                      {t('auth.password')}
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setResetEmail(email); }}
                      className="text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {t('auth.signIn')}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
                {t('auth.noAccount')}{' '}
                <Link to="/auth/sign-up" className="font-medium text-[var(--color-brand-primary)] hover:underline">
                  {t('auth.signUp')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
