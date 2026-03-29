import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { signUp } from '@/services/auth.service';
import { toast } from 'sonner';

export default function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('auth.errors.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('auth.errors.passwordTooShort'));
      return;
    }

    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/auth/verify-address', { replace: true });
    } else {
      const messages = {
        'email-in-use': t('auth.errors.emailInUse'),
        'invalid-data': t('auth.errors.invalidEmail'),
        'rate-limited': t('auth.errors.rateLimited'),
        'network-unavailable': t('auth.errors.networkUnavailable'),
      };
      toast.error(messages[result.error] || t('common.error'));
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
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
            {t('auth.createAccount')}
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
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {t('auth.createAccount')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
            {t('auth.hasAccount')}{' '}
            <Link to="/auth/sign-in" className="font-medium text-[var(--color-brand-primary)] hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
