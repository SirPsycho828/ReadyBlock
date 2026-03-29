import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';

export default function AdminOverview() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'neighborhoods'));
        setNeighborhoods(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Offline — could load from cache
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalHouseholds = neighborhoods.reduce((sum, n) => sum + (n.householdCount || 0), 0);
  const avgScore = neighborhoods.length > 0
    ? Math.round(neighborhoods.reduce((sum, n) => sum + (n.preparednessScore || 0), 0) / neighborhoods.length)
    : 0;
  const emergencies = neighborhoods.filter((n) => n.emergencyMode).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('nav.overview')}</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={MapPin} label={t('admin.neighborhoods')} value={neighborhoods.length} />
        <StatCard icon={Users} label={t('admin.households')} value={totalHouseholds} />
        <StatCard icon={BarChart3} label={t('admin.avgScore')} value={`${avgScore}/100`} />
        <StatCard
          icon={AlertTriangle}
          label={t('admin.activeEmergencies')}
          value={emergencies}
          alert={emergencies > 0}
        />
      </div>

      {/* Neighborhood list */}
      <div className="rounded bg-[var(--color-surface-primary)] shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-city)' }}>
        <div className="px-4 py-3 border-b border-[var(--color-border-default)]">
          <h2 className="font-bold text-[var(--color-text-primary)]">{t('nav.neighborhoods')}</h2>
        </div>
        {neighborhoods.length === 0 && !loading ? (
          <p className="p-4 text-sm text-[var(--color-text-secondary)]">{t('admin.noNeighborhoods')}</p>
        ) : (
          <div className="divide-y divide-[var(--color-border-default)]">
            {neighborhoods.map((n) => (
              <div key={n.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{n.name || n.id}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {n.registeredCount || 0} / {n.householdCount || 0} {t('admin.registered')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {n.emergencyMode && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-[var(--color-status-alert)] text-white">
                      {t('emergency.activeEvent')}
                    </span>
                  )}
                  <ScoreBadge score={n.preparednessScore || 0} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, alert }) {
  return (
    <div
      className={`rounded p-4 ${alert ? 'bg-[var(--color-status-alert-bg)] text-white' : 'bg-[var(--color-surface-primary)]'} shadow-sm`}
      style={{ borderRadius: 'var(--radius-city)' }}
    >
      <Icon size={20} className={alert ? 'text-white' : 'text-[var(--color-brand-primary)]'} aria-hidden="true" />
      <p className={`text-2xl font-bold mt-2 ${alert ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>{value}</p>
      <p className={`text-xs ${alert ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>{label}</p>
    </div>
  );
}

function ScoreBadge({ score }) {
  let colorClass = 'bg-[var(--color-status-alert)]';
  if (score >= 67) colorClass = 'bg-[var(--color-status-confirmed)]';
  else if (score >= 34) colorClass = 'bg-[var(--color-status-caution)]';

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold text-white ${colorClass}`} style={{ minWidth: 40 }}>
      {score}
    </span>
  );
}
