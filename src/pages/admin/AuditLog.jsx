import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AuditLog() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100)),
        );
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Permission denied or offline
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('admin.auditLog')}</h1>

      <div className="rounded bg-[var(--color-surface-primary)] shadow-sm overflow-hidden" style={{ borderRadius: 'var(--radius-city)' }}>
        {loading ? (
          <p className="p-4 text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Shield size={40} className="mx-auto text-[var(--color-text-secondary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--color-text-secondary)]">{t('admin.noLogs')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-default)]">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{log.action}</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {log.timestamp?.toDate
                      ? log.timestamp.toDate().toLocaleString()
                      : ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {log.actorUid} ({log.actorRole})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
