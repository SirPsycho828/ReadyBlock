import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Users, Package, MapPin, FileText,
  ChevronRight, AlertTriangle, CheckCircle, Clock,
  Loader2, ArrowRight,
  Zap, Droplets, Utensils, Home as HomeIcon, Wrench, Radio, Heart,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { getHousehold } from '@/services/household.service';
import { getNeighborhoodResources } from '@/services/resource.service';
import { getNeighborhoodSkills } from '@/services/skills.service';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function ResidentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const neighborhood = useNeighborhoodStore((s) => s.neighborhood);
  const emergencyMode = useNeighborhoodStore((s) => s.emergencyMode);
  const emergencyEventName = useNeighborhoodStore((s) => s.emergencyEventName);
  const [household, setHousehold] = useState(null);
  const [checked, setChecked] = useState(false);
  const [neighborhoodResources, setNeighborhoodResources] = useState([]);
  const [neighborhoodSkills, setNeighborhoodSkills] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      getHousehold(user.uid).then((res) => {
        if (res.success) {
          setHousehold(res.data);
          if (!res.data?.profileComplete) {
            navigate('/onboarding', { replace: true });
            return;
          }
        } else {
          navigate('/auth/verify-address', { replace: true });
          return;
        }
        setChecked(true);
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!neighborhood?.id) return;
    getNeighborhoodResources(neighborhood.id).then((res) => {
      if (res.success) setNeighborhoodResources(res.data);
    });
    getNeighborhoodSkills(neighborhood.id).then((res) => {
      if (res.success) setNeighborhoodSkills(res.data.filter((s) => !s.withdrawnAt));
    });
  }, [neighborhood?.id]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center pt-20">
        <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  const profileComplete = household?.profileComplete;
  const hasAddress = !!household?.address;
  const displayName = user?.displayName || user?.email?.split('@')[0] || '';
  const readinessScore = neighborhood?.preparednessScore || 0;

  const setupSteps = [
    { done: hasAddress, label: t('dashboard.step_address'), to: '/auth/verify-address' },
    { done: profileComplete, label: t('dashboard.step_profile'), to: '/onboarding' },
    { done: false, label: t('dashboard.step_contacts'), to: '/profile' },
    { done: false, label: t('dashboard.step_resources'), to: '/profile' },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);

  const quickActions = [
    { icon: Users, label: t('dashboard.myHousehold'), description: household ? `${household.memberCount || 1} ${t('dashboard.members')}` : t('dashboard.notSetUp'), to: '/profile' },
    { icon: Package, label: t('household.resources'), description: t('dashboard.manageResources'), to: '/profile' },
    { icon: MapPin, label: t('nav.map'), description: t('dashboard.viewNeighborhood'), to: '/map' },
    { icon: FileText, label: t('nav.plans'), description: t('dashboard.emergencyPlans'), to: '/plans' },
  ];

  const resourceTypeConfig = {
    medical:        { icon: Heart,    label: t('resource.type.medical') },
    power:          { icon: Zap,      label: t('resource.type.power') },
    water:          { icon: Droplets, label: t('resource.type.water') },
    food:           { icon: Utensils, label: t('resource.type.food') },
    shelter:        { icon: HomeIcon, label: t('resource.type.shelter') },
    tools:          { icon: Wrench,   label: t('resource.type.tools') },
    communications: { icon: Radio,    label: t('resource.type.communications') },
  };

  const resourceCounts = {};
  for (const type of Object.keys(resourceTypeConfig)) {
    resourceCounts[type] = neighborhoodResources.filter((r) => r.type === type).length;
  }
  // Count legacy foodShelter as food
  resourceCounts.food += neighborhoodResources.filter((r) => r.type === 'foodShelter').length;

  return (
    <div className="space-y-6 pb-6 pt-2">
      {/* ── Header ── */}
      <div>
        <h1
          className="text-3xl tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('dashboard.welcome', { name: displayName })}
        </h1>
        {neighborhood && (
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={14} className="text-teal-400" aria-hidden="true" />
            <p className="text-sm text-teal-400/80">{neighborhood.name}</p>
          </div>
        )}
        {!neighborhood && (
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.noNeighborhood')}</p>
        )}
      </div>

      {/* ── Emergency Banner ── */}
      {emergencyMode && (
        <div className="rounded-2xl bg-coral-600 p-5 text-white shadow-lg shadow-coral-600/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{t('emergency.activeEvent')}</p>
              {emergencyEventName && <p className="text-sm text-white/80">{emergencyEventName}</p>}
            </div>
          </div>
          <Button asChild size="lg" className="w-full bg-white text-coral-600 hover:bg-white/90 font-bold rounded-xl">
            <Link to="/im-alive">
              <Shield size={20} aria-hidden="true" />
              {t('emergency.imAlive')}
            </Link>
          </Button>
        </div>
      )}

      {/* ── I'm Alive Button ── */}
      {!emergencyMode && (
        <Link
          to="/im-alive"
          className={cn(
            'group relative flex w-full items-center justify-center gap-3',
            'rounded-2xl bg-linear-to-r from-teal-500 to-teal-600',
            'py-4 text-lg font-bold text-white',
            'shadow-lg shadow-teal-600/25',
            'transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-110 active:scale-[0.98]',
          )}
        >
          <Shield size={24} aria-hidden="true" />
          {t('emergency.imAlive')}
        </Link>
      )}

      {/* ── Block Readiness Score ── */}
      {neighborhood && (
        <div className="rounded-2xl bg-linear-to-br from-teal-900/60 to-teal-800/40 border border-teal-400/15 p-5">
          <div className="flex items-end justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-400/70">
              {t('dashboard.blockReadiness', { defaultValue: 'Block Readiness' })}
            </p>
            <span
              className="text-4xl leading-none text-amber-400"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {readinessScore}<span className="text-xl text-amber-400/60">%</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-teal-950/60">
            <div
              className="h-full rounded-full bg-linear-to-r from-teal-400 to-amber-400 transition-all duration-500"
              style={{ width: `${Math.max(readinessScore, 2)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Setup Progress ── */}
      {!profileComplete && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
              <Clock size={16} className="text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t('dashboard.getStarted')}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.getStartedDescription')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Progress value={setupProgress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">{completedSteps}/{setupSteps.length}</span>
          </div>

          <div className="space-y-1 mb-4">
            {setupSteps.map((s) => (
              <Link
                key={s.label}
                to={s.to}
                className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-amber-500/10"
              >
                {s.done ? (
                  <CheckCircle size={18} className="shrink-0 text-teal-400" aria-hidden="true" />
                ) : (
                  <div className="h-4.5 w-4.5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={cn('text-sm', s.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                  {s.label}
                </span>
              </Link>
            ))}
          </div>

          <Button asChild className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
            <Link to={hasAddress ? '/onboarding' : '/auth/verify-address'}>
              {t('dashboard.completeSetup')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}

      {/* ── Quick Actions Grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to} className="group">
            <div className={cn(
              'flex h-full flex-col rounded-2xl p-4 transition-all',
              'border border-teal-400/12 bg-teal-900/30',
              'group-hover:border-teal-400/25 group-hover:bg-teal-900/50 group-hover:-translate-y-0.5',
              'group-hover:shadow-lg group-hover:shadow-teal-900/20',
            )}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10">
                <action.icon size={20} className="text-teal-400" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight">{action.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              <ChevronRight size={14} className="mt-auto self-end text-teal-400/40 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Neighborhood Stats ── */}
      {neighborhood && (
        <div className="rounded-2xl border border-teal-400/12 bg-teal-900/30 p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-teal-400/70">
            {t('dashboard.neighborhoodStatus')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-2xl leading-none text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {neighborhood.registeredCount || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">{t('dashboard.households')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl leading-none text-teal-400 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {neighborhood.preparednessScore || 0}<span className="text-sm text-teal-400/50">%</span>
              </p>
              <p className="text-[10px] text-muted-foreground">{t('dashboard.readiness')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl leading-none text-amber-400 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {neighborhoodResources.length}
              </p>
              <p className="text-[10px] text-muted-foreground">{t('dashboard.resources')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl leading-none text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {neighborhoodSkills.length}
              </p>
              <p className="text-[10px] text-muted-foreground">{t('dashboard.skills')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Resource Inventory ── */}
      {neighborhood && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-teal-400/70 px-1">
            {t('dashboard.neighborhoodStatus')} — {t('dashboard.resources')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(resourceTypeConfig).map(([type, { icon: Icon, label }]) => {
              const count = resourceCounts[type];
              return (
                <div
                  key={type}
                  className="resource-inventory-card group relative flex flex-col items-center rounded-xl border border-teal-400/10 bg-teal-900/40 p-3 text-center transition-all hover:border-teal-400/25"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-400/10 transition-colors group-hover:bg-teal-400/20">
                    <Icon size={20} className="text-teal-400" aria-hidden="true" />
                  </div>
                  <p
                    className={cn(
                      'text-xl leading-none mb-0.5',
                      count > 0 ? 'text-amber-400' : 'text-muted-foreground/40',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {count}
                  </p>
                  <p className="text-[9px] leading-tight text-muted-foreground">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
