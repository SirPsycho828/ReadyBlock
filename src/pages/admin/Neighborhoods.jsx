import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminNeighborhoods() {
  const { t } = useTranslation();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'neighborhoods'));
        setNeighborhoods(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Offline
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = neighborhoods.filter((n) =>
    (n.name || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('nav.neighborhoods')}</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" aria-hidden="true" />
        <input
          type="text"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
          style={{ minHeight: 44, fontSize: 16, borderRadius: 'var(--radius-city)' }}
        />
      </div>

      {/* Table */}
      <div className="rounded bg-[var(--color-surface-primary)] shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-city)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-default)] text-left">
              <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.name')}</th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.households')}</th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.score')}</th>
              <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {filtered.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[var(--color-brand-primary)]" aria-hidden="true" />
                    <span className="font-medium text-[var(--color-text-primary)]">{n.name || n.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {n.registeredCount || 0} / {n.householdCount || 0}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-[var(--color-text-primary)]">{n.preparednessScore || 0}</span>
                </td>
                <td className="px-4 py-3">
                  {n.emergencyMode ? (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-[var(--color-status-alert)] text-white">
                      {t('emergency.activeEvent')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
                      {t('admin.normal')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-[var(--color-text-secondary)] text-center">{t('common.noResults')}</p>
        )}
      </div>
    </div>
  );
}
