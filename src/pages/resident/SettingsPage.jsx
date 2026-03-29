import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut, Globe, Palette, Bell, Shield, ChevronRight, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser, forceSignOut } from '@/services/auth.service';
import { hasQueuedWrites } from '@/services/offlineQueue';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const [showSignOutWarning, setShowSignOutWarning] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  async function handleSignOut() {
    const result = await signOutUser();
    if (result.success) {
      navigate('/auth/sign-in', { replace: true });
    } else if (result.error === 'queue-not-empty') {
      setQueueCount(result.data.queueCount);
      setShowSignOutWarning(true);
    }
  }

  async function handleForceSignOut() {
    await forceSignOut();
    navigate('/auth/sign-in', { replace: true });
  }

  return (
    <div className="space-y-4 pt-2">
      <h1
        className="text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('nav.settings')}
      </h1>

      {/* Account */}
      <SettingsSection title={t('settings.account')}>
        <div className="px-4 py-3">
          <p className="font-medium text-[var(--color-text-primary)]">{user?.displayName || user?.email}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t(`roles.${role || 'unverified'}`)}</p>
        </div>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title={t('theme.label')}>
        <div className="px-4 py-3">
          <ThemeToggle />
        </div>
      </SettingsSection>

      {/* Language */}
      <SettingsSection title={t('settings.language')}>
        <div className="px-4 py-3 flex gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'es', label: 'Español' },
          ].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                i18n.language === code
                  ? 'bg-[var(--color-brand-primary)] text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
              style={{ minHeight: 44 }}
            >
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Notifications placeholder */}
      <SettingsSection title={t('settings.notifications')}>
        <div className="px-4 py-3">
          <p className="text-sm text-[var(--color-text-secondary)]">{t('settings.notificationsDescription')}</p>
        </div>
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title={t('settings.privacy')}>
        <SettingsLink icon={Shield} label={t('settings.dataSharingPreferences')} to="/onboarding" />
      </SettingsSection>

      {/* Sign out */}
      <div
        className="rounded-xl bg-[var(--color-surface-primary)] shadow-sm overflow-hidden"
        style={{ borderRadius: 'var(--radius-community)' }}
      >
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-4 text-[var(--color-status-alert)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          style={{ minHeight: 48 }}
        >
          <LogOut size={20} aria-hidden="true" />
          <span className="font-medium">{t('auth.signOut')}</span>
        </button>
      </div>

      {/* Sign-out warning dialog */}
      {showSignOutWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-sm rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-lg"
            style={{ borderRadius: 'var(--radius-community)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-[var(--color-status-caution)]" aria-hidden="true" />
              <h2 className="font-bold text-[var(--color-text-primary)]">{t('queue.warningTitle')}</h2>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {t('queue.signOutWarning', { count: queueCount })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutWarning(false)}
                className="flex-1 rounded-lg bg-[var(--color-brand-primary)] text-white font-medium"
                style={{ minHeight: 48 }}
              >
                {t('queue.staySignedIn')}
              </button>
              <button
                onClick={handleForceSignOut}
                className="flex-1 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-medium"
                style={{ minHeight: 48 }}
              >
                {t('queue.signOutAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div
      className="rounded-xl bg-[var(--color-surface-primary)] shadow-sm overflow-hidden"
      style={{ borderRadius: 'var(--radius-community)' }}
    >
      <div className="px-4 pt-3 pb-1">
        <h2 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SettingsLink({ icon: Icon, label, to }) {
  return (
    <a
      href={to}
      className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-secondary)] transition-colors"
      style={{ minHeight: 48 }}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
        <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
      </div>
      <ChevronRight size={16} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
    </a>
  );
}
