import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Package, Wrench, MapPin, FileText,
  ChevronRight, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { getHousehold } from '@/services/household.service';

export default function ResidentDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const neighborhood = useNeighborhoodStore((s) => s.neighborhood);
  const emergencyMode = useNeighborhoodStore((s) => s.emergencyMode);
  const emergencyEventName = useNeighborhoodStore((s) => s.emergencyEventName);
  const [household, setHousehold] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      getHousehold(user.uid).then((res) => {
        if (res.success) setHousehold(res.data);
      });
    }
  }, [user?.uid]);

  const profileComplete = household?.profileComplete;
  const hasAddress = !!household?.address;

  return (
    <div className="space-y-5 pt-2">
      {/* Welcome header */}
      <div>
        <h1
          className="text-3xl text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('dashboard.welcome', { name: user?.displayName || user?.email?.split('@')[0] || '' })}
        </h1>
        {neighborhood ? (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{neighborhood.name}</p>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t('dashboard.noNeighborhood')}</p>
        )}
      </div>

      {/* Emergency banner */}
      {emergencyMode && (
        <div
          className="rounded-xl p-4 bg-[var(--color-status-alert-bg)] text-white"
          style={{ borderRadius: 'var(--radius-community)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={20} aria-hidden="true" />
            <span className="font-bold text-lg">{t('emergency.activeEvent')}</span>
          </div>
          <p className="text-sm opacity-90">{emergencyEventName}</p>
          <Link
            to="/im-alive"
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-white text-[var(--color-status-alert)] font-bold"
            style={{ minHeight: 48 }}
          >
            <Shield size={20} aria-hidden="true" />
            {t('emergency.imAlive')}
          </Link>
        </div>
      )}

      {/* I'm Alive button — always visible */}
      {!emergencyMode && (
        <Link
          to="/im-alive"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-secondary)] text-white font-bold text-lg transition-colors hover:opacity-90"
          style={{ minHeight: 56, borderRadius: 'var(--radius-community)' }}
        >
          <Shield size={24} aria-hidden="true" />
          {t('emergency.imAlive')}
        </Link>
      )}

      {/* Setup progress — shown if profile incomplete */}
      {!profileComplete && (
        <div
          className="rounded-xl bg-[var(--color-surface-primary)] p-5 shadow-sm"
          style={{ borderRadius: 'var(--radius-community)' }}
        >
          <h2 className="font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Clock size={18} className="text-[var(--color-status-caution)]" aria-hidden="true" />
            {t('dashboard.getStarted')}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {t('dashboard.getStartedDescription')}
          </p>

          <div className="space-y-2">
            <SetupItem
              done={hasAddress}
              label={t('dashboard.step_address')}
              to="/auth/verify-address"
            />
            <SetupItem
              done={profileComplete}
              label={t('dashboard.step_profile')}
              to="/onboarding"
            />
            <SetupItem
              done={false}
              label={t('dashboard.step_contacts')}
              to="/profile"
            />
            <SetupItem
              done={false}
              label={t('dashboard.step_resources')}
              to="/profile"
            />
          </div>

          <Link
            to={hasAddress ? '/onboarding' : '/auth/verify-address'}
            className="mt-4 w-full flex items-center justify-center gap-1 rounded-lg bg-[var(--color-brand-primary)] text-white font-medium"
            style={{ minHeight: 48 }}
          >
            {t('dashboard.completeSetup')}
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Quick actions grid */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction
          icon={Users}
          label={t('dashboard.myHousehold')}
          description={household ? `${household.memberCount || 1} ${t('dashboard.members')}` : t('dashboard.notSetUp')}
          to="/profile"
        />
        <QuickAction
          icon={Package}
          label={t('household.resources')}
          description={t('dashboard.manageResources')}
          to="/profile"
        />
        <QuickAction
          icon={MapPin}
          label={t('nav.map')}
          description={t('dashboard.viewNeighborhood')}
          to="/map"
        />
        <QuickAction
          icon={FileText}
          label={t('nav.plans')}
          description={t('dashboard.emergencyPlans')}
          to="/plans"
        />
      </div>

      {/* Neighborhood stats — if assigned */}
      {neighborhood && (
        <div
          className="rounded-xl bg-[var(--color-surface-primary)] p-5 shadow-sm"
          style={{ borderRadius: 'var(--radius-community)' }}
        >
          <h2 className="font-bold text-[var(--color-text-primary)] mb-3">{t('dashboard.neighborhoodStatus')}</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--color-brand-primary)]">{neighborhood.registeredCount || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('dashboard.households')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-brand-secondary)]">{neighborhood.preparednessScore || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('dashboard.readiness')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{neighborhood.householdCount || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('dashboard.total')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupItem({ done, label, to }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors">
      {done ? (
        <CheckCircle size={20} className="text-[var(--color-status-confirmed)]" aria-hidden="true" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-[var(--color-border-default)]" />
      )}
      <span className={`text-sm ${done ? 'text-[var(--color-text-secondary)] line-through' : 'text-[var(--color-text-primary)]'}`}>
        {label}
      </span>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-[var(--color-surface-primary)] p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderRadius: 'var(--radius-community)', minHeight: 100 }}
    >
      <Icon size={24} className="text-[var(--color-brand-primary)] mb-2" aria-hidden="true" />
      <p className="font-medium text-sm text-[var(--color-text-primary)]">{label}</p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{description}</p>
    </Link>
  );
}
